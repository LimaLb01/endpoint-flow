Account Migration
If you are migrating a business phone number from On-Premises API to Cloud API, use this endpoint to register the number for use with Cloud API after you have performed your backup.

See Migrating from On-Premises API and Cloud API for complete migration steps.

Endpoint	Authentication
/PHONE_NUMBER_ID/register

(consulte Get Phone Number ID)

Solution Partners must authenticate themselves with an access token with the whatsapp_business_management and whatsapp_business_messaging permissions.

Registration
To complete business phone number migration, make a POST call to the PHONE_NUMBER_ID/register endpoint and include the parameters listed below.

Your request could take as long as 15 seconds to finish. During this period, your On-Premises deployment is automatically disconnected from WhatsApp servers and shut down; the business number will start up in Cloud API at the same time.

After the request finishes successfully, you can resume sending messages.

Throughput
If you migrate a business phone number that has multiconnect running 2 or more shards from On-Premises API to Cloud API, it will automatically be upgraded to higher throughput.

Parameters
Name	Description
messaging_product

Required.

Messaging service used for the request. In this case, use “WhatsApp”.

pin

Required.

A 6-digit pin you have previously set up. If you use the wrong pin, your on-premise deployment will be down and will be disconnected from the WhatsApp servers.


If you haven't set up or you have disabled two-step verification, provide a random 6-digit pin in the request, and this will be used to enable two-step verification in the WhatsApp Business Cloud-Based API.

backup.data

Required.

The data value you get when you backup your on-premise deployment. This contains the account registration info and application settings.


See Backup and Restore to backup your on-premise implementation.

backup.password

Required.

The password you used in the backup API of your On-Premises deployment.

Example
Sample request:

curl -X POST \ 
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/register' \
 -H 'Authorization: Bearer SYSTEM_USER_ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
    "messaging_product": "whatsapp",
    "pin": "6_DIGIT_PIN",
    "backup": {
      "password": "PASSWORD",
      "data": "BACKUP_DATA"
    }
  }'
Sample response:

{
  "success": true
}
All API calls require authentication with access tokens.

Developers can authenticate their API calls with the access token generated in the App Dashboard > WhatsApp > API Setup.

Solution Partners must authenticate themselves with an access token with the whatsapp_business_messaging and whatsapp_business_management permissions. See System User Access Tokens for information.