history webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account history webhook.

The history webhook is used to synchronize the WhatsApp Business app chat history of a business customer onboarded by a solution provider.

Triggers
a solution provider synchronize the WhatsApp Business app chat history of a business customer who they have onboarded with a WhatsApp Business app phone number, and who has agreed to share their chat history
a solution provider synchronize the WhatsApp Business app chat history of a business customer who they have onboarded with a WhatsApp Business app phone number, but the customer has declined to share their chat history
Chat history sharing approved
Chat history contents
If the business customer has already approved chat history sharing when the solution provider requests the business's chat history, a series of history webhooks will be triggered, describing all messages sent or received within 180 days of the time when the business was onboarded onto Cloud API.

Messages that are part of a group chat will not be included.
Media messages will not include media asset IDs. Instead, additional history webhooks containing media message asset IDs will be sent separately, but only for media messages sent within 14 days of onboarding.
Note that for efficiency purposes, a single webhook could potentially describe thousands of messages, so we recommend that you capture its contents first, then process the contents asynchronously.

Phases and chunks
Webhooks are divided into three history phases, where day 0 indicates the time when the business was onboarded onto Cloud API:

phase 0: day 0 through day 1
phase 1: day 1 through day 90
phase 2: day 90 through day 180
For each phase, chat history webhooks may be sent in separate chunks, depending on the total number of messages that comprise the thread.

You can use the chunk_order parameter value to arrange these chunks in their sequential order, as they may not be delivered sequentially.
You can use the phase parameter value to monitor phase progress. A value of 2 indicates that the current phase is complete.
You can use the progress parameter value to monitor the overall progress. A value of 100 indicates that synchronization is complete.
If there is no chat history available for a given phase, no corresponding webhooks will be sent.

Syntax
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<CUSTOMER_WABA_ID>",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "<CUSTOMER_DISPLAY_PHONE_NUMBER>",
              "phone_number_id": "<CUSTOMER_PHONE_NUMBER_ID>"
            },
            "history": [
              {
                "metadata": {
                  "phase": <PHASE>,
                  "chunk_order": <CHUNK_ORDER>,
                  "progress": <PROGRESS>
                },
                "threads": [
                  /* First chat history thread object */
                  {
                    "id": "<WHATSAPP_USER_PHONE_NUMBER>",
                    "messages": [
                      /* First message object in thread */
                      {
                        "from": "<BUSINESS_OR_WHATSAPP_USER_PHONE_NUMBER>",
                        "to": "<WHATSAPP_USER_PHONE_NUMBER>", // only included if SMB message echo
                        "id": "<WHATSAPP_MESSAGE_ID>",
                        "timestamp": "<DEVICE_TIMESTAMP>,
                        "type": "<MESSAGE_TYPE>",
                        "<MESSAGE_TYPE>": {
                          <MESSAGE_CONTENTS>
                        },
                        "history_context": {
                          "status": "<MESSAGE_STATUS>"
                        }
                      },
                      /* Additional message objects in thread would follow, if any */
                    ]
                  },
                  /* Additional chat history thread objects would follow, if any */
                ]
              }
            ]
          },
          "field": "history"
        }
      ]
    }
  ]
}
Parameters
Placeholder	Description	Example value
<BUSINESS_OR_WHATSAPP_USER_PHONE_NUMBER>

String

The business customer's phone number, or the WhatsApp user's phone number.

If the value is the business's phone number, the message object describes a message sent by the business to a WhatsApp user.

If the value is the WhatsApp user's phone number, the message object describes a message sent by the WhatsApp user to the business.

15550783881

<CHUNK_ORDER>

Integer

Indicates chunk number, which you can use to order sets of webhooks sequentially.

1

<CUSTOMER_WABA_ID>

String

The business customer's WhatsApp Business Account ID.

102290129340398

<CUSTOMER_DISPLAY_PHONE_NUMBER>

String

The business customer's business phone number.

15550783881

<CUSTOMER_PHONE_NUMBER_ID>

String

The business customer's business phone number ID.

106540352242922

<DEVICE_TIMESTAMP>

String

Unix timestamp indicating when the message was received by the recipient's device.

1738796547

<MESSAGE_CONTENTS>

Object

An object describing the message's contents. This value will vary based on the message type, as well as the contents message.

For example, if a business sends an image message without a caption, the object would not include the caption property.

See Sending messages for examples of payloads for each message type.

{"body":"Here's the info you requested! https://www.meta.com/quest/quest-3/"}

<MESSAGE_STATUS>

String

Indicates the message's most recent delivery stats. Values can be:

DELIVERED
ERROR
PENDING
PLAYED
READ
SENT
READ

<MESSAGE_TYPE>

String

Message type. Note that this placeholder appears twice in the syntax above, as it serves as a placeholder for the type property's value and its matching property name. See the example payload below for a thread with various message types.

If this value is set to media_placeholder, the message object describes a message that contained a media asset. In this case, the message contents will be omitted. Instead, a separate history webhook will follow, describing the content of the message and the media asset ID, but only if the message was sent within the last two weeks of your query. See the example payload below describing a media message's contents.

