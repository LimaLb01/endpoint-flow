Use Case Guide: Collect Purchase Interest
Intro and Overview

It's easier than ever to collect information from your customers, to understand their preferences and collect opt in for promotions ahead of the sales season. With WhatsApp Flows, your customers can provide their details and interests in a fast and simple way, without the need to speak with an agent.A business can leverage this information to drive targeted promotions and purchases.

In this guide, we will walk through the entire process to build a Flow for ‘Collect Purchase Interest’ use case. The templates here can be adapted to suit your use case.

Flows we will build will demonstrate how you can:

Collect relevant personal information from a user
Allow users to select products or services they are interested in, which can be leveraged in future promotional campaigns.
This template can be further adapted for any use case where you want to collect information from your customers to better understand their attributes and preferences (i.e. registering for a webinar, event, newsletter etc.).

Getting Started
To follow this guide, ensure you have:

Completed prerequisites for building Flows.
Flows JSON Template
Flow JSON:
{
  "version": "7.2",
  "screens": [
    {
      "id": "JOIN_NOW",
      "title": "Join Now",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "Form",
            "name": "form",
            "children": [
              {
                "type": "TextSubheading",
                "text": "Get early access to our Mega Sales Day deals. Register now!"
              },
              {
                "type": "TextInput",
                "name": "name",
                "label": "Name",
                "input-type": "text",
                "required": true
              },
              {
                "type": "TextInput",
                "label": "Email",
                "name": "email",
                "input-type": "email",
                "required": true
              },
              {
                "type": "OptIn",
                "label": "I agree to the terms.",
                "required": true,
                "name": "tos_optin",
                "on-click-action": {
                  "name": "navigate",
                  "payload": {},
                  "next": {
                    "name": "TERMS_AND_CONDITIONS",
                    "type": "screen"
                  }
                }
              },
              {
                "type": "OptIn",
                "label": "Keep me up to date about offers and promotions",
                "name": "marketing_optin"
              },
              {
                "type": "Footer",
                "label": "Continue",
                "on-click-action": {
                  "name": "navigate",
                  "next": {
                    "type": "screen",
                    "name": "CATEGORIES"
                  },
                  "payload": {
                    "name": "${form.name}",
                    "email": "${form.email}",
                    "tos_optin": "${form.tos_optin}",
                    "marketing_optin": "${form.marketing_optin}"
                  }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "CATEGORIES",
      "title": "Join now",
      "data": {
        "name": {
          "type": "string",
          "__example__": "Example"
        },
        "email": {
          "type": "string",
          "__example__": "Example"
        },
        "tos_optin": {
          "type": "boolean",
          "__example__": false
        },
        "marketing_optin": {
          "type": "boolean",
          "__example__": false
        }
      },
      "terminal": true,
      "success": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "Form",
            "name": "form",
            "children": [
              {
                "type": "TextSubheading",
                "text": "Let us know which category you are interested in?"
              },
              {
                "type": "CheckboxGroup",
                "label": "Select categories",
                "required": true,
                "name": "categories",
                "data-source": [
                  {
                    "id": "mobile_phones",
                    "title": "Mobile phones"
                  },
                  {
                    "id": "televisions",
                    "title": "Televisions"
                  },
                  {
                    "id": "home_audio",
                    "title": "Home audio"
                  },
                  {
                    "id": "headphones",
                    "title": "Headphones & earphones"
                  },
                  {
                    "id": "ebook_readers",
                    "title": "eBook readers"
                  },
                  {
                    "id": "cameras",
                    "title": "Cameras"
                  },
                  {
                    "id": "accessories",
                    "title": "Accessories"
                  }
                ]
              },
              {
                "type": "Footer",
                "label": "Confirm",
                "on-click-action": {
                  "name": "complete",
                  "payload": {
                    "name": "${data.name}",
                    "email": "${data.email}",
                    "tos_optin": "${data.tos_optin}",
                    "marketing_optin": "${data.marketing_optin}",
                    "categories": "${form.categories}"
                  }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "TERMS_AND_CONDITIONS",
      "title": "Terms and conditions",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Our Terms"
          },
          {
            "type": "TextSubheading",
            "text": "Data usage"
          },
          {
            "type": "TextBody",
            "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae odio dui. Praesent ut nulla tincidunt, scelerisque augue malesuada, volutpat lorem. Aliquam iaculis ex at diam posuere mollis. Suspendisse eget purus ac tellus interdum pharetra. In quis dolor turpis. Fusce in porttitor enim, vitae efficitur nunc. Fusce dapibus finibus volutpat. Fusce velit mi, ullamcorper ac gravida vitae, blandit quis ex. Fusce ultrices diam et justo blandit, quis consequat nisl euismod. Vestibulum pretium est sem, vitae convallis justo sollicitudin non. Morbi bibendum purus mattis quam condimentum, a scelerisque erat bibendum. Nullam sit amet bibendum lectus."
          },
          {
            "type": "TextSubheading",
            "text": "Privacy policy"
          },
          {
            "type": "TextBody",
            "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae odio dui. Praesent ut nulla tincidunt, scelerisque augue malesuada, volutpat lorem. Aliquam iaculis ex at diam posuere mollis. Suspendisse eget purus ac tellus interdum pharetra. In quis dolor turpis. Fusce in porttitor enim, vitae efficitur nunc. Fusce dapibus finibus volutpat. Fusce velit mi, ullamcorper ac gravida vitae, blandit quis ex. Fusce ultrices diam et justo blandit, quis consequat nisl euismod. Vestibulum pretium est sem, vitae convallis justo sollicitudin non. Morbi bibendum purus mattis quam condimentum, a scelerisque erat bibendum. Nullam sit amet bibendum lectus."
          }
        ]
      }
    }
  ]
}
Create new flow from a template
In the Flows section of WhatsApp Manager click on the Create Flow button in the top right corner.
In the Create page, fill in the details for the pre-approved loan Flow:
Name - Type Collect Purchase Intent, or choose another name you like.
Categories - Select Lead generation.
Template - Choose Collect purchase intent. You can further customize the template to suit your use case.
Click Create to create flow.
You can preview the Flow on the right of the Builder UI.

The Flow remains in the draft state as you edit it. You can share it with your team for testing purposes only. To share it with a large audience, you’ll need to publish it. However, you can’t edit the Flow once you publish.

See also

Flow JSON Overview
Testing and Debugging
Debug flow using the interactive preview
After you complete the configurations, toggle the interactive preview in the WhatsApp Builder UI to test the Flow.

Trigger the interactive preview by clicking on settings menu in the Preview section of the Flow Builder and enabling Interactive mode toggle.

In the modal that appears, select JOIN_NOW as the First Screen.

Now, click on Actions tab at the bottom of the code editor in Builder. You’ll see an navigate action in the list. Click on it to see the details of the action.

Return back to Preview and proceed to complete the first screen and then click on Continue button to navigate to next screen. Back in Actions tab notice the new navigate action logged and details contains data passed to next screen.

Keep testing out the Flow and observe the data changes in the Actions tab. Similar logs will be generated when users interact with the Flow from their mobile devices.

Send draft flow to your device
Before you publish your flow you can also send it and test it on an actual device. To send draft flow to your device, follow instructions here.

See also

Flow Testing and debugging guide
Publishing
When you first created your Flow, it entered the Draft state. And as you edited and saved the modified Flow JSON content, it remained in the Draft state. You are able to send the Flow while it's in the Draft state, but only for testing purposes. If you want to send the Flow to a larger audience, you'll need to Publish the Flow.

You can publish your Flow once you have ensured that:

All validation errors and publishing checks have been resolved.
The Flow meets the design principles of WhatsApp Flows
The Flow complies with WhatsApp Terms of Service, the WhatsApp Business Messaging Policy and, if applicable, the WhatsApp Commerce Policy
Remember, once a Flow has been published it can no longer be modified. See Flow Status Lifecycle for more information on the different Flow states.

To publish your Flow, open the three dot menu to the right of the Save button and click Publish. Once published, the Flow can be sent to anyone!

Sending
You can send your WhatsApp Flow as:

Template messages - these do not require a 24-hour customer service window to be open between you and the message recipient before the message can be sent.
Interactive Flow messages - these can only be sent to a user when a customer service window is open between you and the user.
Learn more about sending your Flow

Receiving flow response
Upon flow completion a response message will be sent to the WhatsApp chat. You will receive it in the same way as you receive all other messages from the user - via message webhook.

Learn more about how to setup messaging webhook

Monitoring
Flow monitoring is only applicable to Flows with endpoint.

Next Steps
Now that you have successfully completed this guide, learn more about what you can do with this Flows in our Guides and Reference sections.