Plataforma do WhatsApp Business

Contacts messages
Contacts messages allow you to send rich contact information directly to WhatsApp users, such as names, phone numbers, physical addresses, and email addresses.


When a WhatsApp user taps the message's profile arrow, it displays the contact's information in a profile view:


Each message can include information for up to 257 contacts, although it is recommended to send fewer for usability and negative feedback reasons.

Request syntax
Use the POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages endpoint to send a contacts message to a WhatsApp user.

curl 'https://graph.facebook.com/<API_VERSION>/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <ACCESS_TOKEN>' \
-d '
{
  "messaging_product": "whatsapp",
  "to": "<WHATSAPP_USER_PHONE_NUMBER>",
  "type": "contacts",
  "contacts": [
    {
      "addresses": [
        {
          "street": "<STREET_NUMBER_AND_NAME>",
          "city": "<CITY>",
          "state": "<STATE_CODE>",
          "zip": "<ZIP_CODE>",
          "country": "<COUNTRY_NAME>",
          "country_code": "<COUNTRY_CODE>",
          "type": "<ADDRESS_TYPE>"
        }
        <!-- Additional addresses objects go here, if using -->
      ],
      "birthday": "<BIRTHDAY>",
      "emails": [
        {
          "email": "<EMAIL_ADDRESS>",
          "type": "<EMAIL_TYPE>"
        }
        <!-- Additional emails objects go here, if using -->
      ],
      "name": {
        "formatted_name": "<FULL_NAME>",
        "first_name": "<FIRST_NAME>",
        "last_name": "<LAST_NAME>",
        "middle_name": "<MIDDLE_NAME>",
        "suffix": "<SUFFIX>",
        "prefix": "<PREFIX>"
      },
      "org": {
        "company": "<COMPANY_OR_ORG_NAME>",
        "department": "<DEPARTMENT_NAME>",
        "title": "<JOB_TITLE>"
      },
      "phones": [
          "phone": "<PHONE_NUMBER>",
          "type": "<PHONE_NUMBER_TYPE>",
          "wa_id": "<WHATSAPP_USER_ID>"
        }
        <!-- Additional phones objects go here, if using -->
      ],
      "urls": [
        {
          "url": "<WEBSITE_URL>",
          "type": "<WEBSITE_TYPE>"
        }
        <!-- Additional URLs go here, if using -->
      ]
    }
  ]
}'
Request parameters
Placeholder	Description	Example Value
<ACCESS_TOKEN>

String

Required.

System token or business token.

EAAAN6tcBzAUBOZC82CW7iR2LiaZBwUHS4Y7FDtQxRUPy1PHZClDGZBZCgWdrTisgMjpFKiZAi1FBBQNO2IqZBAzdZAA16lmUs0XgRcCf6z1LLxQCgLXDEpg80d41UZBt1FKJZCqJFcTYXJvSMeHLvOdZwFyZBrV9ZPHZASSqxDZBUZASyFdzjiy2A1sippEsF4DVV5W2IlkOSr2LrMLuYoNMYBy8xQczzOKDOMccqHEZD

<ADDRESS_TYPE>

String

Optional.

Type of address, such as home or work.

Home

<API_VERSION>

String

Optional.

Graph API version.

v24.0
<BIRTHDAY>

String

Optional.

Contact's birthday. Must be in YYYY-MM-DD format.

1999-01-23

<CITY>

String

Optional.

City where the contact resides.

Menlo Park

<COMPANY_OR_ORG_NAME>

String

Optional.

Name of the company where the contact works.

Lucky Shrub

<COUNTRY_CODE>

String

Optional.

ISO two-letter country code.

US

<COUNTRY_NAME>

String

Optional.

Country name.

United States

<DEPARTMENT_NAME>

String

Optional.

Department within the company.

Legal

<EMAIL_ADDRESS>

String

Optional.

Email address of the contact.

bjohnson@luckyshrub.com

<EMAIL_TYPE>

