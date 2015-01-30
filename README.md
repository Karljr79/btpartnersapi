    ____             _       __               
   / __ )_________ _(_)___  / /_________  ___ 
  / __  / ___/ __ `/ / __ \/ __/ ___/ _ \/ _ \
 / /_/ / /  / /_/ / / / / / /_/ /  /  __/  __/
/_______/   \__,_/_/___/_/\__/_/   \___/\___/ 
   / __ \____ ______/ /_____  ___  __________ 
  / /_/ / __ `/ ___/ __/ __ \/ _ \/ ___/ ___/ 
 / ____/ /_/ / /  / /_/ / / /  __/ /  (__  )  
/_/ ___\\\,_/_/   \__/_/ /_/\___/_/  \\___/   
   / ____/  ______ _____ ___  ____  / /__     
  / __/ | |/_/ __ `/ __ `__ \/ __ \/ / _ \    
 / /____>  </ /_/ / / / / / / /_/ / /  __/    
/_____/_/|_|\__,_/_/ /_/ /_/ .___/_/\___/     
                          /_/             


This example node app was written to be run on Cloud9 `www.c9.io` 

You can clone this repository directly to your c9 instance by linking your GitHub account with your Cloud9 account.

##Running the App

1) The credentials in line 31 of app.js are my partners account.

2) These credentials come directly from Braintree.  You will need to contact Braintree to have Test Partner API credentials sent to you.  These credentials will not allow you to generate your
own client token, but are necessary for you to instantiate a Braintree Gateway capable of processing a partner_merchant_connected webhook. 
