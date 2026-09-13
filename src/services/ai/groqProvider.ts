// ==============================================
// SaveByte — Groq AI Provider (Zero-Cost Inference)
// ==============================================
//
// Primary zero-cost AI provider for the SIH demonstration.
// Uses Groq's high-speed API with model: openai/gpt-oss-120b (or configurable GROQ_MODEL).
//
// Security & Architecture:
// 1. Reads GROQ_API_KEY strictly server-side (never exposed to client, never logged)
// 2. Compact, sanitized operational summaries (no PII, credentials, or tokens)
// 3. Short 8-second timeout with AbortController
// 4. Strict Zod schema validation for structured analysis
// 5. Automatic, graceful fallback to DeterministicFallbackProvider on missing key, timeout, or malformed JSON
//

import { z } from 'zod';
import { AIProvider, AIProviderResponse, DeterministicFallbackProvider } from './aiProvider';

export class GroqProvider implements AIProvider {
  readonly name = 'groq';
  private readonly apiKey: string | null;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fallbackProvider: DeterministicFallbackProvider;

  constructor(options?: { model?: string; timeoutMs?: number }) {
    this.apiKey = process.env.GROQ_API_KEY || null;
    this.model = options?.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    this.timeoutMs = options?.timeoutMs || 8000;
    this.fallbackProvider = new DeterministicFallbackProvider();
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Generates a structured analysis using Groq's OpenAI-compatible chat completions API.
   * Validates response against Zod schema, falling back to deterministic baseline on error.
   */
  async generateStructuredAnalysis<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    fallbackData: T
  ): Promise<AIProviderResponse<T>> {
    if (!this.isConfigured()) {
      return {
        data: fallbackData,
        provider: 'deterministic_baseline',
        model: 'analytical-heuristics-v1',
        fallbackUsed: true,
        error: 'GROQ_API_KEY is not configured',
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}\nIMPORTANT: Reply ONLY with a valid, raw JSON object matching the requested schema. Do NOT include markdown code blocks, backticks, or preamble.`,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 1500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        console.warn(`[GroqProvider] API error (${response.status}): ${errText}`);
        return {
          data: fallbackData,
          provider: 'deterministic_baseline',
          model: this.model,
          fallbackUsed: true,
          error: `Groq API returned status ${response.status}`,
        };
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;

      if (!content) {
        return {
          data: fallbackData,
          provider: 'deterministic_baseline',
          model: this.model,
          fallbackUsed: true,
          error: 'Groq returned empty response content',
        };
      }

      // Parse JSON
      let parsedRaw: unknown;
      try {
        parsedRaw = JSON.parse(content);
      } catch (parseError) {
        console.warn('[GroqProvider] Failed to parse JSON:', parseError);
        return {
          data: fallbackData,
          provider: 'deterministic_baseline',
          model: this.model,
          fallbackUsed: true,
          error: 'Invalid JSON returned by Groq',
        };
      }

      // Validate with Zod
      const validation = schema.safeParse(parsedRaw);
      if (!validation.success) {
        console.warn('[GroqProvider] Schema validation failed:', validation.error.message);
        return {
          data: fallbackData,
          provider: 'deterministic_baseline',
          model: this.model,
          fallbackUsed: true,
          error: `Schema validation failed: ${validation.error.message}`,
        };
      }

      return {
        data: validation.data,
        provider: 'groq',
        model: this.model,
        fallbackUsed: false,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[GroqProvider] Execution failed, falling back to deterministic baseline: ${message}`);
      return {
        data: fallbackData,
        provider: 'deterministic_baseline',
        model: this.model,
        fallbackUsed: true,
        error: message,
      };
    }
  }

  /**
   * Generates a concise natural language explanation from Groq.
   */
  async generateExplanation(
    systemPrompt: string,
    userPrompt: string,
    fallbackExplanation: string
  ): Promise<string> {
    if (!this.isConfigured()) {
      return fallbackExplanation;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 400,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return fallbackExplanation;
      }

      const json = await response.json();
      const text = json.choices?.[0]?.message?.content?.trim();
      return text || fallbackExplanation;
    } catch {
      clearTimeout(timer);
      return fallbackExplanation;
    }
  }

  /**
   * Generates conversational response for AI Copilot chat.
   */
  async generateCopilotResponse(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    fallbackResponse: string
  ): Promise<{ text: string; provider: 'groq' | 'deterministic_baseline'; fallbackUsed: boolean }> {
    if (!this.isConfigured()) {
      return {
        text: fallbackResponse,
        provider: 'deterministic_baseline',
        fallbackUsed: true,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-8), // Keep recent conversation window
          ],
          temperature: 0.4,
          max_tokens: 600,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          text: fallbackResponse,
          provider: 'deterministic_baseline',
          fallbackUsed: true,
        };
      }

      const json = await response.json();
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) {
        return {
          text: fallbackResponse,
          provider: 'deterministic_baseline',
          fallbackUsed: true,
        };
      }

      return {
        text,
        provider: 'groq',
        fallbackUsed: false,
      };
    } catch {
      clearTimeout(timer);
      return {
        text: fallbackResponse,
        provider: 'deterministic_baseline',
        fallbackUsed: true,
      };
    }
  }
}
