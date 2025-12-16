Messages
Use the /PHONE_NUMBER_ID/messages endpoint to send text, media, contacts, location, and interactive messages, as well as message templates to your customers. Learn more about the messages you can send.

Endpoint	Authentication
/PHONE_NUMBER_ID/messages

(consulte Get Phone Number ID)

Developers can authenticate their API calls with the access token generated in the App Dashboard > WhatsApp > API Setup.


Solution Partners must authenticate themselves with an access token with the whatsapp_business_messaging permission.

Messages are identified by a unique ID (WAMID). You can track message status in the Webhooks through its WAMID. You could also mark an incoming message as read through messages endpoint. This WAMID can have a maximum length of up to 128 characters.

With the Cloud API, there is no longer a way to explicitly check if a phone number has a WhatsApp ID. To send someone a message using the Cloud API, just send it directly to the WhatsApp user's phone number after they have opted-in. See Sending messages.

Message object
To send a message, you must first assemble a message object with the content you want to send. These are the parameters used in a message object:

Name	Description
audio

object

Required when type=audio.

A media object containing audio.

biz_opaque_callback_data

string

Optional.

An arbitrary string, useful for tracking.

For example, you could pass the message template ID in this field to track your customer's journey starting from the first message you send. You could then track the ROI of different message template types to determine the most effective one.

Any app subscribed to the messages webhook field on the WhatsApp Business Account can get this string, as it is included in statuses object within webhook payloads.

Cloud API does not process this field, it just returns it as part of sent/delivered/read message webhooks.

Maximum 512 characters.

Cloud API only.

contacts

object

Required when type=contacts.

A contacts object.

context

object

Required if replying to any message in the chat thread.

An object containing the ID of a previous message you are replying to. For example:

{"message_id":"MESSAGE_ID"}

Cloud API only.

document

object

Required when type=document.

A media object containing a document.

hsm

object

Contains an hsm object. This option was deprecated with v2.39 of the On-Premises API. Use the template object instead.

On-Premises API only.

image

object

Required when type=image.

A media object containing an image.

interactive

object

Required when type=interactive.

An interactive object. The components of each interactive object generally follow a consistent pattern: header, body, footer, and action.

location

object

Required when type=location.

A location object.

message_activity_sharing

boolean

Optional

Controls whether event activity is shared for each message. This parameter will override the WhatsApp Business Account level setting for MM Lite API and the Business level setting for CloudAPI. Values: false , true.

messaging_product

string

Required

Messaging service used for the request. Use "whatsapp".

Cloud API only.

preview_url

boolean

Required if type=text.

Allows for URL previews in text messages — See the Sending URLs in Text Messages. This field is optional if not including a URL in your message. Values: false (default), true.

On-Premises API only. Cloud API users can use the same functionality with the preview_url field inside a text object.

recipient_type

string

Optional.

Currently, you can only send messages to individuals. Set this as individual.

Default: individual

status

string

A message's status. You can use this field to mark a message as read. See the following guides for information:

Cloud API: Mark Messages as Read
On-Premises API: Mark Messages as Read
sticker

object

Required when type=sticker.

A media object containing a sticker.


Cloud API: Static and animated third-party outbound stickers are supported in addition to all types of inbound stickers. A static sticker needs to be 512x512 pixels and cannot exceed 100 KB. An animated sticker must be 512x512 pixels and cannot exceed 500 KB.

On-Premises API: Only static third-party outbound stickers are supported in addition to all types of inbound stickers. A static sticker needs to be 512x512 pixels and cannot exceed 100 KB. Animated stickers are not supported.

template

object

Required when type=template.

A template object.

text

object

Required for text messages.

A text object.

to

string

Required.

WhatsApp ID or phone number of the customer you want to send a message to. See Phone Number Formats.

If needed, On-Premises API users can get this number by calling the contacts endpoint.

type

string

Optional.

The type of message you want to send. If omitted, defaults to text.

The following objects are nested inside the message object:

