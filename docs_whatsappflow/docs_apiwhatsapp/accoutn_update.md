account_update webhook reference
This reference describes trigger events and payload contents for the WhatsApp Business Account account_update webhook.

The account_update webhook notifies of changes to a WhatsApp Business Account's partner-led business verification submission, its authentication-international rate eligibility or primary business location, when it is shared with a solution provider, policy or terms violations, or when it is deleted.

Triggers
A WhatsApp Business Account's partner-led business verification submission is approved, rejected, or discarded.
A WhatsApp Business Account is deleted.
A WhatsApp Business Account is shared ("installed") or unshared ("uninstalled") with a partner.
A WhatsApp Business Account violates one of our policies or terms.
A WhatsApp Business Account becomes eligible for authentication-international rates.
A WhatsApp Business Account's primary business location is set.
A WhatsApp Business Account gives the partner access to its ad accounts.
Syntax
{
  "entry": [
    {
      "id": "<WHATSAPP_BUSINESS_ACCOUNT_ID>",
      "time": <WEBHOOK_TRIGGER_TIMESTAMP>,
      "changes": [
        {
          "value": {
            "country": "<COUNTRY_CODE>", <!--only included for  BUSINESS_PRIMARY_LOCATION_COUNTRY_UPDATE event -->
            "event": "<EVENT>",

            <!-- only included for AD_ACCOUNT_LINKED event -->
            "waba_info": {
              "waba_id": "<WABA_ID>",
              "ad_account_linked": "<AD_ACCOUNT_ID>",
              "owner_business_id": "<BUSINESS_PORTFOLIO_ID>"
            },

            <!-- only included for ACCOUNT_VIOLATION event -->
            "violation_info": {
              "violation_type": "<VIOLATION_TYPE>"
            },

            <!-- only included for AUTH_INTL_PRICE_ELIGIBILITY_UPDATE event -->
            "auth_international_rate_eligibility": {
              "exception_countries": [
                {
                  "country_code": "<EXCEPTION_COUNTRY_CODE>",
                  "start_time": <EXCEPTION_START_TIME>
                }
              ],
              "start_time": <START_TIME>
            },

            <!-- only included for DISABLED_UPDATE event -->
            "ban_info": {
              "waba_ban_state": "<WABA_BAN_STATE>",
              "waba_ban_date": "<WABA_BAN_DATE>"
            },

            <!-- only included for MM_LITE_TERMS_SIGNED event -->
            "waba_info": {
              "waba_id": "<WABA_ID>",
              "owner_business_id": "<BUSINESS_PORTFOLIO_ID>"
            },

            <!-- only included for PARTNER_* events -->
            "waba_info": {
              "waba_id": "<CUSTOMER_WABA_ID>",
              "owner_business_id": "<CUSTOMER_BUSINESS_PORTFOLIO_ID>",

              <!-- only included for PARTNER_APP_INSTALLED, PARTNER_APP_UNINSTALLED events -->
              "partner_app_id": "<PARTNER_APP_ID>",

              <!-- only included if customer onboarded via a multi-partner solution,
                   omitted from PARTNER_APP_UNINSTALLED events -->
              "solution_id": "<SOLUTION_ID>",
              "solution_partner_business_ids": [
                "<PARTNER_IDS>"
              ]
            },

            <!-- only included for PARTNER_CLIENT_CERTIFICATION_STATUS_UPDATE event -->
            "partner_client_certification_info": {
              "client_business_id": "<CUSTOMER_BUSINESS_PORTFOLIO_ID>",
              "status": "<STATUS>",
              "rejection_reasons": [
                "<REJECTION_REASONS>"
              ]
            }
          },
          "field": "account_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
Parameters
Placeholder	Description	Example value
<COUNTRY_CODE>

String

ISO 3166-1 alpha-2 country code of the country where we have determined the business to be based.

IN

<CUSTOMER_BUSINESS_PORTFOLIO_ID>

String

Business customer's business portfolio ID.

2729063490586005

<CUSTOMER_WABA_ID>

String

Onboarded business customer's WABA ID.

365694316623787

<EVENT>

String

WhatsApp Business Account ("WABA") event.

Values can be:

ACCOUNT_DELETED — Indicates WABA was deleted.

ACCOUNT_VIOLATION — Indicates WABA violated one of our policies or terms.

AD_ACCOUNT_LINKED — Indicates WABA has been onboarded onto Marketing Messages Lite through Embedded Signup or Intent API and gives the partner access to its ad accounts.

AUTH_INTL_PRICE_ELIGIBILITY_UPDATE — Indicates WABA is eligible for authentication-international rates.

BUSINESS_PRIMARY_LOCATION_COUNTRY_UPDATE — Indicates WABA's primary business location has been set.

DISABLED_UPDATE — Indicates WABA violated one of our policies or terms.

MM_LITE_TERMS_SIGNED — Indicates that the WABA has successfully accepted the MM Lite terms of service.

PARTNER_ADDED — Indicates WABA has been shared with a solution provider.

PARTNER_APP_INSTALLED — Indicates a business customer granted the app one more permission.

PARTNER_APP_UNINSTALLED — Indicates a business customer deauthenticated or uninstalled the app.

PARTNER_CLIENT_CERTIFICATION_STATUS_UPDATE — Indicates the WABA'S partner-led business verification submission is approved, rejected, or discarded.

PARTNER_REMOVED — Indicates WABA has been unshared with a solution provider.

PARTNER_ADDED

<EXCEPTION_COUNTRY_CODE>

String

ISO 3166-1 alpha-2 country code of the country with a start time exception.

ID

<EXCEPTION_START_TIME>

Integer

Unix timestamp indicating authentication-international rate start time for the exception country.

1751347424

<PARTNER_IDS>

Array

Strings of business portfolio IDs of the Tech Provider (or Tech Partner) and Solution Partner associated with the Multi-Partner Solution.

"506914307656634","116133292427920"

<REJECTION_REASONS>

Array

Rejection reason of the partner-led business verification submission.

Values can be:

ADDRESS NOT MATCHING — The address in the submission did not match with the address in the client's business profile. Please edit the submission or have the business update their profile and try again.

BUSINESS NOT ELIGIBLE — This business is not eligible for verification via partner-provided information. They can still apply for Meta business verification.

LEGAL NAME NOT MATCHING — The legal name in the submission did not match with the legal name in the client's business profile. Please edit the submission or have the business update their profile and try again.

LEGAL NAME NOT FOUND IN DOCUMENTS — This business could not be verified due to an issue with the submitted documents. This can be due to a number of reasons, including but not limited to:

Business legal name is not mentioned in the documents
The text in the document is unclear or hard to read
MALFORMED DOCUMENTS — The provided documents could not be opened. This can be because the files are corrupted, password protected, or other issues opening the document.

NONE — Indicates the submission was not rejected.

WEBSITE NOT MATCHING — The website in the submission did not match with the website in the client's business profile. Please edit the submission or have the business update their profile and try again.

LEGAL NAME NOT FOUND IN DOCUMENTS

<SOLUTION_ID>

String

Multi-Partner Solution solution ID.

303610109049230

<START_TIME>

Integer

Unix timestamp indicating start time for all countries with authentication-international pricing for which you do not have an exception.

1748780624

<STATUS>

String

Status of the partner-led business verification submission.

Values can be:

APPROVED — Submission has been reviewed and approved.

DISCARDED — Submission has been discarded due to technical issues or has not made progress for a while.

FAILED — Submission has been reviewed and rejected. See rejection_reasons field for more information about why.

PENDING — Submission is pending review.

REVOKED — Submission has been revoked.

APPROVED

<VIOLATION_TYPE>

String

Violation type.

See Violations for a list of possible values.

ADULT

<WABA_BAN_STATE>

String

WABA ban state.

Values can be:

DISABLE — Indicates WABA is disabled.

REINSTATE — Indicates the WABA has been reinstated.

SCHEDULE_FOR_DISABLE — Indicates the WABA has been scheduled to be disabled.

REINSTATE

<WABA_BAN_DATE>

String

Indicates when the WABA was banned.

April 17, 2025

<WEBHOOK_TRIGGER_TIMESTAMP>

Integer

Unix timestamp indicating when the webhook was triggered.

1739321024

<WHATSAPP_BUSINESS_ACCOUNT_ID>

String

WhatsApp Business Account ID.

102290129340398

Examples
Account deleted
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "time": 1743451903,
      "changes": [
        {
          "value": {
            "event": "ACCOUNT_DELETED"
          },
          "field": "account_update"
        }
      ]
    }
  ]
}
Account violation
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "time": 1743451903,
      "changes": [
        {
          "value": {
            "event": "ACCOUNT_VIOLATION",
            "violation_info": {
              "violation_type": "ADULT"
            }
          },
          "field": "account_update"
        }
      ]
    }
  ]
}
Ad account linked
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "2949482758682047",
      "time": 1744823932,
      "changes": [
        {
          "field": "account_update",
          "value": {
            "event": "AD_ACCOUNT_LINKED",
            "waba_info": {
              "owner_business_id": "2329417887457253",
              "ad_account_linked": "980198427534243",
              "waba_id": "980198427658004"
            }
          }
        }
      ]
    }
  ]
}
Authentication-international eligibility
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "time": 1743451903,
      "changes": [
        {
          "value": {
            "auth_international_rate_eligibility": {
              "exception_countries": [
                {
                  "country_code": "ID",
                  "start_time": 1751347424
                }
              ],
              "start_time": 1748780624
            },
            "event": "AUTH_INTL_PRICE_ELIGIBILITY_UPDATE"
          },
          "field": "account_update"
        }
      ]
    }
  ]
}
Disabled update
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "time": 1743451903,
      "changes": [
        {
          "value": {
            "event": "DISABLED_UPDATE",
            "ban_info": {
              "waba_ban_state": "REINSTATE",
              "waba_ban_date": "April 17, 2025"
            }
          },
          "field": "account_update"
        }
      ]
    }
  ]
}
MM Lite terms of service
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "2949482758682047",
      "time": 1744823932,
      "changes": [
        {
          "field": "account_update",
          "value": {
            "event": "MM_LITE_TERMS_SIGNED",
            "waba_info": {
              "owner_business_id": "2329417887457253",
              "waba_id": "980198427658004"
            }
          }
        }
      ]
    }
  ]
}
Partner added
{
  "entry": [
    {
      "id": "2949482758682047",
      "time": 1744823932,
      "changes": [
        {
          "value": {
            "event": "PARTNER_ADDED",
            "waba_info": {
              "waba_id": "980198427658004",
              "owner_business_id": "2329417887457253",
              "solution_id": "1715120619246906",
              "solution_partner_business_ids": [
                "2949482758682047",
                "520744086200222"
              ]
            }
          },
          "field": "account_update"
        }
      ]
    }
  ]
}
Partner app installed
{
  "entry": [
    {
      "id": "2949482758682047",
      "time": 1745337174,
      "changes": [
        {
          "value": {
            "event": "PARTNER_APP_INSTALLED",
            "waba_info": {
              "waba_id": "1191624265890717",
              "owner_business_id": "2329417887457253",
              "partner_app_id": "5731794616896507",
              "solution_id": "1715120619246906",
              "solution_partner_business_ids": [
                "2949482758682047",
                "520744086200222"
              ]
            }
          }
        }
      ],
      "field": "account_update",
      "object": "whatsapp_business_account"
    }
  ]
}
Partner app uninstalled
{
  "entry": [
    {
      "id": "2949482758682047",
      "time": 1748477359,
      "changes": [
        {
          "value": {
            "event": "PARTNER_APP_UNINSTALLED",
            "waba_info": {
              "waba_id": "184943124712545",
              "owner_business_id": "1284923862322270",
              "partner_app_id": "869361281603019"
            },
            "field": "account_update",
            "object": "whatsapp_business_account"
          }
        }
      ]
    }
  ]
}
Partner-led business verification status
{
  "entry": [
    {
      "id": "102290129340398",
      "time": 1743138982,
      "changes": [
        {
          "value": {
            "event": "PARTNER_CLIENT_CERTIFICATION_STATUS_UPDATE",
            "partner_client_certification_info": {
              "client_business_id": "2729063490586005",
              "status": "APPROVED",
              "rejection_reasons": [
                "NONE"
              ]
            }
          },
          "field": "account_update"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
Primary business location set
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "time": 1743138982,
      "changes": [
        {
          "value": {
            "country": "IN",
            "event": "BUSINESS_PRIMARY_LOCATION_COUNTRY_UPDATE"
          },
          "field": "account_update"
        }
      ]
    }
  ]
}
Pricing Tiering Update
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "102290129340398",
      "time": 1743451903,
      "changes": [
        {
          "value": {
            "volume_tier_info": {
                "tier_update_time": 1743451903,
                "pricing_category": "UTILITY",
                "tier": "25000001:50000000",
                "effective_month": "2025-11",
                "region": "INDIA"
            },
            "event": "VOLUME_BASED_PRICING_TIER_UPDATE"
          },
          "field": "account_update"
        }
      ]
    }
  ]
}