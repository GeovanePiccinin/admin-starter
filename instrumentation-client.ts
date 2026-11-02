import * as Sentry from "@sentry/nextjs";

import { initializeSentry } from "./src/lib/observability/sentry";

initializeSentry();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