Text object
Media object
Reaction object
Template object
Location object
Contacts object
Interactive object
Contacts object
Nome	Descrição
addresses

objeto	
Opcional.

Endereços de contato completos formatados como um objeto addresses. O objeto pode conter os seguintes campos:

streetstring – Opcional. Nome e número da rua.

citystring – Opcional. Nome da cidade.

statestring – Opcional. Abreviação do estado.

zipstring – Opcional. Código postal.

countrystring – Opcional. Nome completo do país.

country_codestring – Opcional. Abreviação do país com duas letras.

typestring – Opcional. Os valores padrão são HOME e WORK.

birthday

Opcional.

Cadeia de caracteres no formato YYYY-MM-DD.

emails

objeto	
Opcional.

Endereços de email para contato formatados como um objeto emails. O objeto pode conter os seguintes campos:

emailstring – Opcional. Endereço de email.

typestring – Opcional. Os valores padrão são HOME e WORK.

name

objeto	
Obrigatório.

Nome completo do contato formatado como um objeto name. O objeto pode conter os seguintes campos:

formatted_namestring – Obrigatório. Nome completo, como é exibido normalmente.

first_namestring – Opcional*. Nome.

last_namestring – Opcional*. Sobrenome.

middle_namestring – Opcional*. Nome do meio.

suffixstring – Opcional*. Sufixo do nome.

prefixstring – Opcional*. Prefixo do nome.


*Pelo menos um dos parâmetros opcionais precisa ser incluído com o parâmetro formatted_name.

org

objeto	
Opcional.

Informações de contato da organização formatadas como um objeto org. O objeto pode conter os seguintes campos:

companystring – Opcional. Nome da empresa do contato.

departmentstring – Opcional. Nome do departamento do contato.

titlestring – Opcional. Título da empresa do contato.

phones

objeto	
Opcional.

Número de telefone dos contatos formatado como um objeto phone. O objeto pode conter os seguintes campos:

phonestring – Opcional. Preenchido automaticamente com o valor "wa_id" como um número de telefone formatado.

typestring – Opcional. Os valores-padrão são CELL, MAIN, IPHONE, HOME e WORK.

wa_idstring – Opcional. ID do WhatsApp.

urls

objeto	
Opcional.

URLs de contato formatadas como um objeto urls. O objeto pode conter os seguintes campos:

urlstring – Opcional. URL.

typestring – Opcional. Os valores padrão são HOME e WORK.

Interactive object
Name	Description
action

object	
Required.

Action you want the user to perform after reading the message.

body

object	
Optional for type product. Required for other message types.

An object with the body of the message.


The body object contains the following field:

textstring – Required if body is present. The content of the message. Emojis and markdown are supported. Maximum length: 1024 characters.

footer

object	
Optional. An object with the footer of the message.


The footer object contains the following field:

textstring – Required if footer is present. The footer content. Emojis, markdown, and links are supported. Maximum length: 60 characters.

header

object	
Required for type product_list. Optional for other types.

Header content displayed on top of a message. You cannot set a header if your interactive object is of product type. See header object for more information.

type

object	
Required.

The type of interactive message you want to send. Supported values:


button: Use for Reply Buttons.
call_permission_request: Use for Call Permission Messages to request permissions through the WhatsApp Cloud Calling API before calling customers.
catalog_message: Use for Catalog Messages.
list: Use for List Messages.
product: Use for Single-Product Messages.
product_list: Use for Multi-Product Messages.
flow: Use for Flows Messages.
The following objects are nested inside the interactive object:

Action object
Body object
Footer object
Header object
Section object
Action object
Name	Description
button

string	
Required for List Messages.

Button content. It cannot be an empty string and must be unique within the message. Emojis are supported, markdown is not.


Maximum length: 20 characters.

buttons

array of objects	
Required for Reply Buttons.

A button object can contain the following parameters:


