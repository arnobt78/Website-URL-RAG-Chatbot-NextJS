import { Redis } from "@upstash/redis";

/** Upstash Redis REST client — chat history, rate limits, indexed-urls dedup set. */
export const redis = Redis.fromEnv();
