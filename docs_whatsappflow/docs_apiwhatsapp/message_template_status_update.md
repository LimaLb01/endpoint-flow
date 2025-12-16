message_template_status_update webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account message_template_status_update webhook.

The message_template_status_update webhook notifies you of changes to the status of an existing template.

Triggers
A template is approved.
A template is rejected.
A template is disabled.
Syntax
{
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "time": <WEBHOOK_TRIGGER_TIMESTAMP>,
      "changes": [
        {
          "value": {
            "event": "<EVENT>",
            "message_template_id": <TEMPLATE_ID>,
            "message_template_name": "<TEMPLATE_NAME>",
            "message_template_language": "<TEMPLATE_LANGUAGE_AND_LOCALE_CODE>",
            "reason": "<REASON>",
            "message_template_category": <TEMPLATE_CATEGORY>,

            <!-- only included if template disabled -->
            "disable_info": {
              "disable_date": "<DISABLE_TIMESTAMP>"
            },

            <!-- only included if template locked or unlocked -->
            "other_info": {
              "title": "<TITLE>",
              "description": "<DESCRIPTION>"
            }
          },

            <!-- only included if template rejected with INVALID_FORMAT reason -->
            "rejection_info": {
              "reason": "<REASON_INFO>",
              "recommendation": "<RECOMMENDATION_INFO>"
            }
          },
          "field": "message_template_status_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
Parameters
Placeholder	Description	Example value
<DESCRIPTION>

String

String describing why the template was locked or unlocked.

Your WhatsApp message template has been unpaused.

<DISABLE_TIMESTAMP>

Integer

Unix timestamp indicating when the template was disabled.

1751234563

<EVENT>

String

Template status event. Values can be:

APPROVED — Indicates the template has been approved and can now be sent in template messages.

ARCHIVED: Indicates the template has been archived to keep the list of templates in WhatsApp manager clean. DELETED — Indicates the template has been deleted.

DISABLED — Indicates the template has been disabled due to user feedback.

FLAGGED — Indicates the template has received negative feedback and is at risk of being disabled.

IN_APPEAL — Indicates the template is in the appeal process.

LIMIT_EXCEEDED — Indicates the WhatsApp Business Account template is at its template limit.

LOCKED — Indicates the template has been locked and cannot be edited.

PAUSED — Indicates the template has been paused.

PENDING — Indicates the template is undergoing template review.

REINSTATED — Indicates the template is no longer flagged or disabled and can be sent in template messages again.

PENDING_DELETION — Indicates template has been deleted via WhatsApp Manager.

REJECTED — Indicates the template has been rejected. You can edit the template to have it undergo template review again or appeal the rejection.

APPROVED

<TEMPLATE_ID>

Integer

Template ID.

1689556908129832

<TEMPLATE_NAME>

String

Template name.

order_confirmation

<TEMPLATE_LANGUAGE_AND_LOCALE_CODE>

String

Template language and locale code.

en-US

<REASON>

String

Template rejection reason, if rejected.

If the template is scheduled for deletion, the value will be null instead of a string. Otherwise, values can be:

ABUSIVE_CONTENT — Indicates template contains content that violates our policies.

CATEGORY_NOT_AVAILABLE — (Deprecated) Indicates an authentication templates for an unsupported region.

INCORRECT_CATEGORY — Indicates the template's content doesn't match the category designated at the time of template creation.

INVALID_FORMAT — Indicates template has an invalid format.

NONE: Indicates template was paused.

PROMOTIONAL — Indicates template contains content that violates our policies.

SCAM — Indicates template contains content that violates our policies.

TAG_CONTENT_MISMATCH — Indicates the template's content doesn't match the category designated at the time of template creation.

INVALID_FORMAT

<TITLE>

String

Title of template pause or unpause event.

Values can be:

FIRST_PAUSE — Indicates template has been paused for the first time.

SECOND_PAUSE — Indicates the template has been paused a second time.

RATE_LIMITING_PAUSE — Indicates template has been paused due to rate limiting.

UNPAUSE — Indicates template has been unpaused.

DISABLED — Indicates template has been disabled.

FIRST_PAUSE

<WEBHOOK_TRIGGER_TIMESTAMP>

Integer

Unix timestamp indicating when the webhook was triggered.

1739321024

<WHATSAPP_BUSINESS_ACCOUNT_ID>

String

WhatsApp Business Account ID.

102290129340398

<MESSAGE_TEMPLATE_CATEGORY>

String

The template category.

Values can be:

MARKETING — Indicates template is categorized as MARKETING.

UTILITY — Indicates the template is categorized as UTILITY.

AUTHENTICATION — Indicates template is categorized as AUTHENTICATION.

MARKETING

<REASON_INFO>

String

Provides a detailed explanation for why the template was rejected. This field describes the specific issue detected in the template content.

Your template has parameters placed next to each other (like {{1}}{{2}}) without text or punctuation between them.

<RECOMMENDATION_INFO>

String

Offers actionable guidance on how to modify the template to resolve the rejection reason. This field suggests best practices for editing the template content.

Separate parameters with descriptive text and ensure each parameter is clearly contextualized.

Example
This example webhook describes a template that has been approved.

{
  "entry": [
    {
      "id": "102290129340398",
      "time": 1751247548,
      "changes": [
        {
          "value": {
            "event": "APPROVED",
            "message_template_id": 1689556908129832,
            "message_template_name": "order_confirmation",
            "message_template_language": "en-US",
            "reason": "NONE",
            "message_template_category": "UTILITY"
          },
          "field": "message_template_status_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
This example webhook describes a template that has been rejected with INVALID_FORMAT.

{
  "entry": [
    {
      "id": "102290129340398",
      "time": 1751247548,
      "changes": [
        {
          "value": {
            "event": "REJECTED",
            "message_template_id": 1689556908129835,
            "message_template_name": "abandoned_cart",
            "message_template_language": "en",
            "reason": "INVALID_FORMAT"
            "message_template_category": "MARKETING",
            "rejection_info": {
              "reason": "Your template has parameters placed next to each other (like {{1}}{{2}}) without text or punctuation between them.",
              "recommendation": "Separate parameters with descriptive text and ensure each parameter is clearly contextualized."
            }
          },
          "field": "message_template_status_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}