type: only supported type is reply (for Reply Button)
title: Button title. It cannot be an empty string and must be unique within the message. Emojis are supported, markdown is not. Maximum length: 20 characters.
id: Unique identifier for your button. This ID is returned in the webhook when the button is clicked by the user. Maximum length: 256 characters.
You can have up to 3 buttons. You cannot have leading or trailing spaces when setting the ID.

catalog_id

string	
Required for Single Product Messages and Multi-Product Messages.

Unique identifier of the Facebook catalog linked to your WhatsApp Business Account. This ID can be retrieved via the Meta Commerce Manager.

product_retailer_id

string	
Required for Single Product Messages and Multi-Product Messages.

Unique identifier of the product in a catalog.


To get this ID go to Meta Commerce Manager and select your Meta Business account. You will see a list of shops connected to your account. Click the shop you want to use. On the left-side panel, click Catalog > Items, and find the item you want to mention. The ID for that item is displayed under the item's name.

sections

array of objects	
Required for List Messages and Multi-Product Messages.

Array of section objects. Minimum of 1, maximum of 10. See section object.

flow_message_version

string	
Required for Flows Messages.

Must be 3.

flow_id

string	
Required for Flows Messages unless flow_name is set.

Unique identifier of the Flow provided by WhatsApp.

Cannot be used with the flow_name parameter. Only one of these parameters is required.

flow_name

string	
Required for Flows Messages unless flow_id is set.

The name of the Flow that you created. Changing the Flow name will require updating this parameter to match the new name.

Cannot be used with the flow_id parameter. Only one of these parameters is required.

flow_cta

string	
Required for Flows Messages.

Text on the CTA button, eg. "Signup".


CTA text length is advised to be 30 characters or less (no emoji).

mode

string	
Optional for Flows Messages.

The current mode of the Flow, either draft or published.


Default: published

flow_token

string	
Optional for Flows Messages.

A token that is generated by the business to serve as an identifier.


Default: unused

flow_action

string	
Optional for Flows Messages.

navigate or data_exchange. Use navigate to predefine the first screen as part of the message. Use data_exchange for advanced use-cases where the first screen is provided by your endpoint.


Default: navigate

flow_action_payload

object	
Optional for Flows Messages.

Optional only if flow_action is navigate. The object can contain the following parameters:

screenstring – Optional. The id of the first screen of the Flow.
Default: FIRST_ENTRY_SCREEN

dataobject – Optional. The input data for the first screen of the Flow. Must be a non-empty object.

Header object
Name	Description
document

object	
Required if type is set to document.

Contains the media object for this document.

gif

object	
Required if type is set to gif.

Contains the media object for this gif.

image

object	
Required if type is set to image.

Contains the media object for this image.

text

string	
Required if type is set to text.

Text for the header. Formatting allows emojis, but not markdown.


Maximum length: 60 characters.

sub_text

string	
Optional.

Text for the header. Formatting allows emojis, but not markdown.


Maximum length: 60 characters.

type

string	
Required.

The header type you would like to use. Supported values:


text: Used for List Messages, Reply Buttons, and Multi-Product Messages.
video: Used for Reply Buttons.
image: Used for Reply Buttons.
document: Used for Reply Buttons.
video

object	
Required if type is set to video.

Contains the media object for this video.

Section object
Name	Description
product_items

array of objects	
Required for Multi-Product Messages.

Array of product objects. There is a minimum of 1 product per section and a maximum of 30 products across all sections.


Each product object contains the following field:


product_retailer_idstring – Required for Multi-Product Messages. Unique identifier of the product in a catalog. To get this ID, go to the Meta Commerce Manager, select your account and the shop you want to use. Then, click Catalog > Items, and find the item you want to mention. The ID for that item is displayed under the item's name.
rows

array of objects	
Required for List Messages.

Contains a list of rows. You can have a total of 10 rows across your sections.


Each row must have a title (Maximum length: 24 characters) and an ID (Maximum length: 200 characters). You can add a description (Maximum length: 72 characters), but it is optional.


Example:

"rows": [
  {
   "id":"unique-row-identifier-here",
   "title": "row-title-content-here",
   "description": "row-description-content-here",           
   }
]
title

