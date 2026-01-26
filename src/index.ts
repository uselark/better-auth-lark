import LarkClient from "lark-billing";
import type { BetterAuthPlugin } from "better-auth";
import type { BetterAuthClientPlugin } from "better-auth/client";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";

const LARK_BILLING_PLUGIN_ID = "lark-billing-plugin";

export interface LarkOptions {
  larkSdkClient: LarkClient;
  createCustomerOnSignUp?: boolean | undefined;
  freePlanRateCardInfo?:
    | {
        freePlanRateCardId: string;
        fixedRateQuantities: {
          [key: string]: number;
        };
      }
    | undefined;
}

export const lark = <O extends LarkOptions>(options: O) => {
  const client = options.larkSdkClient;

  return {
    id: LARK_BILLING_PLUGIN_ID,
    init(_) {
      return {
        options: {
          databaseHooks: {
            user: {
              create: {
                async after(user, ctx) {
                  if (!ctx || !options.createCustomerOnSignUp) return;

                  try {
                    // if subject already exists this will fail and we'll simply no op in catch block
                    await client.subjects.create({
                      external_id: user.id,
                      email: user.email,
                      name: user.name,
                    });

                    if (!options.freePlanRateCardInfo) {
                      return;
                    }

                    const freePlanRateCardInfo = options.freePlanRateCardInfo;

                    await client.subscriptions.create({
                      subject_id: user.id,
                      rate_card_id: freePlanRateCardInfo.freePlanRateCardId,
                      fixed_rate_quantities:
                        freePlanRateCardInfo.fixedRateQuantities,
                    });
                  } catch (error: any) {
                    const alreadyExistsError = error.message.includes(
                      `Subject with external ID ${user.id} already exists`,
                    );
                    if (alreadyExistsError) {
                      return;
                    }
                    ctx.context.logger.error(
                      `Failed to create Lark customer: ${error.message}`,
                      error,
                    );
                  }
                },
              },
              update: {
                async after(user, ctx) {
                  if (!ctx || !options.createCustomerOnSignUp) return;

                  try {
                    await client.subjects.update(user.id, {
                      email: user.email,
                      name: user.name,
                      metadata: {},
                    });
                  } catch (e: any) {
                    ctx.context.logger.error(
                      `Failed to update Lark customer: ${e.message}`,
                      e,
                    );
                  }
                },
              },
            },
          },
        },
      };
    },
    endpoints: {
      createSubscription: createAuthEndpoint(
        "/lark-billing-plugin/create-subscription",
        {
          method: "POST",
          body: z.object({
            rate_card_id: z.string(),
            fixed_rate_quantities: z.record(z.string(), z.number()),
            checkout_callback_urls: z
              .object({
                cancelled_url: z.string(),
                success_url: z.string(),
              })
              .optional(),
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const {
            rate_card_id,
            fixed_rate_quantities,
            checkout_callback_urls,
          } = ctx.body;

          const result = await client.subscriptions.create({
            subject_id: ctx.context.session.user.id,
            rate_card_id,
            fixed_rate_quantities,
            ...(checkout_callback_urls && { checkout_callback_urls }),
          });

          return ctx.json(result);
        },
      ),
      createCustomerPortalSession: createAuthEndpoint(
        "/lark-billing-plugin/create-customer-portal-session",
        {
          method: "POST",
          body: z.object({
            return_url: z.string(),
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const { return_url } = ctx.body;

          const result = await client.customerPortal.createSession({
            subject_id: ctx.context.session.user.id,
            return_url,
          });

          return ctx.json(result);
        },
      ),
      changeRateCard: createAuthEndpoint(
        "/lark-billing-plugin/change-rate-card",
        {
          method: "POST",
          body: z.object({
            subscription_id: z.string(),
            rate_card_id: z.string(),
            cancelled_url: z.string(),
            success_url: z.string(),
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const { subscription_id, rate_card_id, cancelled_url, success_url } =
            ctx.body;

          const result = await client.subscriptions.changeRateCard(
            subscription_id,
            {
              rate_card_id,
              checkout_callback_urls: {
                cancelled_url,
                success_url,
              },
            },
          );

          return ctx.json(result);
        },
      ),
      getBillingState: createAuthEndpoint(
        "/lark-billing-plugin/get-billing-state",
        {
          method: "GET",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const result = await client.customerAccess.retrieveBillingState(
            ctx.context.session.user.id,
          );

          return ctx.json(result);
        },
      ),
      cancelSubscription: createAuthEndpoint(
        "/lark-billing-plugin/cancel-subscription",
        {
          method: "POST",
          body: z.object({
            subscription_id: z.string(),
            reason: z.string().optional().nullable(),
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const { subscription_id, reason } = ctx.body;

          const result = await client.subscriptions.cancel(subscription_id, {
            cancel_at_end_of_cycle: true as const,
            reason: reason ?? null,
          });

          return ctx.json(result);
        },
      ),
      listRecentInvoices: createAuthEndpoint(
        "/lark-billing-plugin/list-recent-invoices",
        {
          method: "GET",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const result = await client.invoices.list({
            subject_id: ctx.context.session.user.id,
          });

          return ctx.json(result);
        },
      ),
    },
  } satisfies BetterAuthPlugin;
};

export const larkClient = () => {
  return {
    id: LARK_BILLING_PLUGIN_ID,
    $InferServerPlugin: {} as ReturnType<typeof lark>,
  } satisfies BetterAuthClientPlugin;
};
