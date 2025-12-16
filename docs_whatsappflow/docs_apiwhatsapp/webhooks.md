Webhooks
This document describes webhooks and how they are used by the WhatsApp Business Platform.

Webhooks are HTTP requests containing JSON payloads that are sent from Meta's servers to a server of your designation. The WhatsApp Business Platform uses webhooks to inform you of incoming messages, the status of outgoing messages, and other important information, such as changes to your account status, messaging capability upgrades, and changes to your template quality scores.

For example, this is a webhook describing a message sent from a WhatsApp user to a business:

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
                "profile": {
                  "name": "Sheena Nelson"
                },
                "wa_id": "16505551234"
              }
            ],
            "messages": [
              {
                "from": "16505551234",
                "id": "wamid.HBgLMTY1MDM4Nzk0MzkVAgASGBQzQTRBNjU5OUFFRTAzODEwMTQ0RgA=",
                "timestamp": "1749416383",
                "type": "text"
                "text": {
                  "body": "Does it come in another color?"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
Create a webhook endpoint
To receive webhooks, you must create and configure a webhook endpoint. To create your own endpoint, see our Create a webhook endpoint document

If you aren't ready to create your own endpoint yet, you can create a test webhook endpoint that logs webhook payloads to the console. Note, however, that before you can use your app in a production capacity, you must create your own endpoint.

Permissions
You will need the following permissions to receive webhooks:

whatsapp_business_messaging — for messages webhooks
whatsapp_business_management — for all other webhooks
If you are a direct developer, use your system user to grant your app these permissions when generating your system token).

If you are a solution provider and need these permissions to provide appropriate services to your business customers, you must be approved for advanced access for the permissions via App Review before your business customers will be able to grant your app these permissions during onboarding.

Fields
Once you created and configured your webhook endpoint (or have set up a test webhook endpoint), use the App Dashboard > WhatsApp > Configuration panel to subscribe to individual webhook fields.

Note that if you created your app using the Connect with customers through WhatsApp use case, navigate to App Dashboard > Use cases > Customize > Configuration instead.

Field name	Description
account_alerts

The account_alerts webhook notifies you of changes to a business phone number's messaging limit, business profile, and Official Business Account status.

account_review_update

The account_review_update webhook notifies you when a WhatsApp Business Account has been reviewed against our policy guidelines.

account_update

The account_update webhook notifies of changes to a WhatsApp Business Account's partner-led business verification submission, its authentication-international rate eligibility or primary business location, when it is shared with a solution provider, policy or terms violations, or when it is deleted.

automatic_events

The automatic_events webhook notifies you when we detect a purchase or lead event in a chat thread between you and a WhatsApp user who has messaged you via your Click to WhatsApp ad, if you have opted-in to Automatic Events reporting.

business_capability_update

The business_capability_update webhook notifies you of WhatsApp Business Account or business portfolio capability changes (messaging limits, phone number limits, etc.).

history

The history webhook is used to synchronize the WhatsApp Business app chat history of a business customer onboarded by a solution provider.

message_template_components_update

The message_template_components_update webhook notifies you of changes to a template's components.

message_template_quality_update

The message_template_quality_update webhook notifies you of changes to a template's quality score.

message_template_status_update

The message_template_status_update webhook notifies you of changes to the status of an existing template.

messages

The messages webhook describes messages sent from a WhatsApp user to a business and the status of messages sent by a business to a WhatsApp user.

partner_solutions

The partner_solutions webhook describes changes to the status of a Multi-Partner Solution.

payment_configuration_update

The payment_configuration_update webhook notifies you of changes to payment configurations for Payments API India and Payments API Brazil.

phone_number_name_update

The phone_number_name_update webhook notifies you of business phone number display name verification outcomes.

phone_number_quality_update

The phone_number_quality_update webhook notifies you of changes to a business phone number's throughput level.

security

The security webhook notifies you of changes to a business phone number's security settings.

smb_app_state_sync

The smb_app_state_sync webhook is used for synchronizing contacts of WhatsApp Business app users who have been onboarded via a solution provider.

smb_message_echoes

The smb_message_echoes webhook notifies you of messages sent via the WhatsApp Business app or a companion ("linked") device by a business customer who has been onboarded to Cloud API via a solution provider.

template_category_update

The template_category_update webhook notifies you of changes to template's category.

user_preferences

The user_preferences webhook notifies you of changes to a WhatsApp user's marketing message preferences.

Override webhooks
You can use an alternate webhook endpoint for messages webhooks for your WhatsApp Business Account (WABA) or business phone number. This can be useful for testing purposes, or if you are a solution provider and wish to use unique webhook endpoints for each of your onboarded customers.

See our Webhook overrides document to learn how to override webhooks.

Payload size
Webhook payloads can be up to 3 MB.

Webhook delivery failure
If we send a webhook request to your endpoint and your server responds with an HTTP status code other than 200, or if we are unable to deliver the webhook for another reason, we will keep trying with decreasing frequency until the request succeeds, for up to 7 days.

Note that retries will be sent to all apps that have subscribed to webhooks (and their appropriate fields) for the WhatsApp Business Account. This can result in duplicate webhook notifications.

IP addresses
You can get the IP addresses of our webhook servers by running the following command in your terminal:

whois -h whois.radb.net — '-i origin AS32934' | grep '^route' | awk '{print $2}' | sort
We periodically change these IP addresses so if you are allow-listing our servers you might want to occasionally regenerate this list and update your allow-list accordingly.

Troubleshooting
If you are not receiving webhooks:

Make sure your endpoint is accepting requests.
Send a test payload to your endpoint via the App Dashboard > WhatsApp > Configurations panel.
Make sure your app is in Live mode; some webhooks will not be sent if your app is in Dev mode.
Learn more
See our Using Node.js to implement webhooks WhatsApp Business blog post.