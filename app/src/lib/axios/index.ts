import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

import type { Logger } from "@/lib/logger";

// A wrapper around axios which adds retrying on recoverable errors
export function retryableAxios(logger: Logger): AxiosInstance {
  const userAgent =
    "coldoutsi.de (https://coldoutsi.de) - https://github.com/iainlane/coldoutsi.de";
  const headers = { "User-Agent": userAgent };

  const axiosInstance = axios.create({
    headers: headers,
  });

  axiosInstance.interceptors.request.use((request) => {
    const { method, url } = request;
    logger.debug("Request", { method, url });

    return request;
  });

  axiosRetry(axiosInstance, {
    retries: 3,
    retryCondition: (error) => {
      return axiosRetry.isNetworkOrIdempotentRequestError(error);
    },
    retryDelay: (retryCount, error) =>
      axiosRetry.exponentialDelay(retryCount, error),
  });

  return axiosInstance;
}
