import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  beforeSend(event) {
    if (event.message?.toLowerCase().includes("localstorage")) {
      return null;
    }
    return event;
  },
  environment: process.env.NODE_ENV,
});
