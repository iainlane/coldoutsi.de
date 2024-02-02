import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const isLocal = process.env["STAGE"] === "local";

export const dynamoDbDocClient = DynamoDBDocument.from(
  new DynamoDBClient(
    isLocal
      ? {
          endpoint: "http://localhost:8000",
          region: "localhost",
          credentials: {
            accessKeyId: "MockAccessKeyId",
            secretAccessKey: "MockSecretAccessKey",
          },
        }
      : {},
  ),
  {
    marshallOptions: {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    },
  },
);
