security webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account security webhook.

The security webhook notifies you of changes to a business phone number's security settings.

Triggers
A Meta Business Suite user clicks the Turn off two-step verification button in WhatsApp Manager.
A Meta Business Suite user completes the instructions in the WhatsApp Two-Step Verification Reset email to turn off two-step verification.
A Meta Business Suite user changes or enables the business phone number PIN using WhatsApp Manager.
Syntax
{
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "time": <WEBHOOK_TRIGGER_TIMESTAMP>,
      "changes": [
        {
          "value": {
            "display_phone_number": "<BUSINESS_DISPLAY_PHONE_NUMBER>",
            "event": "<EVENT>",
            "requester": "<META_BUSINESS_SUITE_USER_ID>"
          },
          "field": "security"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
Parameters
Placeholder	Description	Example value
<BUSINESS_DISPLAY_PHONE_NUMBER>

String

Business display phone number.

15550783881

<EVENT>

String

The security event that triggered the webhook.

Values can be:

PIN_CHANGED — indicates a Meta Business Suite user changed or enabled the business phone number's PIN using WhatsApp Manager.

PIN_RESET_REQUEST — Indicates a Meta Business Suite user clicked the Turn off two-step verification button in WhatsApp Manager.

PIN_REQUEST_SUCCESS — a Meta Business Suite user completed the instructions in the WhatsApp Two-Step Verification Reset email to turn off two-step verification.

PIN_RESET_REQUEST

<META_BUSINESS_SUITE_USER_ID>

String

The Meta Business Suite user ID of the user who requested to turn off two-step verification using WhatsApp Manager.

This parameter is only included for PIN reset requests.

61555822107539

<WEBHOOK_TRIGGER_TIMESTAMP>

Integer

Unix timestamp indicating when the webhook was triggered.

1739321024

<WHATSAPP_BUSINESS_ACCOUNT_ID>

String

WhatsApp Business Account ID.

102290129340398

Example
{
  "entry": [
    {
      "id": "102290129340398",
      "time": 1748811473,
      "changes": [
        {
          "value": {
            "display_phone_number": "15550783881",
            "event": "PIN_RESET_REQUEST",
            "requester": "61555822107539"
          },
          "field": "security"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}