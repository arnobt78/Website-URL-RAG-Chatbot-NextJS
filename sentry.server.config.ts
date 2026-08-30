import * as Sentry from "@sentry/nextjs";
import {
  getServerSentryDsn,
  getTracesSampleRate,
} from "./src/lib/sentry-env";
import { SENTRY_IGNORE_ERRORS, sentryBeforeSend } from "./src/lib/sentry-filters";

const dsn = getServerSentryDsn();

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: getTracesSampleRate(),
  environment: process.env.NODE_ENV || "development",
  debug: false,
  ignoreErrors: SENTRY_IGNORE_ERRORS,
  beforeSend: sentryBeforeSend,
});
