import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { headers } from "next/headers";
import { isAuthenticated } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const DEMO_RESPONSE =
  "This is a demo response. The AI service is temporarily unavailable. " +
  "Please try again later for a full analysis.";

const SYSTEM_PROMPT = `You are Gyaan Vriksh (ज्ञान वृक्ष), a knowledge tree that helps users explore and understand topics deeply. You provide clear, structured, and insightful analysis. You break down complex topics into understandable parts and draw connections between ideas.`;

export async function POST(request: Request) {
  // Defense-in-depth auth check (CVE-2025-29927 mitigation)
  const authed = await isAuthenticated();
  if (!authed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // IP-based rate limit: 20 requests per day
  const headersList = await headers();
  const clientIp = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const dailyKey = `analyze:${clientIp}:${new Date().toISOString().slice(0, 10)}`;
  const { success } = rateLimit(dailyKey, 20, 86_400_000);
  if (!success) {
    return Response.json(
      { error: "Daily limit reached. Please try again tomorrow." },
      { status: 429 }
    );
  }

  const { prompt } = (await request.json()) as { prompt: string };

  if (!prompt || typeof prompt !== "string") {
    return Response.json(
      { error: "Prompt is required." },
      { status: 400 }
    );
  }

  try {
    const result = streamText({
      model: anthropic("claude-4-6-sonnet-20260217"),
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
          providerOptions: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        { role: "user", content: prompt },
      ],
      maxRetries: 3,
      abortSignal: request.signal,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;

    // 429 (rate limit) or 529 (overloaded) — already retried by SDK
    if (status === 429 || status === 529) {
      return Response.json(
        { error: "AI service is busy. Please try again in a few minutes." },
        { status: 503 }
      );
    }

    // Graceful degradation: return demo data
    console.error("Analyze API error:", error);
    return new Response(DEMO_RESPONSE, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
