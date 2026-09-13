// ==============================================
// SaveByte — AI Provider Abstraction Layer (Phase 5)
// ==============================================
//
// Single clean boundary for AI and LLM operations.
// Enforces:
// 1. Sanitized, aggregated operational data only (NO PII, tokens, passwords, phone numbers)
// 2. Strict Zod schema validation for structured outputs
// 3. Graceful deterministic fallback on timeout, rate limit, invalid JSON, or missing API key
// 4. No direct hard-coded OpenAI calls scattered across application components
//

import { z } from 'zod';
import { GroqProvider } from './groqProvider';

export interface AIProviderResponse<T> {
  data: T;
  provider: 'groq' | 'openai' | 'deterministic_baseline';
  model: string;
  fallbackUsed: boolean;
  error?: string;
}

export interface AIProvider {
  readonly name: string;

  /**
   * Generates a structured JSON analysis validated against a Zod schema.
   * Falls back cleanly if provider fails or schema validation fails.
   */
  generateStructuredAnalysis<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    fallbackData: T
  ): Promise<AIProviderResponse<T>>;

  /**
   * Generates an operational natural language explanation.
   */
  generateExplanation(
    systemPrompt: string,
    userPrompt: string,
    fallbackExplanation: string
  ): Promise<string>;
}

/**
 * Deterministic Baseline Provider.
 * Requires zero external API keys and guarantees instantaneous, reliable responses.
 */
export class DeterministicFallbackProvider implements AIProvider {
  readonly name = 'deterministic_baseline';

  async generateStructuredAnalysis<T>(
    _systemPrompt: string,
    _userPrompt: string,
    _schema: z.ZodType<T>,
    fallbackData: T
  ): Promise<AIProviderResponse<T>> {
    return {
      data: fallbackData,
      provider: 'deterministic_baseline',
      model: 'analytical-heuristics-v1',
      fallbackUsed: true,
    };
  }

  async generateExplanation(
    _systemPrompt: string,
    _userPrompt: string,
    fallbackExplanation: string
  ): Promise<string> {
    return fallbackExplanation;
  }
}

/**
 * OpenAI Provider implementation using native fetch.
 * Protects application from timeouts, network partitions, and schema mismatches.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private apiKey: string;
  private model: string;
  private timeoutMs: number;

  constructor(options?: { apiKey?: string; model?: string; timeoutMs?: number }) {
    this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY || '';
    this.model = options?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.timeoutMs = options?.timeoutMs || 8000; // 8 second timeout
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

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
        error: 'OPENAI_API_KEY is not configured',
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `${systemPrompt}\nIMPORTANT: You must reply ONLY with a valid, raw JSON object matching the requested schema. No markdown formatting, no backticks, no markdown codeblocks.`,
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
        console.warn(`[AIProvider] OpenAI API error (${response.status}): ${errText}`);
        return {
          data: fallbackData,
          provider: 'deterministic_baseline',
          model: this.model,
          fallbackUsed: true,
          error: `API returned status ${response.status}`,
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
          error: 'Empty response choices from OpenAI',
        };
      }

      // Safe JSON parsing
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(content);
      } catch (parseErr: any) {
        console.warn('[AIProvider] Failed to parse response content as JSON:', parseErr.message);
        return {
          data: fallbackData,
          provider: 'deterministic_baseline',
          model: this.model,
          fallbackUsed: true,
          error: 'Malformed JSON from AI model',
        };
      }

      // Strict Zod Validation
      const validationResult = schema.safeParse(parsedJson);
      if (!validationResult.success) {
        console.warn('[AIProvider] Schema validation failed:', validationResult.error.format());
        return {
          data: fallbackData,
          provider: 'deterministic_baseline',
          model: this.model,
          fallbackUsed: true,
          error: 'AI response failed schema validation',
        };
      }

      return {
        data: validationResult.data,
        provider: 'openai',
        model: this.model,
        fallbackUsed: false,
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError';
      const errorMsg = isAbort ? `OpenAI request timed out after ${this.timeoutMs}ms` : err.message;
      console.warn(`[AIProvider] Execution failed, falling back to deterministic baseline: ${errorMsg}`);

      return {
        data: fallbackData,
        provider: 'deterministic_baseline',
        model: this.model,
        fallbackUsed: true,
        error: errorMsg,
      };
    }
  }

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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          max_tokens: 300,
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
}

/**
 * Returns the active AI provider based on environment configuration.
 * Prioritizes zero-cost Groq (openai/gpt-oss-120b), then OpenAI, then deterministic fallback.
 */
export function getAIProvider(): AIProvider {
  const groq = new GroqProvider();
  if (groq.isConfigured()) {
    return groq;
  }
  const openAI = new OpenAIProvider();
  if (openAI.isConfigured()) {
    return openAI;
  }
  return new DeterministicFallbackProvider();
}
