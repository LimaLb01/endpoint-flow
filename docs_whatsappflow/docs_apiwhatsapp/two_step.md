Two-Step Verification
You are required to set up two-step verification for your phone number, as this provides an extra layer of security to the business accounts. To set it up, make a POST call to /PHONE_NUMBER_ID and attach the parameters below. There is no endpoint to disable two-step verification.

Endpoint	Authentication
/PHONE_NUMBER_ID

(consulte Get Phone Number ID)

Solution Partners must authenticate themselves with an access token with the whatsapp_business_management and whatsapp_business_messaging permissions.

Parameters
Name	Description
pin

Required.

A 6-digit PIN you wish to use for two-step verification.

Example
Sample request:

curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{"pin" : "6_DIGIT_PIN"}'
Sample response:

{
  "success": true
}
All API calls require authentication with access tokens.

Developers can authenticate their API calls with the access token generated in the App Dashboard > WhatsApp > API Setup.

Solution Partners must authenticate themselves with an access token with the whatsapp_business_messaging and whatsapp_business_management permissions. See System User Access Tokens for information.

Resetting your PIN
If you forget or misplace your PIN, you can update it by following these steps in WhatsApp Manager:

Go to settings, log into your Facebook Business, and click the business you are using to manage your WABA (WhatsApp Business Account).
In the settings screen, click WhatsApp Accounts and find the WABA you want to update the PIN for. Click on the WABA and a panel with its respective info will come up on the right-side of the page.
In the WABA info panel, click Settings.
In the new tab, click WhatsApp Manager.
In WhatsApp Manager, find your phone number and click Settings.
Click Two-step verification.
In the Two-step verification tab, click Change PIN.
You will be prompted to enter a new PIN and confirm it. You have now successfully updated your PIN