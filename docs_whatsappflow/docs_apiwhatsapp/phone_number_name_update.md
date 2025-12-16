phone_number_name_update webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account phone_number_name_update webhook.

The phone_number_name_update webhook notifies you of business phone number display name verification outcomes.

Triggers
A newly created business phone number's display name is reviewed.
A business phone number's already approved display name is edited and reviewed.
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
            "decision": "<DECISION>",
            "requested_verified_name": "<REQUESTED_DISPLAY_NAME>",
            "rejection_reason": "<REJECTION_REASON>"
          },
          "field": "phone_number_name_update"
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

<DECISION>

String

Indicates the outcome of the business phone number display name verification process.

APPROVED — Indicates the display name has been approved and will now appear at the top of the business phone number's profile in the WhatsApp client.

DEFERRED — Indicates a decision has been deferred.

PENDING — Indicates a decision is still pending further review.

REJECTED — Indicates the display name has been rejected. You can edit the name using WhatsApp Manager. Review our display name guidelines before editing.

APPROVED

<REJECTION_REASON>

String

The reason why the business phone number display name was rejected, if it was rejected. Review our display name guidelines for common rejection reasons.

Values can be:

NAME_EMPLOYEE_ISSUE — Rejected because the display name inclined a person's name or employee identifier.

NAME_ENDCLIENT_NOTRELATED — Rejected because the display name inclined an unrelated business's name.

NAME_FORMAT_UNACCEPTABLE — Rejected because the display name used an unacceptable format.

NAME_INDIVIDUAL_ISSUE — Rejected because the display name inclined a person's name or employee identifier. NAME_NOT_CONSISTENT — Rejected because the display name was not consistent with the business's branding.

null — Indicates name was accepted.

UNKNOWN — Rejected for an unknown reason. Please contact support.

APPROVED

<REQUESTED_DISPLAY_NAME>

String

The business phone number display name collected when the number was created, or name submitted when editing an already approved display name.

Lucky Shrub

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
      "time": 1739321024,
      "changes": [
        {
          "value": {
            "display_phone_number": "15550783881",
            "decision": "APPROVED",
            "requested_verified_name": "Lucky Shrub",
            "rejection_reason": null
          },
          "field": "phone_number_name_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}