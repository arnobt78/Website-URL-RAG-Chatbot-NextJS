export type ChatErrorToast = {
  title: string;
  subtitle: string;
};

type ErrorPayload = {
  title?: string;
  subtitle?: string;
  error?: string;
  code?: number;
};

export function mapChatHttpError(status: number, body?: ErrorPayload | string): ChatErrorToast {
  const parsed =
    typeof body === "string"
      ? { error: body }
      : body ?? {};

  const title = parsed.title ?? defaultTitle(status);
  const subtitle =
    parsed.subtitle ?? parsed.error ?? defaultSubtitle(status);

  return { title, subtitle };
}

function defaultTitle(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request";
    case 401:
      return "Authentication failed";
    case 402:
      return "Provider quota exhausted";
    case 403:
      return "Access denied";
    case 404:
      return "Not found";
    case 429:
      return "Too many requests";
    case 500:
      return "Server error";
    case 502:
      return "AI providers unavailable";
    case 503:
      return "Service unavailable";
    default:
      return "Something went wrong";
  }
}

function defaultSubtitle(status: number): string {
  switch (status) {
    case 400:
      return "Your message could not be processed. Try shortening it.";
    case 401:
      return "The AI provider rejected the API key. Check your environment configuration.";
    case 402:
      return "A provider free tier may be exhausted. Try again later.";
    case 403:
      return "This request is not allowed for your session or URL.";
    case 404:
      return "The requested model or endpoint was not found.";
    case 429:
      return "You are sending messages too quickly. Please wait and retry.";
    case 500:
      return "An unexpected server error occurred. Please try again.";
    case 502:
      return "All configured AI providers failed. Verify API keys and quotas.";
    case 503:
      return "The chat service is temporarily unavailable.";
    default:
      return `Request failed with status ${status}. Please try again.`;
  }
}

export async function parseChatErrorResponse(res: Response): Promise<ChatErrorToast> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const json = (await res.json()) as ErrorPayload;
      return mapChatHttpError(res.status, json);
    } catch {
      return mapChatHttpError(res.status);
    }
  }

  try {
    const text = await res.text();
    return mapChatHttpError(res.status, text || undefined);
  } catch {
    return mapChatHttpError(res.status);
  }
}
