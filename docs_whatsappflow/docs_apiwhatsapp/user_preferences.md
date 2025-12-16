user_preferences webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account user_preferences webhook.

The user_preferences webhook notifies you of changes to a WhatsApp user's marketing message preferences.

Triggers
A WhatsApp user stops marketing messages.
A WhatsApp user resumes marketing messages.
Syntax
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "<BUSINESS_DISPLAY_PHONE_NUMBER>",
              "phone_number_id": "<BUSINESS_PHONE_NUMBER_ID>"
            },
            "contacts": [
              {
                "profile": {
                  "name": "<WHATSAPP_USER_NAME>"
                },
                "wa_id": "<WHATSAPP_USER_ID>"
              }
            ],
            "user_preferences": [
              {
                "wa_id": "<WHATSAPP_USER_ID>",
                "detail": "<PREFERENCE_DESCRIPTION>",
                "category": "marketing_messages",
                "value": "<PREFERENCE>",
                "timestamp": <WEBHOOK_SENT_TIMESTAMP>
              }
            ]
          },
          "field": "user_preferences"
        }
      ]
    }
  ]
}
Parameters
Placeholder	Description	Example value
<BUSINESS_DISPLAY_PHONE_NUMBER>

String

Business display phone number.

15550783881

<BUSINESS_PHONE_NUMBER_ID>

String

Business phone number ID.

106540352242922

<PREFERENCE>

String

Marketing message preference.

Values can be:

stop — Indicates the WhatsApp users has opted to stop receiving marketing messages from you.

resume — Indicates the WhatsApp users has opted to resume receiving marketing messages from you.

stop

<PREFERENCE_DESCRIPTION>

String

Description of marketing message preference.

Values can be:

User requested to stop marketing messages
User requested to resume marketing messages
User requested to stop marketing messages

<WEBHOOK_TRIGGER_TIMESTAMP>

Integer

Unix timestamp indicating when the webhook was triggered.

1739321024

<WHATSAPP_BUSINESS_ACCOUNT_ID>

String

WhatsApp Business Account ID.

102290129340398

<WHATSAPP_USER_ID>

String

WhatsApp user ID. Note that a WhatsApp user's ID and phone number may not always match.

16505551234

<WHATSAPP_USER_PROFILE_NAME>

String

WhatsApp user's name as it appears in their profile in the WhatsApp client.

Sheena Nelson

Example
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550783881",
              "phone_number_id": "106540352242922"
            },
            "contacts": [
              {
                "wa_id": "16505551234"
              }
            ],
            "user_preferences": [
              {
                "wa_id": "16505551234",
                "detail": "User requested to resume marketing messages",
                "category": "marketing_messages",
                "value": "resume",
                "timestamp": 1731705721
              }
            ]
          },
          "field": "user_preferences"
        }
      ]
    }
  ]
}