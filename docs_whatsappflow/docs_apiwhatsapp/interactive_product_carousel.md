Interactive product carousel messages
This message type will be available for delivery to WhatsApp users on November 11.

The interactive product carousel message enables businesses to send horizontally scrollable product cards within WhatsApp conversations, allowing users to browse and engage with products directly in-thread.

This format integrates with the Product Catalog and supports Single Product Message (SPM) actions on each card, providing a seamless and interactive shopping experience via the WhatsApp Business APIs and mobile clients

How to build a product carousel message
The product carousel message contains a card object. You must add 2 card objects to your message, and can add a maximum of 10. Each card exists in a cards[] array and must be given a "card_index" value of 0 through 9.

The type of each card must be set to "product", and each card must reference the same "catalog_id".

You must add a message body to the message, and no header, footer, or buttons are allowed.

Lastly, each card must specify the product and catalog identifiers "product_retailer_id" (string, required) and "catalog_id".

The card object
...
{
  "card_index": 0,
  "type": "product",
  "action": {
    "product_retailer_id": "abc123xyz",
    "catalog_id": "123456789"
}
...
Request Syntax
curl 'https://graph.facebook.com/<API_VERSION>/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "<WHATSAPP_USER_PHONE_NUMBER>",
    "type": "interactive", // must be interactive
    "interactive": {
      "type": "carousel", // must be carousel
      "body": {
        "text": "<MESSAGE_BODY_TEXT>"
      },
      "action": {
        "cards": [
          {
            "card_index": 0,
            "type": "product",
            "action": {
              "product_retailer_id": "abc123xyz",
              "catalog_id": "123456789"
            }
          }
          // additional product cards
        ]
      }
    }
  }'
Request parameters
Placeholder	Description	Sample Value
<ACCESS_TOKEN>

String

Required.

System token or business token.

EAAAN6tcBzAUBOZC82CW7iR2LiaZBwUHS4Y7FDtQxRUPy1PHZClDGZBZCgWdrTisgMjpFKiZAi1FBBQNO2IqZBAzdZAA16lmUs0XgRcCf6z1LLxQCgLXDEpg80d41UZBt1FKJZCqJFcTYXJvSMeHLvOdZwFyZBrV9ZPHZASSqxDZBUZASyFdzjiy2A1sippEsF4DVV5W2IlkOSr2LrMLuYoNMYBy8xQczzOKDOMccqHEZD

<API_VERSION>

String

Optional.

Graph API version.

v24.0
<MESSAGE_BODY_TEXT>

String

Required.

Maximum 1024 characters.

Which option do you prefer?

<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>

String

Required.

WhatsApp business phone number ID.

106540352242922

<WHATSAPP_USER_PHONE_NUMBER>

String

Required.

WhatsApp user phone number.

+16505551234

Card Object Parameters
...
{
  "card_index": <INDEX>,
  "type": "product",
  "action": {
    "product_retailer_id": "<PRODUCT_RETAILER_ID>",
    "catalog_id": "<CATALOG_ID>"
}
...
Placeholder	Description	Sample value
<INDEX>


Integer

Required


Unique index for each card (0-9). Must not repeat within the message.

2

<PRODUCT_RETAILER_ID>


String

Required


The unique retailer ID of the product in the catalog.

"0JkSUu4qizuXv"

<CATALOG_ID>


String

Required


The unique ID of the catalog containing the product.

"Lq1ZtoWL5OkljTerAW"

Example Request
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "1234567890",
  "type": "interactive",
  "interactive": {
    "type": "carousel",
    "body": {
      "text": "Check out our featured products!"
    },
    "action": {
      "cards": [
        {
          "card_index": 0,
          "type": "product",
          "action": {
            "product_retailer_id": "abc123xyz",
            "catalog_id": "123456789"
          }
        },
        {
          "card_index": 1,
          "type": "product",
          "action": {
            "product_retailer_id": "def456uvw",
            "catalog_id": "123456789"
          }
        }
      ]
    }
  }
}
Example Response
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "+16505551234",
      "wa_id": "16505551234"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI1RjQyNUE3NEYxMzAzMzQ5MkEA"
    }
  ]
}
Nesta Página
Interactive product carousel messages
How to build a product carousel message
The card object
Request Syntax
Request parameters
Card Object Parameters
Example Request
Example Response
