import { httpBatchLink, loggerLink } from "@trpc/client";
import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/server/routers";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const getTRPCClient = () => {
  return {
    links: [
      loggerLink({
        enabled: (opts) => process.env.NODE_ENV === "development" || (opts.direction === "down" && opts.result instanceof Error),
      }),
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  };
};
