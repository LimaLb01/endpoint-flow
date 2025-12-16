Phone Numbers
This guide specifies how you can verify your phone number and its required formatting for the Cloud API.

There is a criteria for what kind of phone numbers you can add to your WhatsApp Business Account (WABA). Please see Phone Numbers for further information.

Some API calls listed require you to know your phone number’s ID. Refer to Get All Phone Numbers on how to get the phone numbers associated with your WABA. The API call response includes IDs for each of the phone numbers connected to your WhatsApp Business Account. Save the ID for the phone you want to use with any /PHONE_NUMBER_ID calls.

Verify Phone Numbers
You need to verify the phone number you want to use to send messages to your customers. Phone numbers must be verified using a code sent via an SMS/voice call. The verification process can be done via Graph API calls specified below.

To verify a phone number using Graph API, make a POST request to PHONE_NUMBER_ID/request_code. In your call, include your chosen verification method and language.

Endpoint	Authentication
/PHONE_NUMBER_ID/request_code

(consulte Get Phone Number ID)

Authenticate yourself with a system user access token.

If you are requesting the code on behalf of another business, the access token needs to have Advanced Access to the whatsapp_business_management permission.

Parameters
Name	Description
code_method

string

Required.

Chosen method for verification. Supported Options:

SMS
VOICE
language

string

Required.

The language's two-character language code code. For example: "en".

Example
Sample request:

curl -X POST \
  'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/request_code' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -F 'code_method=SMS' \
  -F 'language=en'
After the API call, you will receive your verification code via the method you selected. To finish the verification process, include your code in a POST request to PHONE_NUMBER_ID/verify_code.

Endpoint	Authentication
/PHONE_NUMBER_ID/verify_code

(consulte Get Phone Number ID)

Authenticate yourself with a system user access token.

If you are requesting the code on behalf of another business, the access token needs to have Advanced Access to the whatsapp_business_management permission.

Parameters
Name	Description
code

numeric string

Required.

The code you received after calling FROM_PHONE_NUMBER_ID/request_code.

Example
Sample request:

curl -X POST \
  'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/verify_code' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  -F 'code=000000'
A successful response looks like this:

{
  "success": true
}
WhatsApp user phone number formats
Plus signs (+), hyphens (-), parenthesis ((,)), and spaces are supported in send message requests.

We highly recommend that you include both the plus sign and country calling code when sending a message to a customer. If the plus sign is omitted, your business phone number's country calling code is prepended to the customer's phone number. This can result in undelivered or misdelivered messages.

For example, if your business is in India (country calling code 91) and you send a message to the following customer phone number in various formats:

Number In Send Message Request	Number Message Delivered To	Outcome
+16315551234

+16315551234

Correct number

+1 (631) 555-1234

+16315551234

Correct number

(631) 555-1234

+916315551234

Potentially wrong number

1 (631) 555-1234

+9116315551234

Potentially wrong number

Note: For Brazil and Mexico, the extra added prefix of the phone number may be modified by the Cloud API. This is a standard behavior of the system and is not considered a bug.

Identity Change Check
You may want us to verify a customer's identity before we deliver your message to them. You can have us do this by enabling the identity change check setting on your business phone number.

If a customer performs an action in WhatsApp that we consider to be an identity change, we generate a new identity hash for the user. You can get this hash anytime you message the customer by enabling the identity change check setting on your business phone number. Once enabled, anytime the customer messages you, or you message the customer without an identity hash, we will include their hash in any incoming messages webhooks or status messages webhooks. You can then capture and store this hash for future use.

To use the hash, include it in a send message request. We will compare the hash in the request to the customer's current hash. If the hashes match, the message will be delivered. If there is a mismatch, it means the customer has changed their identity since you last messaged them and we will not deliver the message. Instead, we will send you a status messages webhook with error code 137000, notifying you of the failure and mismatch.

When you receive a mismatched hash webhook, assume the customer's phone number can no longer be trusted. To reestablish trust, verify the customer's identity again using other, non-WhatsApp channels. Once you have reestablished trust, resend the failed message to the new identity (if any), without a hash. Then store the customer's new hash included in the message status delivery webhook.

Request Syntax
Send a POST request to the WhatsApp Business Phone Number > Settings endpoint to enable or disable the identity change check setting.

POST /<WHATSAPP_BUSINESS_PHONE_NUMBER>/settings

Post Body
{
  "user_identity_change" : {
    "enable_identity_key_check": <ENABLE_IDENTITY_KEY_CHECK>
}
Set <ENABLE_IDENTITY_KEY_CHECK> to true to enable identity check, or false to disable it.

Example Enable Request
curl 'https://graph.facebook.com/v24.0/106850078877666/settings' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "user_identity_change": {
    "enable_identity_key_check": true
  }
}'
Example Enable Response
{
  "success": true
}
Example Send Message With Check
This example message would only be delivered if the recipient_identity_key_hash hash value matches the customer's current hash.

curl 'https://graph.facebook.com/v24.0/106850078877666/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505551234",
  "recipient_identity_key_hash": "DF2lS5v2W6x=",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Your latest statement is attached. See... "
  }
}'
Webhooks
In incoming messages webhooks with a contacts object, such as the text messages webhook, the customer's hash is assigned to the identity_key_hash property.

In outgoing messages webhooks (status messages webhooks), the customer's hash is assigned to the recipient_identity_key_hash property in the statuses object.

Getting Throughput Level
Use the WhatsApp Business Phone Number endpoint to get a phone number's current throughput level:

GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>?fields=throughput