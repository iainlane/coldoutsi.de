import { beforeEach, describe, expect, it } from "@jest/globals";
import { mock } from "jest-mock-extended";

import { AxiosInterceptorManager, AxiosResponse } from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import { retryableAxios } from ".";
import type { Logger } from "@/lib/logger";

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
    mockAxios.onAny().replyOnce(200, {});

    const resp = await axiosInstance.get("/");

    expect_toBeDefined(mockAxios.history["get"]);

    expect(resp.status).toBe(200);
    expect(mockAxios.history["get"].length).toBe(1);

    const headers = mockAxios.history["get"][0]?.headers;
    expect(headers).toBeDefined();
    expect(headers?.["User-Agent"]).toContain(expectedUserAgentSubstring);
  });

  it("should retry on idempotent request error", async () => {
    mockAxios
      .onGet()
      .replyOnce(500)
      .onGet()
      .replyOnce(500)
      .onGet()
      .replyOnce(200, {});

    const resp = await axiosInstance.get("https://foo.com/");
    expect(resp.data).toEqual({});

    expect_toBeDefined(mockAxios.history["get"]);

    expect(mockAxios.history["get"].length).toBe(3);
    expect(resp.status).toBe(200);
  });

  it("should retry on network request error", async () => {
    mockAxios
      .onGet()
      .networkErrorOnce()
      .onGet()
      .networkErrorOnce()
      .onGet()
      .replyOnce(200, {});

    const resp = await axiosInstance.get("https://foo.com/");
    expect(resp.data).toEqual({});

    expect_toBeDefined(mockAxios.history["get"]);

    expect(mockAxios.history["get"].length).toBe(3);
    expect(resp.status).toBe(200);
  });

  it("does not retry on 429 error", async () => {
    mockAxios.onGet().replyOnce(429);

    await expect(axiosInstance.get("https://foo.com/")).rejects.toHaveProperty(
      "isAxiosError",
    );
  });

  it("should not retry on non-network and non-idempotent request error", async () => {
    mockAxios.onGet().replyOnce(400);

    await expect(axiosInstance.get("https://foo.com/")).rejects.toHaveProperty(
      "isAxiosError",
    );
  });
});
