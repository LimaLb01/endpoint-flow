Webhook overrides
Messages webhooks are sent to the callback URL set on your app, but you can override this for your own app by designating an alternate callback URL for the WhatsApp Business Account (WABA) or business phone number.

When a messages webhook is triggered, we will first check if your app has designated an alternate callback URL for the business phone number associated with the message. If set, we will send the webhook to your alternate callback URL. If the phone number has no alternate, we will check if the WABA associated with the number has an alternate callback URL, and if set, send it there. If the WABA also has no alternate, we will then fallback to your app's callback URL.

Requirements
Before setting an alternate callback URL, make sure your app is subscribed to webhooks for the WABA and verify that your alternate callback endpoint can receive and process messages webhooks correctly.

Set WABA alternate callback
Use the POST /<WABA_ID>/subscribed_apps endpoint to set an alternate callback URL on a WABA.

Request syntax
POST /<WABA_ID>/subscribed_apps
Post body
{
  "override_callback_uri":"<WABA_ALT_CALLBACK_URL>",
  "verify_token":"<WABA_ALT_CALLBACK_URL_TOKEN>"
}
Body parameters
Placeholder	Description	Example Value
<WABA_ALT_CALLBACK_URL>

Required.

Alternate callback URL where messages webhooks should be sent.

Maximum 200 characters.

https://my-waba-alternate-callback.com/webhook

<WABA_ALT_CALLBACK_URL_TOKEN>

Required.

Alternate callback URL verification token.

No maximum.

myvoiceismypassport?

Response
Upon success:

{
  "success": true
}
Example request
curl -X POST \
'https://graph.facebook.com/v24.0/102290129340398/subscribed_apps' \
-H 'Authorization: Bearer EAAJi...' \
-H 'Content-Type: application/json' \
-d '
{
  "override_callback_uri":"https://my-waba-alternate-callback.com/webhook",
  "verify_token":"myvoiceismypassport?"
}'
Example response
{
  "success": true
}
Get WABA alternate callback
Use the GET /<WABA_ID>/subscribed_apps endpoint to get a list of all apps subscribed to webhooks on the WABA. The response should include an override_callback_uri property and value.

Example Response
{
  "data" : [
    {
      "whatsapp_business_api_data" : {
        "id" : "670843887433847",
        "link" : "https://www.facebook.com/games/?app_id=67084...",
        "name" : "Lucky Shrub"
      },
      "override_callback_uri" : "https://my-waba-alternate-callback.com/webhook"
    }
  ]
}
Delete WABA alternate callback
Use the POST /<WABA_ID>/subscribed_apps endpoint to subscribe your app to webhooks on the WABA as you normally would (i.e. without any post body parameters). This will remove the alternate endpoint's callback URL from the WABA, and messages webhooks for the WABA will once again be sent to the callback URL set in the App Dashboard.

Set phone number alternate callback
Use the POST /<BUSINESS_PHONE_NUMBER_ID> endpoint to set an alternate callback URL on the business phone number.

Request syntax
POST /<BUSINESS_PHONE_NUMBER_ID>
Post body
{
  "webhook_configuration": {
    "override_callback_uri": "<PHONE_ALT_CALLBACK_URL>",
    "verify_token": "<PHONE_ALT_CALLBACK_URL_TOKEN>"
  }
}
Body parameters
Placeholder	Description	Example Value
<PHONE_ALT_CALLBACK_URL>

Required.

Alternate callback URL where messages webhooks should be sent.

Maximum 200 characters.

https://my-phone-alternate-callback.com/webhook

<PHONE_ALT_CALLBACK_URL_TOKEN>

Required.

Alternate callback URL verification token.

No maximum.

myvoiceismypassport?

Response
Upon success:

{
  "success": true
}
Example request
curl 'https://graph.facebook.com/v24.0/106540352242922' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "webhook_configuration": {
    "override_callback_uri": "https://my-phone-alternate-callback.com/webhook",
    "verify_token": "myvoiceismypassport?"
  }
}'
Example response
{
  "success": true
}
Get phone number alternate callback
Use the GET /<BUSINESS_PHONE_NUMBER_ID> endpoint and request the webhook_configuration field to verify that the business phone number has an alternate callback URL.

Request syntax
GET /<BUSINESS_PHONE_NUMBER_ID>
  ?fields=webhook_configuration
Response
Upon success:

{
  "webhook_configuration": {
    "phone_number": "<PHONE_ALT_CALLBACK_URL>",
    "whatsapp_business_account": "<WABA_ALT_CALLBACK_URL>",
    "application": "<APP_CALLBACK_URL>"
  },
  "id": "106540352242922"
}
Note that whatsapp_business_account is only included if the WABA associated with the business phone number also has an alternate callback URL set.

Example request
curl 'https://graph.facebook.com/v17.0/106540352242922?fields=webhook_configuration' \
-H 'Authorization: Bearer EAAJB...'
Example response
{
  "webhook_configuration": {
    "phone_number": "https://my-phone-alternate-callback.com/webhook",
    "whatsapp_business_account": "https://my-waba-alternate-callback.com/webhook",
    "application": "https://my-production-callback.com/webhook"
  },
  "id": "106540352242922"
}
Delete phone number alternate callback
To delete a business phone number's alternate callback URL, use the POST /<BUSINESS_PHONE_NUMBER_ID> endpoint with the override_callback_uri property set to an empty string:

{
  "webhook_configuration": {
    "override_callback_uri": "",
  }
}