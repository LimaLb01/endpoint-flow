payment_configuration_update webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account payment_configuration_update webhook.

The payment_configuration_update webhook notifies you of changes to payment configurations for Payments API India and Payments API Brazil.

Triggers
The payment configuration associated with a WhatsApp Business Account has been connected to a payment gateway account.
The payment configuration associated with a WhatsApp Business Account has been disconnected from a payment gateway account.
The payment configuration associated with a WhatsApp Business Account is now active.
Syntax
{
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "time": <WEBHOOK_TRIGGER_TIMESTAMP>,
      "changes": [
        {
          "field": "payment_configuration_update",
          "value": {
            "configuration_name": "<PAYMENT_CONFIGURATION_NAME>",
            "provider_name": "PAYMENT_GATEWAY_PROVIDER_NAME",
            "provider_mid": "<PAYMENT_GATEWAY_MERCHANT_ACCOUNT_ID>",
            "status": "<PAYMENT_CONFIGURATION_STATUS>",
            "created_timestamp": <PAYMENT_CONFIGURATION_CREATION_TIMESTAMP>,
            "updated_timestamp": <PAYMENT_CONFIGURATION_UPDATE_TIMESTAMP>
          }
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
Parameters
Placeholder	Description	Example value
<PAYMENT_CONFIGURATION_CREATION_TIMESTAMP>

Integer

UNIX timestamp indicated when the payment configuration was created.

1748827100

<PAYMENT_CONFIGURATION_NAME>

String

Payment configuration name to be used in the Order Details messages.

razorpay-prod

<PAYMENT_CONFIGURATION_STATUS>

String

Payment configuration status.

Values can be:

Active — Indicates the payment configuration has been tested in WhatsApp manager and can now be used with Payments API.

Needs Connecting — Indicates the payment configuration has been disconnected from the payment gateway and needs to be connected again.

Needs Testing — Indicates the payment configuration has been connected to the payment gateway but still needs testing in WhatsApp Manager.

Needs Connecting

<PAYMENT_CONFIGURATION_UPDATE_TIMESTAMP>

Integer

UNIX timestamp indicated when the payment configuration was updated.

1749320300

<PAYMENT_GATEWAY_MERCHANT_ACCOUNT_ID>

String

Payment gateway merchant account ID.

acc_GP4lfNA0iIMn5B

<PAYMENT_GATEWAY_PROVIDER_NAME>

String

Name of the payment gateway provider associated with the payment configuration. Values can be:

billdesk
payu
razorpay
zaakpay
razorpay

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
          "field": "payment_configuration_update",
          "value": {
            "configuration_name": "razorpay-prod",
            "provider_name": "razorpay",
            "provider_mid": "acc_GP4lfNA0iIMn5B",
            "status": "Needs Testing",
            "created_timestamp": 1748827100,
            "updated_timestamp": 1749320300
          }
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}