text

<PHASE>

Integer

Indicates history phase. Values can be:

0 — indicates messages are from day 0 (business onboarding time) through day 1
1 — indicates messages are from day 1 through day 90
2 — indicates messages are from day 90 through day 180
1

<PROGRESS>
Integer

Indicates percentage total of synchronization progress.

Minimum 0, maximum 100.

55

<WHATSAPP_MESSAGE_ID>

String

WhatsApp message ID.

wamid.HBgLMTY1MDM4Nzk0MzkVAgASGBQzQUFERjg0NDEzNDdFODU3MUMxMAA=

<WHATSAPP_USER_PHONE_NUMBER>

String

The WhatsApp user's phone number.

The to property is only included if the message object represents an SMB message echo.

16505551234

Examples
This example webhook describes two message threads: (1) a thread containing a text message and video message sent to a WhatsApp user, and the WhatsApp user's response, and (2) a text message sent to a different WhatsApp user, thanking them for their order.

Note that the media message's contents in the first thread are not described. Instead, a second webhook is triggered, describing the media message's contents.

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
            "history": [
              {
                "metadata": {
                  "phase": 0,
                  "chunk_order": 1,
                  "progress": 55
                },
                "threads": [
                  {
                    "id": "16505551234",
                    "messages": [
                      {
                        "from": "15550783881",
                        "id": "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBIyNDlBOEI5QUQ4NDc0N0FCNjMA",
                        "timestamp": "1739230955",
                        "type": "text",
                        "text": {
                          "body": "Here's the info you requested! https://www.meta.com/quest/quest-3/"
                        },
                        "history_context": {
                          "status": "READ"
                        }
                      },
                      {
                        "from": "15550783881",
                        "id": "wamid.QyNUEHBgLMTY0NjcwNDM1OTUVAgARGBI1Rj3NEYxMzAzMzQ5MkEA",
                        "timestamp": "1739230970",
                        "type": "media_placeholder",
                        "history_context": {
                          "status": "PLAYED"
                        }
                      },
                      {
                        "from": "16505551234",
                        "id": "wamid.N0FCNjMAHBgLMTY0NjcwNDM1OTUVAgARGBIyNDlBOEI5QUQ4NDc0",
                        "timestamp": "1739230970",
                        "type": "text",
                        "text": {
                          "body": "Thanks!"
                        },
                        "history_context": {
                          "status": "READ"
                        }
                      }
                    ]
                  },
                  {
                    "id": "12125557890",
                    "messages": [
                      {
                        "from": "15550783881",
                        "id": "wamid.BIyNDlBOEI5N0FCNjMAHBgLMTY0NjcwNDM1OTUVAgARGQUQ4NDc0",
                        "timestamp": "1739230970",
                        "type": "text",
                        "text": {
                          "body": "Thanks for your order! As a thank you, use code THANKS30 to get 30% of your next order."
                        },
                        "history_context": {
                          "status": "DELIVERED"
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "field": "history"
        }
      ]
    }
  ]
}
This example webhook describes a media message's contents.

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
            "messages": [
              {
                "from": "16505551234",
                "id": "wamid.QyNUEHBgLMTY0NjcwNDM1OTUVAgARGBI1Rj3NEYxMzAzMzQ5MkEA",
                "timestamp": "1738796547",
                "type": "image",
                "image": {
                  "caption": "Black Prince echeveria",
                  "mime_type": "image/jpeg",
                  "sha256": "3f9d94d399fa61c191bc1d4ca71375a035cd9b9f5b1128e1f0963a415c16b0cc",
                  "id": "24230790383178626"
                }
              }
            ]
          },
          "field": "history"
        }
      ]
    }
  ]
}
Chat history sharing declined
Syntax
{
  "messaging_product": "whatsapp",
  "metadata": {
    "display_phone_number": "<CUSTOMER_DISPLAY_PHONE_NUMBER>",
    "phone_number_id": "<CUSTOMER_PHONE_NUMBER_ID>"
  },
  "history": [
    {
      "errors": [
        {
          "code": 2593109,
          "title": "History sync is turned off by the business from the WhatsApp Business App",
          "message": "History sync is turned off by the business from the WhatsApp Business App",
          "error_data": {
            "details": "History sharing is turned off by the business"
          }
        }
      ]
    }
  ]
}
Parameters
Placeholder	Description	Example value
<CUSTOMER_DISPLAY_PHONE_NUMBER>

String

The business customer's business phone number.

15550783881

<CUSTOMER_PHONE_NUMBER_ID>

String

The business customer's business phone number ID.

106540352242922

Example
{
  "messaging_product": "whatsapp",
  "metadata": {
    "display_phone_number": "15550783881",
    "phone_number_id": "106540352242922"
  },
  "history": [
    {
      "errors": [
        {
          "code": 2593109,
          "title": "History sync is turned off by the business from the WhatsApp Business App",
          "message": "History sync is turned off by the business from the WhatsApp Business App",
          "error_data": {
            "details": "History sharing is turned off by the business"
          }
        }
      ]
    }
  ]
}