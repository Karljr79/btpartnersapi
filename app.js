//app.js

//load dependencies
var express = require('express');
var app = express();
var braintree = require("braintree");
var bodyParser = require("body-parser");
var nStore = require('nstore');
var winston = require('winston');

//includes
var config = require('./include/config');


//setup payment variables
var  clientToken, transid, expirationDate1, number1, paymenttoken;

//this will be the client gateway used
//for processing transactions on behalf of merchants
var clientGateway;

//finish setting up logging
//using multiple files for different log levels
winston.add(winston.transports.File, { filename: 'logs/serverlogs.log'});

var partner_merchant_id = "";

//load db
var merchants = nStore.new('data/merchants.db', function (){
  winston.log('info', 'Merchants Database Successfully loaded');
});

//create BT gateway with Sandbox Partner credentials
//these are emailed from BT Solutions
var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: config.merchantId,
  publicKey: config.publicKey,
  privateKey: config.privateKey
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
    res.render('pages/signup');
});

// test page 
app.get('/complete', function(req, res) {
    res.render('pages/complete', {
      id: req.param("partner_merchant_id"),
      status: req.param("status")
    });
});

// test page 
app.get('/cancel', function(req, res) {
    res.render('pages/cancel');
});

// test page 
app.get('/error', function(req, res) {
    res.render('pages/error', {
      id: req.param("partner_merchant_id"),
      message: req.param("message")
    });
});

//used for one time Braintree test Webhook
app.get("/credentials", function (req, res) {
  res.send(gateway.webhookNotification.verify(req.query.bt_challenge));
  winston.log('info', 'Braintree Challenge Webhook Received' );
});

//parse the incoming webhook for partners API
app.post('/credentials', function(req, res) {
  
  var partnerMerchantId, merchantPublicId, publicKey, privateKey;
  
  //parse webhooks
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
//mid will be passed in as a query param.  
//In the real world you would hook this up to your login handler
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
        partner_merchant_id = merchant_id;
        res.send('{\"status\":\"success\"}');
      }
    });
});

// Serve the Mobile iOS Client with the token generated above
//his should only be called after the /login
app.get("/client_token", function (req, res) {
    
    if(clientGateway) {
    clientGateway.clientToken.generate({
      }, function (err, response) {
        if(err){
          winston.log('error', "Could not get client token");
        }
        else {
          winston.log('info', "Recieved Client Token");
          clientToken = response.clientToken;
          winston.log('info', 'Clientoken is '+ clientToken);
          res.send('{\"client_token\":\"'+clientToken+'\"}');
        }
      });
    }
    else {
      res.redirect('/error' + '?partner_merchant_id=none&message=You are not logged in, please call /login first with your merchant id');
    }
});

//redirect to BT for signup
app.post("/goBT", function (req, res){
  //grab the form data
  var merchantID = req.body.mid;
  //redirect to Braintree
  res.redirect("https://sandbox.braintreegateway.com/partners/pp_karlh/connect?partner_merchant_id=" + merchantID);
  
});

//handle grabbing the nonce from the client and creating a payment
app.post("/payment", function (req, res){
  var nonce = req.body["payment-method-nonce"];
  var amount = req.body.amount;
  var vault = req.body.vault;
  
  if (vault == "no")
  {
      clientGateway.transaction.sale({
        amount: amount,
        paymentMethodNonce: nonce,
      }, function (err, result) {
        console.log("new sale arriving");
        if (err) throw err;

        if (result.success) {
          transid = result.transaction.id;
          
          winston.log('info', 'Transaction ID: ' + transid);
          res.send('{\"transactionID\":\"'+transid+'\"}');
        } else {
          winston.log('error', result.message);
          res.send(500);
        }
      });
  }
  else //TODO add handling for saving to the vault.
  {
    
  }
  
  
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
        error: err
    });
});

app.listen(process.env.PORT);
winston.log('8080 is the magic port');

module.exports = app;