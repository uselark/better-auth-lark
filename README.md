# Better Auth Lark Plugin

A [Lark billing](https://uselark.ai/) plugin for [Better Auth](https://www.better-auth.com/) that automatically creates customers and subscribes them to free plans on signup.

## Installation

```bash
npm install lark-billing
npm install better-auth-lark
```

## Setup

To use the Better Auth Lark plugin, you need to simply initialized the lark client and configure the plugin with options.

```typescript
import LarkClient from "lark-billing";
import { lark } from "better-auth-lark";

const lark_client = new LarkClient({
  apiKey: "YOUR_API_KEY_FROM_ENV_VARS",
});

const plugin = lark({
    larkClient: lark_client,
    createCustomerOnSignUp: true,
    freePlanRateCardId: "FREE_PLAN_RATE_CARD_ID",
}),
```

## Options
- `larkClient`: Initialize the Lark billing client with your private API key from env vars and pass it here.
- `createCustomerOnSignUp`: If false then the plugin doesn't do anything. If true then on customer sign up a [lark subject](https://docs.uselark.ai/api/resources/subjects/methods/create) will automatically be created with lark using their name, email, and external id being better auth `user.id`.
- `freePlanRateCardId`: You can optionally specify a rate card that you want all customers to get subscribed to on sign up. This rate card should have $0 fixed fees because otherwise users would have to go through a checkout flow to get subscribed and that isn't yet supported. 