String

Optional.

Type of email, such as personal or work.

Work

<FIRST_NAME>

String

Optional.

Contact's first name.

Barbara

<FORMATTED_NAME>

String

Required.

Contact's formatted name. This will appear in the message alongside the profile arrow button.

Barbara J. Johnson

<JOB_TITLE>

String

Optional.

Contact's job title.

Lead Counsel

<LAST_NAME>

String

Optional.

Contact's last name.

Johnson

<MIDDLE_NAME>

String

Optional.

Contact's middle name.

Joana

<PHONE_NUMBER>

String

Optional.

WhatsApp user phone number.

+16505559999

<PHONE_NUMBER_TYPE>

String

Optional.

Type of phone number. For example, cell, mobile, main, iPhone, home, work, etc.

Home

<PREFIX>

String

Optional.

Prefix for the contact's name, such as Mr., Ms., Dr., etc.

Dr.

<STATE_CODE>

String

Optional.

Two-letter state code.

CA

<STREET_NUMBER_AND_NAME>

String

Optional.

Street address of the contact.

1 Lucky Shrub Way

<SUFFIX>

String

Optional.

Suffix for the contact's name, if applicable.

Esq.

<WEBSITE_TYPE>

String

Optional.

Type of website. For example, company, work, personal, Facebook Page, Instagram, etc.

Company

<WEBSITE_URL>

String

Optional.

Website URL associated with the contact or their company.

https://www.luckyshrub.com

<WHATSAPP_USER_ID>

String

Optional.

WhatsApp user ID. If omitted, the message will display an Invite to WhatsApp button instead of the standard buttons.

See Button Behavior below.

19175559999

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

<ZIP_CODE>

String

Optional.

Postal or ZIP code.

94025

Button behavior
If you include the contact's WhatsApp ID in the message (via the wa_id property), the message will include a Message and a Save contact button:


If the WhatsApp user taps the Message button, it will open a new message with the contact. If the user taps the Save contact button, they will be given the option to save the contact as a new contact, or to update an existing contact.

If you omit the wa_id property, both buttons will be replaced with an Invite to WhatsApp button:


Example request
Example request to send a contacts message with two physical addresses, two email addresses, two phone numbers, and two website URLs.

curl 'https://graph.facebook.com/v24.0/106540352242922/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "to": "+16505551234",
  "type": "contacts",
  "contacts": [
    {
      "addresses": [
        {
          "street": "1 Lucky Shrub Way",
          "city": "Menlo Park",
          "state": "CA",
          "zip": "94025",
          "country": "United States",
          "country_code": "US",
          "type": "Office"
        },
        {
          "street": "1 Hacker Way",
          "city": "Menlo Park",
          "state": "CA",
          "zip": "94025",
          "country": "United States",
          "country_code": "US",
          "type": "Pop-Up"
        }
      ],
      "birthday": "1999-01-23",
      "emails": [
        {
          "email": "bjohnson@luckyshrub.com",
          "type": "Work"
        },
        {
          "email": "bjohnson@luckyshrubplants.com",
          "type": "Work (old)"
        }
      ],
      "name": {
        "formatted_name": "Barbara J. Johnson",
        "first_name": "Barbara",
        "last_name": "Johnson",
        "middle_name": "Joana",
        "suffix": "Esq.",
        "prefix": "Dr."
      },
      "org": {
        "company": "Lucky Shrub",
        "department": "Legal",
        "title": "Lead Counsel"
      },
      "phones": [
        {
          "phone": "+16505559999",
          "type": "Landline"
        },
        {
          "phone": "+19175559999",
          "type": "Mobile",
          "wa_id": "19175559999"
        }
      ],
      "urls": [
        {
          "url": "https://www.luckyshrub.com",
          "type": "Company"
        },
        {
          "url": "https://www.facebook.com/luckyshrubplants",
          "type": "Company (FB)"
        }
      ]
    }
  ]
}'
Example response
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