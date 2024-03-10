import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock } from "jest-mock-extended";
import { StatusCodes } from "http-status-codes";

import { AxiosInterceptorManager, AxiosResponse } from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import { retryableAxios } from ".";
import type { Logger } from "@/lib/logger";

const { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR, TOO_MANY_REQUESTS } =
  StatusCodes;

function expect_toBeDefined<T>(arg: T): asserts arg is NonNullable<T> {
  expect(arg).toBeDefined();
}

const mockLogger = mock<Logger>();

describe("retryableAxios", () => {
  const axiosInstance = retryableAxios(mockLogger);
  const mockAxios = new AxiosMockAdapter(axiosInstance);

  beforeEach(() => {
    mockAxios.reset();
  });

  it("should create an axios instance", () => {
    expect(axiosInstance).toBeDefined();
  });

  it("sets the interceptors", () => {
    expect(
      (
        axiosInstance.interceptors.response as AxiosInterceptorManager<
          AxiosResponse<unknown, unknown>
        > & {
          handlers: unknown[];
        }
      ).handlers,
    ).toHaveLength(1);
  });

  it("should set User-Agent header", async () => {
    const expectedUserAgentSubstring = "coldoutsi.de (https://coldoutsi.de)";
    expect(axiosInstance.defaults.headers["User-Agent"]).toContain(
      expectedUserAgentSubstring,
    );

    // check the header is sent in the actual request
    mockAxios.onAny().replyOnce(OK, {});

    const resp = await axiosInstance.get("/");

    expect_toBeDefined(mockAxios.history["get"]);

    expect(resp.status).toBe(OK);
    expect(mockAxios.history["get"].length).toBe(1);

    const headers = mockAxios.history["get"][0]?.headers;
    expect(headers).toBeDefined();
    expect(headers?.["User-Agent"]).toContain(expectedUserAgentSubstring);
  });

  it("should retry on idempotent request error", async () => {
    mockAxios
      .onGet()
      .replyOnce(INTERNAL_SERVER_ERROR)
      .onGet()
      .replyOnce(INTERNAL_SERVER_ERROR)
      .onGet()
      .replyOnce(OK, {});

    const resp = await axiosInstance.get("https://foo.com/");
    expect(resp.data).toEqual({});

    expect_toBeDefined(mockAxios.history["get"]);

    expect(mockAxios.history["get"].length).toBe(3);
    expect(resp.status).toBe(OK);
  });

  it("should retry on network request error", async () => {
    mockAxios
      .onGet()
      .networkErrorOnce()
      .onGet()
      .networkErrorOnce()
      .onGet()
      .replyOnce(OK, {});

    const resp = await axiosInstance.get("https://foo.com/");
    expect(resp.data).toEqual({});

    expect_toBeDefined(mockAxios.history["get"]);

    expect(mockAxios.history["get"].length).toBe(3);
    expect(resp.status).toBe(OK);
  });

  it("does not retry on 429 error", async () => {
    mockAxios.onGet().replyOnce(TOO_MANY_REQUESTS);

    await expect(axiosInstance.get("https://foo.com/")).rejects.toHaveProperty(
      "isAxiosError",
    );
  });

  it("should not retry on non-network and non-idempotent request error", async () => {
    mockAxios.onGet().replyOnce(BAD_REQUEST);

    await expect(axiosInstance.get("https://foo.com/")).rejects.toHaveProperty(
      "isAxiosError",
    );
  });
});
