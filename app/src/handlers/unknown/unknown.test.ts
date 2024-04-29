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
import { StatusCodes } from "http-status-codes";

import { LoggerContext } from "@/lib/logger";
import { GeoLocateContext } from "@/lib/geolocate";
import { unknownHandler } from ".";

const { OK, TEMPORARY_REDIRECT } = StatusCodes;

const mockAxios = new AxiosMockAdapter(axios);

const ddbMock = mockClient(DynamoDBDocumentClient);
ddbMock.on(GetCommand).resolves({});
ddbMock.on(PutCommand).resolves({});

describe("unknown handler", () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it.each<{ prefix: string; expected: string }>([
    {
      prefix: "",
      expected: "/",
    },
    {
      prefix: "/",
      expected: "/",
    },
    {
      prefix: "/:unknown",
      expected: "/",
    },
    {
      prefix: "/metno/:unknown",
      expected: "/metno/",
    },
  ])(
    "redirects to the correct location ($prefix)",
    async ({ prefix, expected }) => {
      mockAxios.onGet().reply(OK, [
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
      mockEvent.rawPath = prefix;

      const mockContext = mock<LoggerContext & GeoLocateContext>();

      await expect(unknownHandler(mockEvent, mockContext)).resolves.toEqual({
        statusCode: TEMPORARY_REDIRECT,
        headers: expect.objectContaining({
          location: `${expected}51.1/-96.1`,
        }),
      });
    },
  );
});
