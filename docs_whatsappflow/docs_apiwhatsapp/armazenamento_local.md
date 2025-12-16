Local Storage
Local storage offers an additional layer of data management control, by giving you the option to specify where your message data is stored at rest. If your company is in a regulated industry such as finance, government, or healthcare, you may prefer to have your message data stored in a specific country when at rest because of regulatory or company policies.

How local storage works
Local storage is controlled by a setting enabled or disabled at a WhatsApp business phone number level. Both Cloud API and MM Lite API support local storage, and the setting will apply to any messages sent via either API if enabled.

When Local storage is enabled, the following constraints are applied to message content for a business phone number:

Data-in-use: When message content is sent or received by Cloud API or MM Lite API, message content may be stored on Meta data centers internationally while being processed.
Data-at-rest: After the data-in-use period, message content is deleted from Meta data centers outside of the specified local storage region, and persisted only in data centers within the local storage region selected. Note that the data-in-use period differs between Cloud API and MM Lite API as specified below:
When using local storage for Cloud API, the data-in-use period is up to 60 minutes.
When using local storage for MM Lite API, the data-in-use period is up to 90 minutes.
The local storage feature supplements other WhatsApp Business Platform privacy and security controls, and allows customers to ensure a higher level of compliance with local data protection regulations.

Data in scope
Local storage applies to message content (text and media) sent and/or received via Cloud API and MM Lite API. The following message content are in scope of the local storage feature:

Text messages: text payload (message body)
Media messages: media payload (audio, document, image or video)
Template messages (static template + parameters passed at message send time): components with text / media payload
In addition, a limited set of metadata attributes is included with the locally stored message content, in order to correctly associate the encrypted message payload with the originally processed message, and to audit the fact of localization. The stored metadata is protected with tokenization and encryption.

Available Regions
To see what regions are supported by local storage, see the data_localization_region parameter in the documentation on phone number registration.

Limitations
Media files uploaded by a business phone number with local storage enabled are only accessible to that specific phone number, and cannot be shared with other phone numbers associated with the business.
Enabling Local Storage
Follow the steps below to enable local storage for an unregistered business phone number using API version 21.0 or newer. If you are using an older API version, see Enabling Local Storage (v20 and older).

Step 1: Enable local storage on the number
Local storage can only be enabled or disabled on WhatsApp business phone numbers when they are in an unregistered state. If a phone number is currently registered, it must be unregistered and re-registered with local storage enabled.

Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/settings endpoint to enable local storage on the unregistered business phone number:

Request Syntax
POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/settings

{
  "storage_configuration": {
    "status": "IN_COUNTRY_STORAGE_ENABLED", 
    "data_localization_region": "<COUNTRY_CODE>"
  }
}
Set <COUNTRY_CODE> to the country code of the country where data-at-rest should be stored.

Response Syntax
{
  "success": <SUCCESS>
}
Upon success, <SUCCESS> will be set to true.

Example Request
curl 'https://graph.facebook.com/v24.0/106540352242922/settings' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "storage_configuration": {
    "status": "IN_COUNTRY_STORAGE_ENABLED", 
    "data_localization_region": "BR"
  }
}'
Example Response
{
  "success": true
}
Step 2: Register the number
Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/register endpoint to register the business phone number.

Request Syntax
POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/register

{
  "messaging_product": "whatsapp",
  "pin": "<TWO_STEP_PIN>"
}
Set <TWO_STEP_PIN> to the desired two-step verification PIN for the business phone number.

Response Syntax
{
  "success": <SUCCESS>
}
Upon success, <SUCCESS> will be set to true.

Example Request
curl 'https://graph.facebook.com/v21.0/v24.0/register' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "pin": "123456"
}'
Example Response
{
  "success": true
}
Getting Local Storage Settings
Use the GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/settings endpoint to get local storage settings on a WhatsApp Business Phone Number. For example:

