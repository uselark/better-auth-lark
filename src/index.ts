import LarkClient from "lark-billing";
import type { BetterAuthPlugin } from "better-auth";

export interface LarkOptions {
  larkClient: LarkClient;
  createCustomerOnSignUp?: boolean | undefined;
  freePlanRateCardId?: string | undefined;
}

export const lark = <O extends LarkOptions>(options: O) => {
  const client = options.larkClient;

  return {
    id: "lark-billing-plugin",
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

                    if (!options.freePlanRateCardId) {
                      return;
                    }

                    await client.subscriptions.create({
                      subject_id: user.id,
                      rate_card_id: options.freePlanRateCardId,
                    });
                  } catch (error: any) {
                    const alreadyExistsError = error.message.includes(
                      `Subject with external ID ${user.id} already exists`
                    );
                    if (alreadyExistsError) {
                      return;
                    }
                    ctx.context.logger.error(
                      `Failed to create Lark customer: ${error.message}`,
                      error
                    );
                  }
                },
              },
              // Todo: support updating subject details on user update as well
            },
          },
        },
      };
    },
  } satisfies BetterAuthPlugin;
};
