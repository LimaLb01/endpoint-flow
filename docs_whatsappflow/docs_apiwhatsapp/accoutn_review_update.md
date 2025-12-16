account_review_update webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account account_review_update webhook.

The account_review_update webhook notifies you when a WhatsApp Business Account has been reviewed against our policy guidelines.

Triggers
A WhatsApp Business Account is approved.
A WhatsApp Business Account is rejected.
A decision on a WhatsApp Business Account approval has been deferred or is awaiting more information.
Syntax
{
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "time": <WEBHOOK_TRIGGER_TIMESTAMP>,
      "changes": [
        {
          "value": {
            "decision": "<DECISION>"
          },
          "field": "account_review_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
Payload parameters
Placeholder	Description	Example value
<DECISION>

String

Indicates WhatsApp Business Account ("WABA") review outcome.

Values can be:

APPROVED — Indicates WABA approved and ready for use.

REJECTED — Indicates WABA was rejected because it doesn't meet our policy requirements and cannot be used with our APIs.

PENDING — Indicates a review decision is still pending and WABA currently cannot be used with our APIs.

DEFERRED — Indicates a review decision has been deferred and the WABA currently cannot be used with our APIs.

APPROVED

<WEBHOOK_TRIGGER_TIMESTAMP>

Integer

Unix timestamp indicating when the webhook was triggered.

1739321024

<WHATSAPP_BUSINESS_ACCOUNT_ID>

String

WhatsApp Business Account ID.

102290129340398

Example payload
{
  "entry": [
    {
      "id": "102290129340398",
      "time": 1739321024,
      "changes": [
        {
          "value": {
            "decision": "APPROVED"
          },
          "field": "account_review_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
