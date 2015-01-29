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

//set up logging
//this will log to a file while also outputting to winston

// //create BT gateway with Sandbox credentials
// var gateway = braintree.connect({
//   environment: braintree.Environment.Sandbox,
//   merchantId: "pnw68ksp2qb7h39j", //orig
//   publicKey: "tyyh5nmq3746bqhj", //orig sandbox
//   privateKey: "9f094eabd9e0adffec2beaec8ca50142" //orig sandbox
// });

var partner_merchant_id = "abc37";
var merchants = nStore.new('data/merchants.db', function (){
  winston.log('info', 'Merchants Database Successfully loaded');
});

//finish setting up logging
winston.add(winston.transports.File, { filename: 'logs/serverlogs.log'});

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

//use res.render to load up an ejs view file

// gateway.clientToken.generate({
// }, function (err, response) {
//     winston.log("Recieved Client Token");
//     clientToken = response.clientToken;
//     winston.log('Clientoken is '+clientToken);
// });

//index page
app.get('/', function(req, res) {
  var tagline = "Welcome";
  res.render('pages/index', {
    tagline: tagline
  });
});

app.get('/signup', function(req, res) {
    res.redirect("https://sandbox.braintreegateway.com/partners/pp_karlh/connect?partner_merchant_id=" + partner_merchant_id);
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
        winston.log("New Credentials Received--------------------------------------");
        winston.log("Webhook Received " + webhookNotification.timestamp + "] | Kind: " + webhookNotification.kind);
        winston.log("Partner User ID: " + webhookNotification.partnerMerchant.partnerMerchantId);
        winston.log("Merchant Public ID: " + webhookNotification.partnerMerchant.merchantPublicId);
        winston.log("Public Key: " + webhookNotification.partnerMerchant.publicKey);
        winston.log("Private Key: " + webhookNotification.partnerMerchant.privateKey);
        winston.log("End-----------------------------------------------------------");
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

// Serve the Mobile iOS Client with the token generated above
app.get("/client_token", function (req, res) {
    res.send('{\"client_token\":\"'+clientToken+'\"}');
    winston.log('Clientoken is '+clientToken);
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