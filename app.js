//app.js

//load dependencies
var express = require('express');
var app = express();
var braintree = require("braintree");
var bodyParser = require("body-parser");
var nStore = require('nstore');
var winston = require('winston');


//setup payment variables
var  clientToken, transid, expirationDate1, number1, paymenttoken;

//this will be the client gateway used
//for processing transactions on behalf of merchants
var clientGateway;

//finish setting up logging
winston.add(winston.transports.File, { filename: 'logs/serverlogs.log'});

var partner_merchant_id = "abc37";

//load db
var merchants = nStore.new('data/merchants.db', function (){
  winston.log('info', 'Merchants Database Successfully loaded');
});

//create BT gateway with Sandbox Partner credentials
//these are emailed from BT Solutions
var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "pp_karlh",
  publicKey: "zdx75x7nh4zkxtbf",
  privateKey: "63e4830c585ad9c7a6ac941909cb9c7d"
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended:true
}));

//set the view engine to ejs
app.set('view engine', 'ejs');

//index page
app.get('/', function(req, res) {
  var tagline = "Welcome";
  res.render('pages/index', {
    tagline: tagline
  });
});

app.get('/signup', function(req, res) {
    //res.redirect("https://sandbox.braintreegateway.com/partners/pp_karlh/connect?partner_merchant_id=" + partner_merchant_id);
    res.render('pages/signup');
});

// test page 
app.get('/complete', function(req, res) {
    res.render('pages/complete');
});

// test page 
app.get('/cancel', function(req, res) {
    res.render('pages/cancel');
});

// test page 
app.get('/error', function(req, res) {
    res.render('pages/error');
});

//used for one time Braintree test Webhook
app.get("/credentials", function (req, res) {
  res.send(gateway.webhookNotification.verify(req.query.bt_challenge));
  winston.log('info', 'Braintree Challenge Webhook Received' );
});

//parse the webhook for partners API
app.post('/credentials', function(req, res) {
  
  var partnerMerchantId, merchantPublicId, publicKey, privateKey;
  
  //parse webhook
  gateway.webhookNotification.parse(
    req.body.bt_signature,
    req.body.bt_payload,
    function (err, webhookNotification) {
      if(webhookNotification.kind == "partner_merchant_connected") {
        winston.log('info',"New Credentials Received--------------------------------------");
        winston.log('info',"Webhook Received " + webhookNotification.timestamp + "] | Kind: " + webhookNotification.kind);
        winston.log('info',"Partner User ID: " + webhookNotification.partnerMerchant.partnerMerchantId);
        winston.log('info',"Merchant Public ID: " + webhookNotification.partnerMerchant.merchantPublicId);
        winston.log('info',"Public Key: " + webhookNotification.partnerMerchant.publicKey);
        winston.log('info',"Private Key: " + webhookNotification.partnerMerchant.privateKey);
        winston.log('info',"End-----------------------------------------------------------");
        partnerMerchantId = webhookNotification.partnerMerchant.partnerMerchantId;
        merchantPublicId = webhookNotification.partnerMerchant.merchantPublicId;
        publicKey = webhookNotification.partnerMerchant.publicKey;
        privateKey = webhookNotification.partnerMerchant.privateKey;
      }
      else {
        throw new Error('This endpoint expects a PartnerMerchantConnected webhook');
      }
    }
  );
  //store this merchant in the db
  merchants.save(partnerMerchantId, {merchant_public_id: merchantPublicId, public_key: publicKey, private_key: privateKey}, function(err, key) {
    if(err){
      winston.log('error', "Error saving record: " + key );
    }
    else {
      winston.log('info', "Record saved successfully: " + key );
    }
  });
  res.send(200);
  res.end();
});

//simulate a user logging in from a mobile app
app.get("/login", function(req,res){
    
    var merchant_id = req.query.id;
    
    merchants.get(merchant_id, function(err, doc, key){
      if(err){
        winston.log('error', "Error retrieving record: " + key );
      }
      else{
        //populate the client gateway
        clientGateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: doc.merchant_public_id,
        publicKey: doc.public_key,
        privateKey: doc.private_key
        });
      }
    });
    res.send(200);
});

// Serve the Mobile iOS Client with the token generated above
app.get("/client_token", function (req, res) {
    clientGateway.clientToken.generate({
    }, function (err, response) {
      if(err){
        winston.log('error', "Could not get client token");
      }
      else {
        winston.log('info', "Recieved Client Token");
        clientToken = response.clientToken;
        winston.log('info', 'Clientoken is '+ clientToken);
      }
    });
    res.send('{\"client_token\":\"'+clientToken+'\"}');
});

//redirect to BT for signup
app.post("/goBT", function (req, res){
  //grab the form data
  var merchantID = req.body.mid;
  //redirect to Braintree
  res.redirect("https://sandbox.braintreegateway.com/partners/pp_karlh/connect?partner_merchant_id=" + merchantID);
  
});

//handle grabbing the nonce from the client
app.post("/purchases", function (req, res){
  var nonce = req.body.payment_method_nonce;
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// simple error handlers

//development error handler
//will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('pages/error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('pages/error', {
        message: err.message,
        error: {}
    });
});

app.listen(process.env.PORT);
winston.log('8080 is the magic port');

module.exports = app;