string	
Required if the message has more than one section.

Title of the section.


Maximum length: 24 characters.

Location object
Name	Description
latitude

Required.

Location latitude in decimal degrees.

longitude

Required.

Location longitude in decimal degrees.

name

Required.

Name of the location.

address

Required.

Address of the location.

Media object
See Get Media ID for information on how to get the ID of your media object. For information about supported media types for Cloud API, see Supported Media Types.

Name	Description
id

string	
Required when type is audio, document, image, sticker, or video and you are not using a link.


The media object ID. Do not use this field when message type is set to text.

link

string	
Required when type is audio, document, image, sticker, or video and you are not using an uploaded media ID (i.e. you are hosting the media asset on your public server).

The protocol and URL of the media to be sent. Use only with HTTP/HTTPS URLs.


Do not use this field when message type is set to text.


Cloud API users only:


See Media HTTP Caching if you would like us to cache the media asset for future messages.
When we request the media asset from your server you must indicate the media's MIME type by including the Content-Type HTTP header. For example: Content-Type: video/mp4. See Supported Media Types for a list of supported media and their MIME types.
caption

string	
Optional.


Media asset caption. Do not use with audio or sticker media.


On-Premises API users:

For v2.41.2 or newer, this field is is limited to 1024 characters.
Captions are currently not supported for document media.
filename

string	
Optional.


Describes the filename for the specific document. Use only with document media.


The extension of the filename will specify what format the document is displayed as in WhatsApp.

provider

string	
Optional. On-Premises API only.

This path is optionally used with a link when the HTTP/HTTPS link is not directly accessible and requires additional configurations like a bearer token. For information on configuring providers, see the Media Providers documentation.

Template object
Name	Description
name

Required.

Name of the template.

language

object	
Required.

Contains a language object. Specifies the language the template may be rendered in.


The language object can contain the following fields:

policystring – Required. The language policy the message should follow. The only supported option is deterministic. See Language Policy Options.

codestring – Required. The code of the language or locale to use. Accepts both language and language_locale formats (e.g., en and en_US). For all codes, see Supported Languages.

components

array of objects	
Optional.

Array of components objects containing the parameters of the message.

namespace

Optional. Only used for On-Premises API.

Namespace of the template.

The following objects are nested inside the template object:

Button object
Components object
Currency object
Date Time object
Language object
Parameter object
Button parameter object
Name	Description (Click the arrow in the left column for supported options.)
type

string	
Required.

Indicates the type of parameter for the button.

Supported Options:

"payload"
"text"
payload

Required for quick_reply buttons.

Developer-defined payload that is returned when the button is clicked in addition to the display text on the button.


See Callback from a Quick Reply Button Click for an example.

text

Required for URL buttons.

Developer-provided suffix that is appended to the predefined prefix URL in the template.

Components object
Name	Description
type

string

Required.

Describes the component type.

Example of a components object with an array of parameters object nested inside:

 "components": [{
   "type": "body",
   "parameters": [{
                "type": "text",
                "text": "name"
            },
            {
            "type": "text",
            "text": "Hi there"
            }]
      }] 
Supported Options:

header
body
button
For text-based templates, we only support the type=body.

sub_type

string

Required when type=button. Not used for the other types.

Type of button to create. Supported Options:

quick_reply: Refers to a previously created quick reply button that allows for the customer to return a predefined message.
url: Refers to a previously created button that allows the customer to visit the URL generated by appending the text parameter to the predefined prefix URL in the template.
catalog: Refers to a previously created catalog button that allows for the customer to return a full product catalog.
parameters

array of objects

Required when type=button.

Array of parameter objects with the content of the message.

For components of type=button, see the button parameter object.

index

Required when type=button. Not used for the other types.

Position index of the button. You can have up to 10 buttons using index values of 0 to 9.

Currency object
Name	Description
fallback_value

Required.

Default text if localization fails.

code

Required.

Currency code as defined in ISO 4217.

amount_1000

Required.

