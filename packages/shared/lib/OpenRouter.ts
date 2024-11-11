import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatModel } from 'openai/resources/chat';

export function openRouterLanguageModel(
  openRouterOptions: OpenRouterLanguageModelCreateOptions,
): AILanguageModelFactory {
  return {
    create: async (options?: AILanguageModelCreateOptions) => {
      return new OpenRouterLanguageModel({ ...openRouterOptions, ...options });
    },
    capabilities: async () => {
      return {
        available: 'readily',
        languageAvailable: languageTag => 'readily',
        defaultTopK: null,
        maxTopK: null,
        defaultTemperature: 1,
        maxTemperature: 2,
      };
    },
  };
}

type OpenRouterLanguageModelCreateOptions = {
  model: (string & {}) | ChatModel;
  apiKey: string;
};

class OpenRouterLanguageModel extends EventTarget implements AILanguageModel {
  private openai: OpenAI;
  private model: string;
  private _temperature: number;
  private _topK: number;
  private _tokensSoFar: number = 0;
  private messages: ChatCompletionMessageParam[] = [];
  private systemPrompt?: string;

  constructor(options: AILanguageModelCreateOptions & OpenRouterLanguageModelCreateOptions) {
    super();
    this.model = options.model;
    this._temperature = options.temperature ?? 1;
    this._topK = options.topK ?? 1;
    this.systemPrompt = options.systemPrompt;

    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: options.apiKey,
      dangerouslyAllowBrowser: true,
      // defaultHeaders: {
      //   "HTTP-Referer": $YOUR_SITE_URL, // Optional, for including your app on openrouter.ai rankings.
      //   "X-Title": $YOUR_SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
      // }
    });

    if (this.systemPrompt) {
      this.messages.push({
        role: 'system',
        content: this.systemPrompt,
      });
    }

    if (options.initialPrompts?.length) {
      this.messages.push(
        ...options.initialPrompts.map(p => ({
          role: p.role,
          content: p.content,
        })),
      );
    }
  }

  async prompt(input: AILanguageModelPromptInput, options?: AILanguageModelPromptOptions): Promise<string> {
    const newMessages = this.formatMessages(input);
    this.messages.push(...newMessages);

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: this.messages,
      temperature: this._temperature,
    });

    const responseMessage = completion.choices[0].message;
    if (responseMessage) {
      this.messages.push(responseMessage);
    }

    return responseMessage?.content ?? '';
  }

  promptStreaming(input: AILanguageModelPromptInput, options?: AILanguageModelPromptOptions): ReadableStream {
    const newMessages = this.formatMessages(input);
    this.messages.push(...newMessages);

    const stream = this.openai.chat.completions.create({
      model: this.model,
      messages: this.messages,
      temperature: this._temperature,
      stream: true,
    });

    let responseMessage = '';

    const messages = this.messages;

    return new ReadableStream<string>({
      async start(controller) {
        for await (const chunk of await stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            responseMessage += content;
            controller.enqueue(responseMessage);
          }
        }
        messages.push({
          role: 'assistant',
          content: responseMessage,
        });
        controller.close();
      },
    });
  }

  async countPromptTokens(input: AILanguageModelPromptInput): Promise<number> {
    // Rough estimate - would need proper tokenizer for accuracy
    const messages = this.formatMessages(input);
    return messages.reduce((acc, msg) => acc + (msg.content?.length ?? 0) / 4, 0);
  }

  private formatMessages(input: AILanguageModelPromptInput): ChatCompletionMessageParam[] {
    if (typeof input === 'string') {
      return [
        {
          role: 'user',
          content: input,
        },
      ];
    }
    return Array.isArray(input)
      ? input.map(m => ({
          role: m.role,
          content: m.content,
        }))
      : [
          {
            role: input.role,
            content: input.content,
          },
        ];
  }

  get maxTokens(): number {
    return 4096; // Model dependent
  }

  get tokensSoFar(): number {
    return this._tokensSoFar;
  }

  get tokensLeft(): number {
    return this.maxTokens - this._tokensSoFar;
  }

  get topK(): number {
    return this._topK;
  }

  get temperature(): number {
    return this._temperature;
  }

  oncontextoverflow: ((this: AILanguageModel, ev: Event) => any) | null = null;

  async clone(options?: AILanguageModelCloneOptions): Promise<AILanguageModel> {
    const clone = new OpenRouterLanguageModel({
      model: this.model,
      temperature: this._temperature,
      topK: this._topK,
      systemPrompt: this.systemPrompt,
      apiKey: this.openai.apiKey,
      ...options,
    });
    clone.messages = [...this.messages];
    return clone;
  }

  destroy(): void {
    this.messages = [];
  }
}
