import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock } from "jest-mock-extended";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Event } from "@middy/http-header-normalizer";

import { unknownHandler } from "./unknown";
import { LoggerContext } from "@/lib/logger";
import { GeoLocateContext } from "@/lib/geolocate";

const mockAxios = new AxiosMockAdapter(axios);

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(GetCommand).resolves({});
ddbMock.on(PutCommand).resolves({});

describe("unknown handler", () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it("redirects to the correct location", async () => {
    mockAxios.onGet().reply(200, [
      {
        ip: "1.1.1.1",
        latitude: "51.1",
        longitude: "-96.1",
        city: "Sample City",
      },
    ]);

    const mockEvent = mock<APIGatewayProxyEventV2 & Event>({
      requestContext: {
        http: {
          sourceIp: "1.1.1.1",
        },
      },
    });

    const mockContext = mock<LoggerContext & GeoLocateContext>();

    await expect(unknownHandler(mockEvent, mockContext)).resolves.toEqual({
      statusCode: 307,
      headers: expect.objectContaining({
        location: `/51.1/-96.1`,
      }),
    });
  });
});
