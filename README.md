##Braintree Partners API Example App


This example node app was written to be run on Cloud9 `www.c9.io` 

You can clone this repository directly to your c9 instance by linking your GitHub account with your Cloud9 account.

NOTE - TO USE THIS CODE YOU WILL NEED TO GET YOUR OWN BRAINTREE PARTNERS SANDBOX ACCOUNT.  THEN YOU CAN SUBSTITUTE YOUR CREDENTIALS IN.  YOU WILL ALSO NEED TO CHANGE THE REDIRECT URL.

##Running the App

1) The credentials in line 31 of app.js are my partners account. Enter yours here.

2) The URL in the /goBT method of app.js will need to be replaced with your own.

3) These credentials come directly from Braintree.  You will need to contact Braintree to have Test Partner API credentials sent to you.  These credentials will not allow you to generate your
own client token, but are necessary for you to instantiate a Braintree Gateway capable of processing a partner_merchant_connected webhook. 

##Using the App

1)This website simulates a partner website allowing a merchant to connect their existing BT account or sign up for a new one.  

2)Head to the `/signup` page and enter a merchant ID.  This would be equivalent to a merchants user ID on the Partner's website.  

3)If the user ID has not been used previously, you will then be taken to the Braintree Partners testing page.  To log in, use the following credentials: 

`username: partner_testing_user`
`password: demo_312`

Ideally you would get have your own credentials from Braintree that would your own BT Partner's Test Page.  The credentials above test page buttons will only post webhooks to my URL.

4)From the test dashboard, you can simulate events.  Currently this node app is only set up to process a successful application.

5)Press the `run test` button and Braintree will send a Webhook with the merchants credentials.  This app parses that webhook and stores the creds in the db using the merchant ID you entered in step 2
as the key.

6)In the console and the log files, you will see that data. 

##Getting Braintree credentials via a mobile app with the Braintree SDK

1)Have your mobile app perform a `GET` to the `/login` endpoint. You will need to pass in the Merchant ID from above as a query parameter.

2)This will have the server instantiate a Braintree gateway with the cooresponding credentials. 

3)If you receive a `200` response, you can proceed to calling the `/client_token` endpoint. 

4)The response back to your moble app will have that token in the response body which you can then parse out.




.....Thats it for now.  Transaction processing and nonce handling coming soon.