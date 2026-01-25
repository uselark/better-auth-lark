# Better Auth Lark Plugin

A [Lark billing](https://uselark.ai/) plugin for [Better Auth](https://www.better-auth.com/) that automatically creates customers and subscribes them to free plans on signup.

## Installation

```bash
npm i lark-billing
npm i @uselark/better-auth-lark
```

## Setup

To use the Better Auth Lark plugin, you need to simply initialized the lark client and configure the plugin with options.

```typescript
import LarkClient from "lark-billing";
import { lark } from "better-auth-lark";

const larkSdkClient = new LarkClient({
  apiKey: "YOUR_API_KEY_FROM_ENV_VARS",
});

const plugin = lark({
    larkClient: larkSdkClient,
    createCustomerOnSignUp: true,
    freePlanRateCardId: "FREE_PLAN_RATE_CARD_ID",
}),
```

## Options
- `larkSdkClient`: Initialize the Lark billing client with your private API key from env vars and pass it here.
- `createCustomerOnSignUp`: If false then the plugin doesn't do anything. If true then on customer sign up a [lark subject](https://docs.uselark.ai/api/resources/subjects/methods/create) will automatically be created with lark using their name, email, and external id being better auth `user.id`.
- `freePlanRateCardInfo`: You can optionally specify a rate card that you want all customers to get subscribed to on sign up. This rate card should have $0 fixed fees because otherwise users would have to go through a checkout flow to get subscribed and that isn't yet supported on signup. You'll need to pass in `freePlanRateCardId` and `fixedRateQuantities` as params to pass in to the [create subscription api](https://docs.uselark.ai/api/resources/subscriptions/methods/create). 

## Learn more?
Visit [docs.uselark.ai](https://docs.uselark.ai/) to learn more about lark billing integration. We provide frontend SDKs to fetch billing state and have simple APIs for subscription management. 