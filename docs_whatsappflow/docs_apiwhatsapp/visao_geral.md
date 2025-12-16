Overview
Cloud API, hosted by Meta, allows medium and large businesses to communicate with customers at scale. Using the API, businesses can build systems that connect thousands of customers with agents or bots, enabling both programmatic and manual communication. Additionally, businesses can integrate the API with numerous backend systems, such as CRM and marketing platforms.

HTTP protocol
Cloud API is built on the Graph API, so requests are expressed using the HTTP protocol and combinations of URL parameters, headers, and request bodies. For example, a common call to Cloud API from UNIX-based command line looks like this:

curl 'https://graph.facebook.com/v17.0/106540352242922/messages' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+16505555555",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "Here'\''s the info you requested! https://www.meta.com/quest/quest-3/"
  }
}'
If you are unfamiliar with the Graph API, see our Graph API documentation to learn the basics. The main differences between Graph API and Cloud API are which access token types you will commonly be using, resource permissions, request syntax, and webhooks syntax. These differences are described in further detail in appropriate sections of the Cloud API documentation set.

Resources
These are the primary resources you will be interacting with when using the API.

Business portfolios
To use the API, you must have a business portfolio. If you do not have a portfolio, you will be prompted to create one as part of our Get Started process. Business portfolios serve as a container for your WhatsApp Business Account (WABA) and business phone numbers.

To learn more about business portfolios, see our About business portfolios in Meta Business Suite help center article.

Business verification
You can complete Business Verification to increase your messaging limit, to request to become an Official Business Account, or to get your business phone number's display name to appear in the WhatsApp client.


WhatsApp Business Accounts
A WhatsApp Business Account represents a business on the WhatsApp Business Platform and is composed primarily of metadata about a specific business. Most other WhatsApp resources, such as WhatsApp Business Phone Numbers and WhatsApp Message Templates are associated with a WABA.

You can create a WABA by following the steps in our Get Started document. To learn more about WABAs and their limitations, see WhatsApp Business Accounts.

WhatsApp business phone numbers
A WhatsApp Business Phone Number (business phone number) represents a real phone number, which, once registered for use with Cloud API, can be used to send and receive messages to and from WhatsApp users via the API.

Business phone numbers are composed mostly of metadata about the number itself and your business, and this metadata can be surfaced in the WhatsApp client when users interact with your business phone number.

You can create a business phone number by following the steps in our Get Started document. Note that there are restrictions and limitations on business phone numbers and their uses, which are described in detail in our Business Phone Numbers document.

WhatsApp message templates
WhatsApp Message Templates (template) are customizable templates that you can construct via the API using various template components. Once created, they are automatically reviewed, and if approved, can be used in template messages.

There are two basic types of messages that you can send via the API: free-form messages and template messages. Of the two, template messages are the most restrictive, since they require the use of an approved WhatsApp Message Template. However, since templates must undergo review and be approved before they can be used, template messages are less likely to receive negative feedback from recipients, which can jeopardize your ability to message customers entirely.

To learn more about templates, refer to our Templates document.

Test resources
When you first complete the steps in our Get Started document, a test WABA and test business phone number are automatically created for you.

Test WABAs and test phone numbers are useful for testing purposes, as they bypass most messaging limits and don't require a payment method on file to send template messages.

You can delete your business portfolio and its test resources if:

you are an admin on the business portfolio associated with the app
no other apps are associated with the business portfolio
the business portfolio is not associated with any other WABAs
the WABA is not associated with any other business phone numbers.
To delete your business portfolio and its test resources:

Go to the App Dashboard > WhatsApp > Configuration panel.
Locate the Test Account section.
Click the Delete button.
Webhooks
Webhooks are JSON payloads sent using the HTTP protocol to a public endpoint on your server. Cloud API relies heavily on webhooks, as the contents of any messages sent from a WhatsApp user to your business phone number will be sent as a webhook, and all outgoing message delivery status updates are reported via webhook.

Note that you can deploy a test webhook app for testing purposes. The app just dumps webhooks to the console so you can see their contents. Keep in mind that you eventually need to build your own production endpoint on your own server at some point which digests webhooks according to your own business logic.

See Meta Webhooks to learn more about webhooks and how to digest them, and our Webhooks for WhatsApp Business Accounts document.

Authentication and Authorization
See our Access tokens and Permissions documents.

Versioning
Versioning uses Graph APIs versioning protocol. This means that all endpoint requests can include a version number, and each version will be available for roughly 2 years before it will be retired and can no longer be called.

