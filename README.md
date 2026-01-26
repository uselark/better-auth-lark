# Better Auth Lark Plugin

A [Lark billing](https://uselark.ai/) plugin for [Better Auth](https://www.better-auth.com/) that automatically creates customers and subscribes them to free plans on signup.

## Installation

```bash
npm i lark-billing
npm i @uselark/better-auth-lark
```

## Core plugin

### Setup
To use the Better Auth Lark plugin, you need to simply initialized the lark client and configure the plugin with options.

```typescript
import { betterAuth } from "better-auth";
import LarkClient from "lark-billing";
import { lark } from "better-auth-lark";

const larkSdkClient = new LarkClient({
  apiKey: "YOUR_API_KEY_FROM_ENV_VARS",
});

const larkPlugin = lark({
    larkClient: larkSdkClient,
    createCustomerOnSignUp: true,
    freePlanRateCardId: "FREE_PLAN_RATE_CARD_ID",
});

export const auth = betterAuth({
  plugins: [larkPlugin],
});
```

### Configuration options
- `larkSdkClient`: Initialize the Lark billing client with your private API key from env vars and pass it here.
- `createCustomerOnSignUp`: If true then on customer sign up a [lark subject](https://docs.uselark.ai/api/resources/subjects/methods/create) will automatically be created with lark using their name, email, and external id being better auth `user.id`.
- `freePlanRateCardInfo`: You can optionally specify a rate card that you want all customers to get subscribed to on sign up. This rate card should have $0 fixed fees because otherwise users would have to go through a checkout flow to get subscribed and that isn't yet supported on signup. You'll need to pass in `freePlanRateCardId` and `fixedRateQuantities` as params to pass in to the [create subscription api](https://docs.uselark.ai/api/resources/subscriptions/methods/create). 


## Client plugin
You can also use the lark client plugin to easily handle subscription cancellations, upgrades, etc. 

### Setup
```typescript
import { createAuthClient } from "better-auth/react";
import { larkClient } from "@uselark/better-auth-lark";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [larkClient()],
});
```

### Usage

#### Subscribe to a plan
If you haven't configured the lark plugin to automatically subscribe new users to a free plan on sign by setting `freePlanRateCardInfo`, then you can subscribe them to a plan on demand. 

```typescript
const { data, error } =  authClient.larkBillingPlugin..createSubscription({
  rate_card_id: plan.rateCardId,
  fixed_rate_quantities: { "rate_quantity_code": 1 },
  checkout_callback_urls: {
    cancelled_url: currentUrl,
    success_url: currentUrl,
  },
}); 

if (error) {
  alert(error.message)
}

if (data?.result?.result_type === "requires_action" && data.result.action?.checkout_url) {
  // Redirect to checkout
  window.location.href = data.result.action.checkout_url;
  return;
} else if (data?.result?.result_type === "success") {
  alert("Successfully subscribed customer")
}
```

#### Upgrade plan
If a customer is already subscribed to a plan, you can change the rate card they are subscribed to facilitate upgrades. If a payment method doesn't exist on file for customer, then the customer will be redirect to a checkout to confirm the upgrade. 


```typescript
const { data, error } = await larkBillingPlugin.changeRateCard({
  subscription_id: subscriptionId,
  rate_card_id: plan.rateCardId,
  cancelled_url: currentUrl,
  success_url: currentUrl,
});

if (error) {
  alert(error.message)
}

if (data?.result?.result_type === "requires_action" && data.result.action?.checkout_url) {
  // Redirect to checkout
  window.location.href = data.result.action.checkout_url;
  return;
} else if (data?.result?.result_type === "success") {
  alert("Successfully subscribed customer")
}
```

#### Get billing state
To check entitlements for a customer you can fetch the billing state for them at any point. 

```typescript
const { data, error } = await larkBillingPlugin.getBillingState();

if (error) {
  alert(error.message)
}
const active_subscriptions = {data}
```

#### Cancel a subscription
You can suppot subscription cancellation with a single line in your app. 

```typescript
const { data, error } = await larkBillingPlugin.cancelSubscription({
  subscription_id: subscriptionId,
  reason: "User requested cancellation",
});

if (error) {
  alert(error.message)
}

alert("Subscription cancelled successfully")
```

#### Redirect to billing portal
You can also redirect a customer to the [lark customer portal](https://docs.uselark.ai/api/resources/customer_portal/methods/create_session) where they can view their upcoming bill, past invoices, etc. 

```typescript
const { data, error } = await larkBillingPlugin.createCustomerPortalSession({
  return_url: currentUrl,
});

if (error) {
  alert(error.message)
}

// Redirect to portal
window.location.href = data.url;
```


#### List recent invoices
If you want to show the customer their past few invoices, you can fetch them with a single command.

```typescript
const { data, error } = await larkBillingPlugin.listRecentInvoices({
  return_url: currentUrl,
});

if (error) {
  alert(error.message)
}

const {invoices} = data
```

## Learn more?
Visit [docs.uselark.ai](https://docs.uselark.ai/) to learn more about lark billing integration. We provide frontend SDKs to fetch billing state and have simple APIs for subscription management. 