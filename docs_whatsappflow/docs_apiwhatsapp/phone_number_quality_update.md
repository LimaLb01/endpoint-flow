phone_number_quality_update webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account phone_number_quality_update webhook.

The phone_number_quality_update webhook notifies you of changes to a business phone number's throughput level.

Triggers
A business phone number's throughput level changes.
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
              "old_limit": "<OLD_LIMIT>", <!-- only included for messaging limit changes -->
              "current_limit": "<CURRENT_LIMIT>",
              "max_daily_conversations_per_business": "<MAX_DAILY_MESSAGES_LIMIT>"
            },
            "field": "phone_number_quality_update"
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

<CURRENT_LIMIT>

String

This field will be removed in February, 2026. Use max_daily_conversations_per_business instead.

Indicates current messaging limit or throughput level.

Values can be:

TIER_50 — Indicates a messaging limit of 50.

TIER_250 — Indicates a messaging limit of 250.

TIER_2K — Indicates a messaging limit of 2,000.

TIER_10K — Indicates a messaging limit of 10,000.

TIER_100K — Indicates a messaging limit of 100,000.

TIER_NOT_SET — Indicates the business phone number has not been used to send a message yet.

TIER_UNLIMITED — Indicates the business phone number has higher throughput.

TIER_UNLIMITED

<EVENT>

String

Messaging limit change or throughput change event.

Values can be:

ONBOARDING — Indicates the business phone number is still being registered.

THROUGHPUT_UPGRADE — Indicates the business phone number's throughput level has increased to higher throughput.

THROUGHPUT_UPGRADE

<MAX_DAILY_MESSAGES_LIMIT>

String

Indicates a change to the owning business portfolio's messaging limit or throughput change.

Values can be:

TIER_50 — Indicates a messaging limit of 50.

TIER_250 — Indicates a messaging limit of 250.

TIER_2K — Indicates a messaging limit of 2,0001,000.

TIER_10K — Indicates a messaging limit of 10,000.

TIER_100K — Indicates a messaging limit of 100,000.

TIER_NOT_SET — Indicates the business phone number has not been used to send a message yet.

TIER_UNLIMITED — Indicates the business phone number has higher throughput.

TIER_2K

<OLD_LIMIT>

String

This parameter will be removed in February, 2026. Use max_daily_conversations_per_business instead.

Indicates old messaging limit.

Values can be:

TIER_50 — Indicates a messaging limit of 50.

TIER_250 — Indicates a messaging limit of 250.

TIER_2K — Indicates a messaging limit of 2,000.

TIER_10K — Indicates a messaging limit of 10,000.

TIER_100K — Indicates a messaging limit of 100,000.

TIER_NOT_SET — Indicates the business phone number has not been used to send a message yet.

TIER_UNLIMITED

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
      "time": 1748454394,
      "changes": [
        {
          "value": {
            "display_phone_number": "15550783881",
            "event": "THROUGHPUT_UPGRADE",
            "current_limit": "TIER_UNLIMITED"
          },
          "field": "phone_number_quality_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}