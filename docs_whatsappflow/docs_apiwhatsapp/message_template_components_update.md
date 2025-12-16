message_template_components_update webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account message_template_components_update webhook.

The message_template_components_update webhook notifies you of changes to a template's components.

Triggers
A template is edited.
Syntax
{
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "time": <WEBHOOK_TRIGGER_TIMESTAMP>,
      "changes": [
        {
          "value": {
            "message_template_id": <TEMPLATE_ID>,
            "message_template_name": "<TEMPLATE_NAME>",
            "message_template_language": "<TEMPLATE_LANGUAGE_AND_LOCALE_CODE>",
            "message_template_element": "<TEMPLATE_BODY_TEXT>,

            <!-- only included if template has a text header -->
            "message_template_title": "<TEMPLATE_HEADER_TEXT>",
 
            <!-- only included if template has a footer -->
            "message_template_footer": "<TEMPLATE_FOOTER_TEXT>", 

            <!-- only included if template has a url or phone number button -->
            "message_template_buttons": [
              {
                "message_template_button_type": "<BUTTON_TYPE>",
                "message_template_button_text": "<BUTTON_LABEL_TEXT>",

                <!--only included for url buttons -->
                "message_template_button_url": "<BUTTON_URL>",

                <!--only included for phone number buttons -->
                "message_template_button_phone_number": "<BUTTON_PHONE_NUMBER>"
              }
            ]
          },
          "field": "message_template_components_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
Parameters
Placeholder	Description	Example value
<BUTTON_LABEL_TEXT>

String

Button label text.

Email support

<BUTTON_PHONE_NUMBER>

String

Button phone number.

+15550783881

<BUTTON_TYPE>

String

Button type.

Values can include:

CATALOG
COPY_CODE
EXTENSION
FLOW, MPM
ORDER_DETAILS
OTP
PHONE_NUMBER
POSTBACK
REMINDER
SEND_LOCATION
SPM
QUICK_REPLY
URL
VOICE_CALL
URL

<BUTTON_URL>

String

Button URL.

https://www.luckyshrub.com/support

<TEMPLATE_BODY_TEXT>

String

Template body text.

Thank you for your order, {{1}}! Your order number is {{2}}. If you have any questions, contact support using the buttons below. Thanks again!

<TEMPLATE_FOOTER_TEXT>

String

Template footer text.

Lucky Shrub: the Succulent Specialists!

<TEMPLATE_HEADER_TEXT>

String

Template header text.

Your order is confirmed!

<TEMPLATE_ID>

Integer

Template ID.

1315502779341834

<TEMPLATE_LANGUAGE_AND_LOCALE_CODE>

String

Template language and locale code.

en_US

<TEMPLATE_NAME>

String

Template name.

order_confirmation

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
      "time": 1751250234,
      "changes": [
        {
          "value": {
            "message_template_id": 1315502779341834,
            "message_template_name": "order_confirmation",
            "message_template_language": "en_US",
            "message_template_title": "Your order is confirmed!",
            "message_template_element": "Thank you for your order, {{1}}! Your order number is {{2}}. If you have any questions, contact support using the buttons below. Thanks again!",
            "message_template_footer": "Lucky Shrub: the Succulent Specialists!",
            "message_template_buttons": [
              {
                "message_template_button_type": "PHONE_NUMBER",
                "message_template_button_text": "Phone support",
                "message_template_button_phone_number": "+15550783881"
              },
              {
                "message_template_button_type": "URL",
                "message_template_button_text": "Email support",
                "message_template_button_url": "https://www.luckyshrub.com/support"
              }
            ]
          },
          "field": "message_template_components_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}