Amount multiplied by 1000.

Date_Time object
Name	Description
fallback_value

Required.

Default text. For Cloud API, we always use the fallback value, and we do not attempt to localize using other optional fields.

Parameter object
Name	Description
type

string	
Required.

Describes the parameter type. Supported values:


currency
date_time
document
image
text
video
For text-based templates, the only supported parameter types are currency, date_time, and text.

text

string	
Required when type=text.

The message’s text. Character limit varies based on the following included component type.


For the header component type:

60 characters
For the body component type:

1024 characters if other component types are included
32768 characters if body is the only component type included
currency

object	
Required when type=currency.

A currency object.

date_time

object	
Required when type=date_time.

A date_time object.

image

object	
Required when type=image.

A media object of type image. Captions not supported when used in a media template.

document

object	
Required when type=document.

A media object of type document. Only PDF documents are supported for media-based message templates. Captions not supported when used in a media template.

video

object	
Required when type=video.

A media object of type video. Captions not supported when used in a media template.

Text object
Name	Description
body

string	
Required for text messages.

The text of the text message which can contain URLs which begin with http:// or https:// and formatting. See available formatting options here.


If you include URLs in your text and want to include a preview box in text messages (preview_url: true), make sure the URL starts with http:// or https:// —https:// URLs are preferred. You must include a hostname, since IP addresses will not be matched.


Maximum length: 4096 characters

preview_url

boolean	
Optional. Cloud API only.

Set to true to have the WhatsApp Messenger and WhatsApp Business apps attempt to render a link preview of any URL in the body text string. URLs must begin with http:// or https://. If multiple URLs are in the body text string, only the first URL will be rendered.


If preview_url is omitted, or if unable to retrieve a preview, a clickable link will be rendered instead.


On-Premises API users, use preview_url in the top-level message payload instead. See Parameters.

Reaction object
Name	Description
message_id

string	
Required.

The WhatsApp Message ID (wamid) of the message on which the reaction should appear. The reaction will not be sent if:


The message is older than 30 days
The message is a reaction message
The message has been deleted
If the ID is of a message that has been deleted, the message will not be delivered.

emoji

string	
Required.

Emoji to appear on the message.


All emojis supported by Android and iOS devices are supported.
Rendered-emojis are supported.
If using emoji unicode values, values must be Java- or JavaScript-escape encoded.
Only one emoji can be sent in a reaction message
Use an empty string to remove a previously sent emoji.
Overview

Guides
See the following guides for full information on how to use the /messages endpoint to send messages:

Send Messages
Send Message Templates
Sell Products & Services
Examples
Text messages
curl -X  POST \
'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/messages' \
-H 'Authorization: Bearer ACCESS_TOKEN' \
-H 'Content-Type: application/json' \
-d '
    {
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": "PHONE_NUMBER",
      "type": "text",
      "text": { // the text object
        "preview_url": false,
        "body": "MESSAGE_CONTENT"
        }
    }'