curl 'https://graph.facebook.com/v24.0/179776755229976/settings' \
-H 'Authorization: Bearer EAAJB...'
This returns a node that represents the local storage settings on the business phone number. For example:

{
  "storage_configuration": {
    "status": "IN_COUNTRY_STORAGE_ENABLED",
    "data_localization_region": "BR"
  }
}
Disabling Local Storage
Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/settings endpoint to disable local storage on an unregistered business phone number using API version 21.0 or newer. If you are using an older API version, see Disabling Local Storage (v20 and older).

Request Syntax
POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID/>settings

{
  "storage_configuration": {
    "status": "IN_COUNTRY_STORAGE_DISABLED"
  }
}
Set <COUNTRY_CODE> to the country code of the country where data-at-rest should be stored.

Response Syntax
{
  "success": <SUCCESS>
}
Upon success, <SUCCESS> will be set to true.

Example Request
curl 'https://graph.facebook.com/v24.0/106540352242922/settings' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "storage_configuration": {
    "status": "IN_COUNTRY_STORAGE_DISABLED"
  }
}'
Example Response
{
  "success": true
}
Enabling Local Storage (v20 and older)
To enable local storage for an unregistered business phone number using API version 20.0 or older:

Step 1: Check verification status
Use the GET /<WHATSAPP_BUSINESS_PHONE_NUMBER> endpoint and request the code_verification_status field. If the code verification status is VERIFIED, skip to step 4. Otherwise, proceed to step 2.

Step 2: Request a verification code
Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/request_code endpoint to request a verification code. Upon success, the API will respond with true and a verification code will be sent to the business phone number via the method specified in the code_method parameter.

For example, this query requests a verification code to be sent via SMS in the English language (US locale).

curl -X POST 'https://graph.facebook.com/v20.0/110200345501442/request_code?code_method=SMS&language=en_US' \
-H 'Authorization: Bearer EAAJB...'
Use the code in the delivered message in the next step.

Step 3: Verify the business phone number
Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/verify_code endpoint to verify the business phone number using the verification code included in the message you received from the previous step.

For example:

curl -X POST 'https://graph.facebook.com/v20.0/110200345501442/verify_code?code=123830' \
-H 'Authorization: Bearer EAAJB...'
Step 4: Reregister the business phone number
Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/register endpoint to register the business phone number. Indicate the country where data-at-rest should be stored using the data_localization_region parameter.

For example, this request enables local storage on a business phone number, and sets the country where data should be stored to India:

curl 'https://graph.facebook.com/v20.0/110200345501442/register' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "pin": "123456",
  "data_localization_region": "IN"
}'
Disabling Local Storage (v20 and older)
Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/deregister endpoint to disable local storage on a business phone number using API version 20.0 or older.

For example:

curl -X POST 'https://graph.facebook.com/v24.0/110200345501442/deregister' \
-H 'Authorization: Bearer EAAJB...'
Note that this deregisters the business phone number so it cannot be used with WhatsApp Cloud API. If you want to continue using it with Cloud API but without local storage enabled, you must reregister it without including the data_localization_region parameter.

FAQs
Q. What are the migration paths for moving a phone number to the Cloud API version with Local Storage?

We support all migration paths to Cloud API version with Local Storage, this includes:

Existing On-Premise API number migrating to Cloud API version with Local Storage
Existing Cloud API number migrating to Cloud API version with Local Storage
New Cloud API number enabling Local Storage
In all these scenarios you would need to send a POST request to the /register endpoint for the selected phone number, specifying the target country for which data to be localized in a new parameter data_localization_region.

Q. Are there any migration risks? Any downtime associated with this?

No migration risks, this is a similar process as migrating from On-Premise API to Cloud API. See our developer documentation here. Downtime is typically less than 5 minutes and no re-verification of the business phone number is required.

Q. Is there any downtime associated with enabling local storage for a business phone number?

If a business phone number is already registered, you will need to de-register and re-register the phone number with local storage enabled. This process typically takes less than 5 minutes. No re-verification of the business phone number is required during this process.