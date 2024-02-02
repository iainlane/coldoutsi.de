import { Logger } from "@aws-lambda-powertools/logger";
import { MiddlewareObj } from "@middy/core";
import type { Context } from "aws-lambda";

export interface LoggerContext extends Context {
  logger: Logger;
}

const logLevel = process.env["NODE_ENV"] === "production" ? "info" : "debug";

export function loggerMiddleware<TEvent, TResult>(): MiddlewareObj<
  TEvent,
  TResult,
  Error,
  LoggerContext
> {
  return {
    before: ({ context }) => {
      const logger = new Logger({ logLevel, serviceName: "weather" });

      logger.addContext(context);

      context.logger = logger;
    },
  };
}

export { Logger };