Reaction messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "reaction",
  "reaction": {
    "message_id": "wamid.HBgLM...",
    "emoji": "\uD83D\uDE00"
  }
}'
Media messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM-PHONE-NUMBER-ID/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE-NUMBER",
  "type": "image",
  "image": {
    "id" : "MEDIA-OBJECT-ID"
  }
}'
Location messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/messages' \
 -H 'Authorization: ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "to": "PHONE_NUMBER",
  "type": "location",
  "location": {
    "longitude": LONG_NUMBER,
    "latitude": LAT_NUMBER,
    "name": LOCATION_NAME,
    "address": LOCATION_ADDRESS
  }
}'
Contact messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/messages' \
 -H 'Authorization: ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "to": "PHONE_NUMBER",
  "type": "contacts",
  "contacts": [{
      "addresses": [{
          "street": "STREET",
          "city": "CITY",
          "state": "STATE",
          "zip": "ZIP",
          "country": "COUNTRY",
          "country_code": "COUNTRY_CODE",
          "type": "HOME"
        },
        {
          "street": "STREET",
          "city": "CITY",
          "state": "STATE",
          "zip": "ZIP",
          "country": "COUNTRY",
          "country_code": "COUNTRY_CODE",
          "type": "WORK"
        }],
      "birthday": "YEAR_MONTH_DAY",
      "emails": [{
          "email": "EMAIL",
          "type": "WORK"
        },
        {
          "email": "EMAIL",
          "type": "HOME"
        }],
      "name": {
        "formatted_name": "NAME",
        "first_name": "FIRST_NAME",
        "last_name": "LAST_NAME",
        "middle_name": "MIDDLE_NAME",
        "suffix": "SUFFIX",
        "prefix": "PREFIX"
      },
      "org": {
        "company": "COMPANY",
        "department": "DEPARTMENT",
        "title": "TITLE"
      },
      "phones": [{
          "phone": "PHONE_NUMBER",
          "type": "HOME"
        },
        {
          "phone": "PHONE_NUMBER",
          "type": "WORK",
          "wa_id": "PHONE_OR_WA_ID"
        }],
      "urls": [{
          "url": "URL",
          "type": "WORK"
        },
        {
          "url": "URL",
          "type": "HOME"
        }]
    }]
}'
Interactive messages
Single-mroduct messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
   "messaging_product": "whatsapp",
   "recipient_type": "individual",
   "to": "PHONE_NUMBER",
   "type": "interactive",
   "interactive": {
     "type": "product",
     "body": {
       "text": "optional body text"
     },
     "footer": {
       "text": "optional footer text"
     },
     "action": {
       "catalog_id": "CATALOG_ID",
       "product_retailer_id": "ID_TEST_ITEM_1"
     }
   }
 }'
Multi-product messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
 "messaging_product": "whatsapp",
   "recipient_type": "individual",
   "to": "PHONE_NUMBER",
   "type": "interactive",
   "interactive": {
     "type": "product_list",
     "header":{
       "type": "text",
       "text": "header-content"
     },
     "body": {
       "text": "body-content"
     },
     "footer": {
       "text": "footer-content"
     },
     "action": {
       "catalog_id": "CATALOG_ID",
       "sections": [
         {
           "title": "section-title",
           "product_items": [
             { "product_retailer_id": "product-SKU-in-catalog" },
             { "product_retailer_id": "product-SKU-in-catalog" },
             ...
           ]
         },
         {
           "title": "section-title",
           "product_items": [
             { "product_retailer_id": "product-SKU-in-catalog" },
             { "product_retailer_id": "product-SKU-in-catalog" },
             ...
           ]
         }
       ]
     }
   }
 }
Catalog messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive" : {
    "type" : "catalog_message",
    "body" : {
      "text": "Thanks for your order! Tell us what address you’d like this order delivered to."
    },
    "action": {
      "name": "catalog_message",
      "parameters": { 
        "thumbnail_product_retailer_id": "<Product-retailer-id>"
      }
    }
  }
}'
Flows messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive" : {
    "type": "flow",
    "header": {
      "type": "text",
      "text": "Flow message header"
    },
    "body": {
      "text": "Flow message body"
    },
    "footer": {
      "text": "Flow message footer"
    },
    "action": {
      "name": "flow",
      "parameters": {
        "flow_message_version": "3",
        "flow_id": "<FLOW_ID>", // Or flow_name
        "flow_cta": "Book!",
       }
      }
    }
  }
}'
  
List messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "HEADER_TEXT"
    },
    "body": {
      "text": "BODY_TEXT"
    },
    "footer": {
      "text": "FOOTER_TEXT"
    },
    "action": {
      "button": "BUTTON_TEXT",
      "sections": [
        {
          "title": "SECTION_1_TITLE",
          "rows": [
            {
              "id": "SECTION_1_ROW_1_ID",
              "title": "SECTION_1_ROW_1_TITLE",
              "description": "SECTION_1_ROW_1_DESCRIPTION"
            },
            {
              "id": "SECTION_1_ROW_2_ID",
              "title": "SECTION_1_ROW_2_TITLE",
              "description": "SECTION_1_ROW_2_DESCRIPTION"
            }
          ]
        },
        {
          "title": "SECTION_2_TITLE",
          "rows": [
            {
              "id": "SECTION_2_ROW_1_ID",
              "title": "SECTION_2_ROW_1_TITLE",
              "description": "SECTION_2_ROW_1_DESCRIPTION"
            },
            {
              "id": "SECTION_2_ROW_2_ID",
              "title": "SECTION_2_ROW_2_TITLE",
              "description": "SECTION_2_ROW_2_DESCRIPTION"
            }
          ]
        }
      ]
    }
  }
}'
Reply button
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "BUTTON_TEXT"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "UNIQUE_BUTTON_ID_1",
            "title": "BUTTON_TITLE_1"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "UNIQUE_BUTTON_ID_2",
            "title": "BUTTON_TITLE_2"
          }
        }
      ]
    }
  }
}'
Call permissions request messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER_ID>" or "<WHATSAPP_ID>",
  "type": "interactive",
  "interactive": {
    "type": "call_permission_request",
    "action": {
      "name": "call_permission_request"
    },
    "body": {
      "text": "We would like to call you to help support your query on Order No: ON-12853."
    }
  }
}'
Template messages
curl -X  POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER_ID/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "PHONE_NUMBER",
  "type": "template",
  "template": {
    "name": "TEMPLATE_NAME",
    "language": {
      "code": "LANGUAGE_AND_LOCALE_CODE"
    },
    "components": [
      {
        "type": "header",
        "parameters": [
          {
            "type": "image",
            "image": {
              "link": "http(s)://URL"
            }
          }
        ]
      },
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "TEXT_STRING"
          },
          {
            "type": "currency",
            "currency": {
              "fallback_value": "VALUE",
              "code": "USD",
              "amount_1000": NUMBER
            }
          },
          {
            "type": "date_time",
            "date_time": {
              "fallback_value": "MONTH DAY, YEAR"
            }
          }
        ]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": "0",
        "parameters": [
          {
            "type": "payload",
            "payload": "PAYLOAD"
          }
        ]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": "1",
        "parameters": [
          {
            "type": "payload",
            "payload": "PAYLOAD"
          }
        ]
      }
    ]
  }
}'
Reply to message
curl -X POST \
 'https://graph.facebook.com/v24.0/FROM_PHONE_NUMBER/messages' \
 -H 'Authorization: Bearer ACCESS_TOKEN' \
 -H 'Content-Type: application/json' \
 -d '{
  "messaging_product": "whatsapp",
  "context": {
     "message_id": "MESSAGE_ID"
  },
  "to": "PHONE_NUMBER",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "your-text-message-content"
  }
}’
Successful response
    {
      "messaging_product": "whatsapp",
      "contacts": [
        {
          "input": "16505555555",
          "wa_id": "16505555555"
        }
      ],
      "messages": [
        {
          "id": "wamid.HBgLMTY1MDUwNzY1MjAVAgARGBI5QTNDQTVCM0Q0Q0Q2RTY3RTcA"
        }
      ]
    }
    
Applies to businesses in Brazil, Colombia, and Singapore, starting September 12, 2023. Applies to all businesses starting October 12, 2023.

Messages will have one of the following statuses which will be returned in each of the messages objects

"message_status":"accepted" : means the message was sent to the intended recipient
"message_status":"held_for_quality_assessment": means the message send was delayed until quality can be validated and it will either be sent or dropped at this point

      {
      "messaging_product": "whatsapp",
      "contacts": [
        {
          "input": "16505555555",
          "wa_id": "16505555555"
        }
      ],
      "messages": [
        {
          "id": "wamid.HBgLMTY1MDUwNzY1MjAVAgARGBI5QTNDQTVCM0Q0Q0Q2RTY3RTcA",
          "message_status": "accepted",
        }
      ]
    }
    