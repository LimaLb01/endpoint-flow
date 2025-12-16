Conversational Components
Conversational components are in-chat features that you can enable on business phone numbers. They make it easier for WhatsApp users to interact with your business. You can configure easy-to-use commands, provide pre-written ice breakers that users can tap, and greet first time users with a welcome message.

Limitations
If a WhatsApp user taps a universal link (i.e. wa.me link) configured with pre-filled text, the user interfaces for ice breakers are automatically dismissed.

Configure using WhatsApp Manager (WAM)
You can configure all of these features in WhatsApp Manager on the specific numbers you choose:

Navigate to the My Apps dashboard in the Meta for Developers site.
Select your app, then on the left panel select Configuration under WhatsApp.
Under Phone Numbers select Manage Phone Numbers.
On the far right of the phone number you want to configure, select the Gear Icon under Settings.
Select Automations.
Access and configure Conversational Components.
Solution Partners can configure these features for their customers as well if they have access to their customer's WhatsApp Business Account in WhatsApp Manager.

Welcome messages
Welcome messages are currently not functioning as intended.

Unfortunately, we do not have a timeline for when this feature is expected to be implemented in the future.

All freeform, interactive, and template message types can be sent as welcome messages. Categorized message pricing will apply.

You can be notified by webhook whenever a WhatsApp user opens a chat with you for the first time. This can be useful if you want to reply to these users with a special welcome message of your own design.

Welcome Messages are great for service interactions, such as customer support or account servicing. For example, you can embed a WhatsApp button on your app or website. When users tap the button, they will be redirected to WhatsApp where they will receive a welcome message that provides context on how they can interact with you.


If you enable this feature and a user messages you, the WhatsApp client checks for an existing message thread between the user and your business phone number. If there is none, the client triggers a messages webhook with type set to request_welcome. You can then respond to the user with your own welcome message.

The request_welcome webhook triggers a customer service window which allows your business to send free-form messages when responding to customers.


Carousel template message as a Welcome Message

Webhook payload
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
            "messages": [
              {
                "from": "<WHATSAPP_USER_PHONE_NUMBER_ID>",
                "id": "<WHATSAPP_MESSAGE_ID>",
                "timestamp": "<TIMESTAMP>",
                "type": "request_welcome"  // Indicates first time message from WhatsApp user
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
Ice breakers
Ice breakers are customizable, tappable text strings that appear in a message thread the first time you chat with a user. For example, "Plan a trip" or "Create a workout plan".

Ice Breakers are great for service interactions, such as customer support or account servicing. For example, you can embed a WhatsApp button on your app or website. When users tap the button, they will be redirected to WhatsApp where they can choose from a set of customizable prompts, showing them how to interact with your services.


You can configure up to 4 ice breakers on a business phone number. Each ice breaker can have a maximum of 80 characters. Emojis are not supported.

When a user taps an ice breaker, it triggers a standard received message webhook with the ice breaker string assigned to the body property in the payload. If the user attempts to message you instead of tapping an ice breaker, the keyboard will appear as an overlay, but it can be dismissed to see the ice breaker menu again.

If a WhatsApp user taps a universal link (wa.me or api.whatsapp.com links) configured with pre-filled text, the user interfaces for ice breakers are automatically dismissed.

Webhook payload
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
            "messages": [
              {
                "from": "<WHATSAPP_USER_PHONE_NUMBER_ID>",
                "id": "<WHATSAPP_MESSAGE_ID>",
                "timestamp": "<TIMESTAMP>",
                "text": {
                  "body": "Plan a trip"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
Commands
Commands are text strings that WhatsApp users can see by typing a forward slash in a message thread with your business.


Commands are composed of the command itself and a hint, which gives the user an idea of what can happen when they use the command. For example, you could define the command:

/imagine - Create images using a text prompt

When a WhatsApp user types, /imagine cars racing on Mars, it would trigger a received message webhook with that exact text string assigned to the body property. You could then generate and return an image of cars racing on the planet Mars.

You can define up to 30 commands. Each command has a maximum of 32 characters, and each hint has a maximum of 256 characters. Emojis are not supported.

Webhook payload
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
            "messages": [
              {
                "from": "<WHATSAPP_USER_PHONE_NUMBER_ID>",
                "id": "<WHATSAPP_MESSAGE_ID>",
                "timestamp": "<TIMESTAMP>",
                "text": {
                  "body": "/imagine cars racing on Mars"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
Configuring using The API
Using the API, you can also configure conversational components and view any configured values.

The Conversational Components API has two endpoints:

POST </PHONE_NUMBER_ID>/conversational_automation which is used to configure conversational components on a given phone number.

GET /<PHONE_NUMBER_ID>/conversational_automation which returns the current values for the enable_welcome_message, commands, and prompts fields on a given phone number.

Configure Conversational Components Via The API
You can configure Conversational Components on a given phone number by calling the POST endpoint.

Request syntax
// Enable or disable the Welcome Message for the given phone number ID
POST /<PHONE_NUMBER_ID>/conversational_automation?enable_welcome_message=<ENABLE_DISABLE>

// Configure Commands with names and descriptions
POST /<PHONE_NUMBER_ID>/conversational_automation?commands=<COMMAND_LIST>

// Configure Prompts
POST /<PHONE_NUMBER_ID>/conversational_automation?prompts=<PROMPT>
Body properties

Placeholder	Description	Sample Value
<PHONE_NUMBER_ID>

Integer

Required.


A phone number ID on a WhatsApp Business account.

+12784358810

<ENABLE_DISABLE>

Boolean

Optional.


A boolean for enabling or disabling a welcome message on the phone number.


true

<COMMAND_LIST>

JSON

Optional.


A list of commands to be configured.


"commands": {
     "command_name": "generate"
     "command_description": "Create a new image",
     “command_name”: “rethink”
     “command_description”: “Generate new images from existing images”,
} 
<PROMPTS>

List of String

Optional.


The prompt(s) to be configured.


"prompts": ["Book a flight","plan a vacation"]

Sample request
   curl -X POST \
 'https://graph.facebook.com/v19.0/PHONE_NUMBER_ID/conversational_automation' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
   "enable_welcome_message": true/false,
   "commands": [
     {
       "command_name": "tickets",
       "command_description": "Book flight tickets",
     },
     {
       "command_name": "hotel",
       "command_description": "Book hotel",
     }
   ],
 "prompts": ["Book a flight","plan a vacation"]
}'
Sample response
{
  "success": true
}
View the current configuration using the API
You can view the current configuration of Conversational Components on a given phone number by calling the GET endpoint.

Request Syntax
GET  /<PHONE_NUMBER_ID>?fields=conversational_automation
Sample response
{
  "conversational_automation": {
    "enable_welcome_message": true
    "prompts": [
      "Find the best hotels in the area",
      "Find deals on rental cars"
    ],
    "commands": [
      {
        "command_name": "tickets",
        "command_description": "Book flight tickets",
      },
      {
        "command_name": "hotel",
        "command_description": "Book hotel",
      }
    ],
  }
  "id": "123456"
}
Testing
To test conversational components once they have been configured, open the WhatsApp client and open a chat with your business phone number.

For welcome messages and ice breakers, if you already have a chat thread going with the business phone number, you must first delete the chat thread:

Open the thread in the WhatsApp client.
Tap the business phone number's profile
Tap Clear Chat > Clear All Messages.
Delete Chat.
Start a new chat thread with this business.
You can then send a message to the business phone number, which should trigger the request_welcome webhook.