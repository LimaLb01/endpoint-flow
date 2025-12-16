partner_solutions webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account partner_solutions webhook.

The partner_solutions webhook describes changes to the status of a Multi-Partner Solution.

Triggers
A multi-partner solution is saved as a draft.
A multi-partner solution request is sent to a partner.
A multi-partner solution partner accepts a solution request.
A multi-partner solution partner rejects a solution request.
A multi-partner solution partner requests deactivation of a solution.
A multi-partner solution is deactivated.
Syntax
{
  "entry": [
    {
      "changes": [
        {
          "field": "partner_solutions",
          "value": {
            "event": "<EVENT>",
            "solution_id": "<SOLUTION_ID>",
            "solution_status": "<SOLUTION_STATUS>"
          }
        }
      ],
      "id": "<BUSINESS_PORTFOLIO_ID>",
      "time": <WEBHOOK_TRIGGER_TIMESTAMP>
    }
  ],
  "object": "whatsapp_business_account"
}
Parameters
Placeholder	Description	Example value
<BUSINESS_PORTFOLIO_ID>

String

Business portfolio ID.

506914307656634

<EVENT>

String

Change event. Values can be:

SOLUTION_CREATED - Indicates a new solution was saved as a draft or sent as a request to a partner.

SOLUTION_UPDATED - Indicates an existing solution has been updated.

SOLUTION_CREATED

<SOLUTION_ID>

String

Solution ID.

774485461512159

<SOLUTION_STATUS>

String

Solution status. Values can be:

ACTIVE - The solution partner accepted the solution request and the solution can now be used.

DEACTIVATED - The solution has been deactivated.

DRAFT - The solution has been drafted but an invitation request has not been sent to a partner.

INITIATED - The solution has been created and the invitation request sent, but it has not been accepted or rejected yet.

PENDING_DEACTIVATION - The solution owner requested deactivation of the solution but the solution partner has yet to accept or decline the deactivation request.

REJECTED - The solution partner has rejected the solution request.

INITIATED

<WEBHOOK_TRIGGER_TIMESTAMP>

Integer

Unix timestamp indicating when the webhook was triggered.

1739321024

Example
{
  "entry": [
    {
      "changes": [
        {
          "field": "partner_solutions",
          "value": {
            "event": "SOLUTION_CREATED",
            "solution_id": "774485461512159",
            "solution_status": "INITIATED"
          }
        }
      ],
      "id": "506914307656634",
      "time": 1739321024
    }
  ],
  "object": "whatsapp_business_account"
}