Throughput
For each registered business phone number, Cloud API supports up to 80 messages per second (mps) by default, and up to 1,000 mps by automatic upgrade. See Throughput for information about automatic upgrade eligibility and how to check your current throughput level.

Rate limits
See WhatsApp Business Management API rate limits.

In addition to these rate limits, we have more granular limits on individual resources such as template messages and test business phone numbers:

Test message rate limit: Applies to unverified WABAs.
Quality rating and messaging limits: Applies to verified WABAs.
Capacity rate limit: Applies to all accounts.
Business phone rate limit: Applies to all accounts and limits the throughput per business phone number.
Available metrics
As a Cloud API user, you can see the number of messages sent and delivered, as well as other metrics. See Get Account Metrics for information.

Scaling
Within Meta's infrastructure, the Cloud API automatically scales and adjusts to handle your workload, within your rate limit (messaging volume and number of WABAs).

Data Privacy & Security
See our Privacy & Security Overview for information.

Encryption
With the Cloud API, every WhatsApp message continues to be protected by Signal protocol encryption that secures messages before they leave the device. This means messages with a WABA are securely delivered to the destination chosen by each business.

The Cloud API uses industry standard encryption techniques to protect data in transit and at rest. The API uses Graph API for sending messages and Webhooks for receiving events, and both operate over industry standard HTTPS, protected by TLS. See our Encryption Overview whitepaper for additional details.

See our Encryption Overview whitepaper for additional details.

Pair Rate Limits
Business phone numbers are limited to sending 1 message every 6 seconds to the same WhatsApp user phone number (0.17 messages/second). This is roughly equivalent to 10 messages per minute, or 600 messages per hour. If you exceed this limit, the API will return error code 131056 until you are within your limit again.

If necessary, you can send up to 45 messages within 6 seconds as a burst. If you send a burst, you are essentially borrowing against your pair rate limit, so you will be prevented from sending subsequent messages to the same user until the amount of time it would normally take to send that many "non-burst" messages to the user has passed. For example, it takes ~2 minutes to send 20 "non-burst" messages to a user, so if you send a burst of 20, you will have to wait ~2 minutes before you can send another message to the user.

To avoid having to calculate post-burst message wait times, we recommend that if a message send request fails after sending a burst, you try again 4^X seconds later, where X = 0, and increases by 1 after each failed attempt, until the request succeeds.

Tools
WhatsApp Manager
The WhatsApp Manager is our Web app that allows you to manually manage WhatsApp resources, such as WABAs, business phone numbers, and templates, and provides an easy way to see insights and quality ratings or limits on these resources. Most functionality offered by the WhatsApp Manager is also available via the API, with a few minor exceptions.

There are several ways to access the WhatsApp Manager. Each path assumes you have already completed all steps in our Get Started document.

Via the Meta Business Suite
Log into the Meta Business Suite.
If you have multiple business portfolios, use the dropdown menu on the left to select the account that owns, or has access to, the WABA you wish to load in the WhatsApp Manager.
In the menu on the left, navigate to Accounts > WhatsApp Accounts.
Select the WABA.
In the Summary tab, click the WhatsApp Manager button.
Via the App Dashboard
Go to My Apps.
Select the app that is associated with the WABA you want to load in the WhatsApp Manager.
In the menu on the left, navigate to WhatsApp > Quickstart.
Click the Account information tile in the WhatsApp Business section.
Via URL
You can go directly to the WhatsApp Manager Overview, which displays all of the WABAs owned by, or shared with, a given business portfolio, by visiting:

https://business.facebook.com/wa/manage/home/

By default, the overview loads the most recent WABA you created or were granted access to, but you can use the dropdown menu on the left to select the business portfolio that contains the WABA you are trying to access. This will take you out of the overview. However, you can use the menu on the left to navigate to Accounts > WhatsApp Accounts > (select the desired WABA) > Settings > WhatsApp Manager (button).

Alternatively, if you have multiple business portfolios, you can append an account's ID to the end of the URL and bookmark it for easier access:

https://business.facebook.com/wa/manage/home/?business_id=<META_BUSINESS_ACCOUNT_ID>

Third-party SDKs
The following third-party SDKs are not affiliated with, nor maintained by, Meta.

PyWA — a Python wrapper for WhatsApp Cloud API
Postman
We have a Cloud API Postman collection containing common queries in our WhatsApp Business Platform workspace.