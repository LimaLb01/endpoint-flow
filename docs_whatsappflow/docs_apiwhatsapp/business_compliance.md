Whats App Business Phone Number Business Compliance Info
Get or update a WhatsApp Business Phone Number's India-based business compliance information.

Business compliance data is only exposed in the WhatsApp app and the WhatsApp Business app, and only if the app user's phone number is India-based (it begins with +91).

Leitura
Get a WhatsApp Business Phone Number's India-based business compliance information.

Requirements
Type	Description
Access Tokens

User, System User, or Business Integration System User

Permissions

whatsapp_business_management

Request Syntax
GET /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/business_compliance_info
Path Parameters
Placeholder	Description	Sample Value
<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>

WhatsApp business phone number ID.

106540352242922

Response
Default fields on a BusinessComplianceInfoSanitized node.

Sample Request
curl 'https://graph.facebook.com/v24.0/106540352242922/business_compliance_info' \
-H 'Authorization: Bearer EAAJB...'
Sample Response
{
  "data": [
    {
      "entity_name": "Lucky Shrub",
      "entity_type": "Partnership",
      "is_registered": true,
      "grievance_officer_details": {
        "name": "Chandravati P.",
        "email": "chandravati@luckyshrub.com",
        "landline_number": "+913857614343",
        "mobile_number": "+913854559033"
      },
      "customer_care_details": {
        "email": "support@luckyshrub.com",
        "landline_number": "+913857614343",
        "mobile_number": "+913854559033"
      },
      "messaging_product": "whatsapp"
    }
  ]
}
Parâmetros
Este ponto de extremidade não tem nenhum parâmetro.
Campos
A leitura desta borda retornará um resultado formatado em JSON:

{
    "data": [],
    "paging": {}
}


data
Uma lista de nós BusinessComplianceInfoSanitized.
paging
Para saber mais detalhes sobre paginação, consulte o Guia da Graph API.
Error Codes
Erro	Descrição
100	Invalid parameter
Criando
You can make a POST request to business_compliance_info edge from the following paths:
/{whats_app_business_phone_number_id}/business_compliance_info
When posting to this edge, a BusinessComplianceInfoSanitized will be created.
Type	Description
Access Tokens

User, System User, or Business Integration System User

Permissions

whatsapp_business_management

Request Syntax
POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/business_compliance_info
Path Parameters
Placeholder	Description	Sample Value
<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>

WhatsApp business phone number ID.

106540352242922

Post Body
See Parameters for property descriptions.

{
    "messaging_product": "whatsapp",
    "entity_name": "<ENTITY_NAME>",
    "entity_type": "<ENTITY_TYPE>",
    "is_registered": <IS_REGISTERED>,
    "grievance_officer_details": {
        "name": "<GRIEVANCE_OFFER_NAME>",
        "email": "<GRIEVANCE_OFFER_EMAIL>",
        "landline_number": "<GRIEVANCE_OFFER_LANDLINE_NUMBER>",
        "mobile_number": "<GRIEVANCE_OFFER_MOBILE_NUMBER>"
    },
    "customer_care_details": {
        "email": "<CUSTOMER_CARE_EMAIL>",
        "landline_number": "<CUSTOMER_CARE_LANDLINE_NUMBER>",
        "mobile_number": "<CUSTOMER_CARE_MOBILE_NUMBER>"
    }
}
Response
See Return Type.

Sample Request
curl 'https://graph.facebook.com/v16.0/106540352242922/business_compliance_info' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
--data-raw '{
    "messaging_product": "whatsapp",
    "entity_name": "Lucky Shrub",
    "entity_type": "PARTNERSHIP",
    "is_registered": true,
    "grievance_officer_details": {
        "name": "Chandravati P.",
        "email": "chandravati@luckyshrub.com",
        "landline_number": "+913857614343",
        "mobile_number": "+913854559033"
    },
    "customer_care_details": {
        "email": "support@luckyshrub.com",
        "landline_number": "+913857614343",
        "mobile_number": "+913854559033"
    }
}'
Sample Response
{
  "success": true
}
Parâmetros
Parâmetro	Descrição
customer_care_details
JSON object
An object describing the owning business entity's customer care contact information.

Obrigatório
entity_name
string
The owning business entity's legal name.

Obrigatório
entity_type
enum {LIMITED_LIABILITY_PARTNERSHIP, SOLE_PROPRIETORSHIP, PARTNERSHIP, PUBLIC_COMPANY, PRIVATE_COMPANY, OTHER}
The owning business entity's business structure or form.

Obrigatório
entity_type_custom
string
The owning business entity's business structure or form. Required if entity_type is OTHER.

grievance_officer_details
JSON object
An object describing the owning business entity's grievance officer and their contact information.

Obrigatório
is_registered
boolean
Set to true if owning business entity is registered. Required if entity_type is OTHER or PARTNERSHIP.

messaging_product
enum {WHATSAPP}
Set to whatsapp.

Obrigatório
Return Type
Struct {
success: bool,
}
Error Codes
Erro	Descrição
192	Invalid phone number
100	Invalid parameter
Atualizando
Não é possível executar esta operação neste ponto de extremidade.
Excluindo
Não é possível executar esta operação neste ponto de extremidade.