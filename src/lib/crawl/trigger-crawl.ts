import "server-only";

import { getAppBaseUrl, getQstashBaseUrl, isWorkflowConfigured } from "@/lib/crawl/config";
import { Client } from "@upstash/workflow";

export type CrawlWorkflowPayload = {
  siteRootKey: string;
  siteOriginUrl: string;
  namespace: string;
  runId: string;
};

export async function triggerCrawlWorkflow(payload: CrawlWorkflowPayload): Promise<boolean> {
  if (!isWorkflowConfigured()) {
    return false;
  }

  const token = process.env.QSTASH_TOKEN!.trim();
  const qstashBaseUrl = getQstashBaseUrl();
  const appBaseUrl = getAppBaseUrl();
  const client = new Client({
    token,
    ...(qstashBaseUrl ? { baseUrl: qstashBaseUrl } : {}),
  });

  await client.trigger({
    url: `${appBaseUrl}/api/crawl/workflow`,
    body: payload,
  });

  return true;
}
