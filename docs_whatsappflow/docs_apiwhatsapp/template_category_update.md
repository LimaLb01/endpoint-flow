template_category_update webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account template_category_update webhook.

The template_category_update webhook notifies you of changes to template's category.

Triggers
The existing category of a WhatsApp template is going to be changed by an automated process.
The existing category of a WhatsApp template is changed manually or by an automated process.
Syntax
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "time": <WEBHOOK_TRIGGER_TIMESTAMP>,
      "changes": [
        {
          "field": "template_category_update",
          "value": {            
            "message_template_id": <TEMPLATE_ID>,
            "message_template_name": "<TEMPLATE_NAME>",
            "message_template_language": "<TEMPLATE_LANGUAGE>",

            <!-- impending category change notifications only -->
            "correct_category": "<CORRECT_CATEGORY>",
            "new_category": "<CURRENT_CATEGORY>",
            "category_update_timestamp": <CATEGORY_UPDATE_TIMESTAMP>

            <!-- completed category change notifications only -->
            "previous_category": "<PREVIOUS_CATEGORY>",
            "new_category": "<NEW_CATEGORY>"

          }
        }
      ]
    }
  ]
}
Parameters
Placeholder	Description	Example value
<CORRECT_CATEGORY>

String

The category that the template will be recategorized as in 24 hours.

MARKETING

<CURRENT_CATEGORY>

String

The template's current category.

MARKETING

<NEW_CATEGORY>

String

The template's new category.

MARKETING

<CATEGORY_UPDATE_TIMESTAMP>

Integer

The Unix timestamp (in seconds) indicating when the template's category will be updated to the <CORRECT_CATEGORY> specified in the webhook. This value represents the moment the update is scheduled to occur.

1760711433

<PREVIOUS_CATEGORY>

String

The template's previous category.

UTILITY

<TEMPLATE_ID>

Integer

Template ID.

278077987957091

<TEMPLATE_LANGUAGE>

String

Template language and locale code.

en-US

<TEMPLATE_NAME>

String

Template name.

welcome_template

<WEBHOOK_TRIGGER_TIMESTAMP>

Integer

Unix timestamp indicating when the webhook was triggered.

1739321024

<WHATSAPP_BUSINESS_ACCOUNT_ID>

String

WhatsApp Business Account ID.

102290129340398

Examples
This example webhook describes a template that will be recategorized as MARKETING in 24 hours. Note that new_category indicates its current category:

{
 "entry": [
   {
     "id": "102290129340398",
     "time": 1746082800,
     "changes": [
       {
         "field": "template_category_update",
         "value": {
           "message_template_id": 278077987957091,
           "message_template_name": "welcome_template",
           "message_template_language": "en-US",
           "new_category": "UTILITY",
           "correct_category": "MARKETING",
           "category_update_timestamp": 1746169200
         }
       }
     ]
   }
 ],
 "object": "whatsapp_business_account"
}
This example webhook describes a template that has been recategorized as MARKETING:

{
 "entry": [
   {
     "id": "102290129340398",
     "time": 1746169200,
     "changes": [
       {
         "field": "template_category_update",
         "value": {
           "message_template_id": 278077987957091,
           "message_template_name": "welcome_template",
           "message_template_language": "en-US",
           "previous_category": "UTILITY",
           "new_category": "MARKETING"
         }
       }
     ]
   }
 ],
 "object": "whatsapp_business_account"
}