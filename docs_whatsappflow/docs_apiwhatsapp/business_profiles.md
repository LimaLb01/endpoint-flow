Business Profiles
Get your business profile
Use the GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/whatsapp_business_profile endpoint to get your business phone number's business profile. WhatsApp users can view your business profile by clicking your business's name or number in a WhatsApp message thread.

Example request
curl \ 
'https://graph.facebook.com/v24.0/1906385232743451/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical' \
-H 'Authorization: Bearer EAAFl...'
Example response:
{
  "data": [{
    "about": "My Butterfly Business sells butterflies",
    "address": "101 Butterfly Ln., Butterfly, Ohio",
    "description": "We sell butterflies.",
    "email": "butterflies@butterflies.com",
    "messaging_product": "whatsapp",
    "profile_picture_url": "2:c2FtcGxl...",
    "websites": [
       "https://https://www.butterflies.com/",
       "https://https://www.butterflies.com/amea/"
     ],
    "vertical": "INDUSTRY",
  }]
}
Update Business Profile
To update your profile, make a POST call to /PHONE_NUMBER_ID/whatsapp_business_profile. In your request, you can include the parameters listed below.

Parameters
Name	Description
about

string

Optional.

The business's About text. This text appears in the business's profile, beneath its profile image, phone number, and contact buttons.

String cannot be empty.
Strings must be between 1 and 139 characters.
Rendered emojis are supported however their unicode values are not. Emoji unicode values must be Java- or JavaScript-escape encoded.
Hyperlinks can be included but will not render as clickable links.
Markdown is not supported.
address

string

Optional.

Address of the business. Character limit 256.

description

string

Optional.

Description of the business. Character limit 512.

email

string

Optional.

The contact email address (in valid email format) of the business. Character limit 128.

messaging_product

Required.

The messaging service used for the request. Always set it to "whatsapp" if you are using the WhatsApp Business API.

profile_picture_handle

string

Optional.

Handle of the profile picture. This handle is generated when you upload the binary file for the profile picture to Meta using the Resumable Upload API.

vertical

Optional.

Business category. This can be either an empty string or one of the accepted values below. These values map to the following strings, which are displayed in the business profile in the WhatsApp client. Supported Values:

ALCOHOL = Alcoholic Beverages
APPAREL = Clothing and Apparel
AUTO = Automotive
BEAUTY = Beauty, Spa and Salon
EDU = Education
ENTERTAIN = Entertainment
EVENT_PLAN = Event Planning and Service
FINANCE = Finance and Banking
GOVT = Public Service
GROCERY = Food and Grocery
HEALTH = Medical and Health
HOTEL = Hotel and Lodging
NONPROFIT = Non-profit
ONLINE_GAMBLING = Online Gambling & Gaming
OTC_DRUGS = Over-the-Counter Drugs
OTHER = Other
PHYSICAL_GAMBLING = Non-Online Gambling & Gaming (E.g. Brick and mortar)
PROF_SERVICES = Professional Services
RESTAURANT = Restaurant
RETAIL = Shopping and Retail
TRAVEL = Travel and Transportation
websites

array of strings

Optional.

The URLs associated with the business. For instance, a website, Facebook Page, or Instagram. You must include the http:// or https:// portion of the URL.

There is a maximum of 2 websites with a maximum of 256 characters each.

Sample request
curl -X POST \
  'https://graph.facebook.com/v24.0/1906385232743451/whatsapp_business_profile' \
  -H 'Authorization: Bearer EAAFl...' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "about": "ABOUT",
    "address": "ADDRESS",
    "description": "DESCRIPTION",
    "vertical": "INDUSTRY",
    "email": "EMAIL",
    "websites": [
      "https://WEBSITE-1",
      "https://WEBSITE-2"
    ],
    "profile_picture_handle": "HANDLE_OF_PROFILE_PICTURE"
Sample response
{
  "success": true
}
Delete business profile
To delete your business profile, you must delete your phone number.