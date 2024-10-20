// Type definitions for Prompt API

// Shared self.ai APIs
declare namespace ai {
  const languageModel: AILanguageModelFactory;
}

interface AICreateMonitor extends EventTarget {
  ondownloadprogress: ((this: AICreateMonitor, ev: Event) => any) | null;
}

type AICreateMonitorCallback = (monitor: AICreateMonitor) => void;

type AICapabilityAvailability = 'readily' | 'after-download' | 'no';

// Language Model

interface AILanguageModelFactory {
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModel>;
  capabilities(): Promise<AILanguageModelCapabilities>;
}

interface AILanguageModel extends EventTarget {
  prompt(input: AILanguageModelPromptInput, options?: AILanguageModelPromptOptions): Promise<string>;
  promptStreaming(input: AILanguageModelPromptInput, options?: AILanguageModelPromptOptions): ReadableStream;

  countPromptTokens(input: AILanguageModelPromptInput, options?: AILanguageModelPromptOptions): Promise<number>;
  readonly maxTokens: number;
  readonly tokensSoFar: number;
  readonly tokensLeft: number;

  readonly topK: number;
  readonly temperature: number;

  oncontextoverflow: ((this: AILanguageModel, ev: Event) => any) | null;

  clone(options?: AILanguageModelCloneOptions): Promise<AILanguageModel>;
  destroy(): void;
}

interface AILanguageModelCapabilities {
  readonly available: AICapabilityAvailability;
  languageAvailable(languageTag: string): AICapabilityAvailability;

  readonly defaultTopK: number | null;
  readonly maxTopK: number | null;
  readonly defaultTemperature: number | null;
  readonly maxTemperature: number | null;
}

interface AILanguageModelCreateOptions {
  signal?: AbortSignal;
  monitor?: AICreateMonitorCallback;

  systemPrompt?: string;
  initialPrompts?: AILanguageModelInitialPrompt[];
  topK?: number;
  temperature?: number;
}

interface AILanguageModelInitialPrompt {
  role: AILanguageModelInitialPromptRole;
  content: string;
}

interface AILanguageModelPrompt {
  role: AILanguageModelPromptRole;
  content: string;
}

interface AILanguageModelPromptOptions {
  signal?: AbortSignal;
}

interface AILanguageModelCloneOptions {
  signal?: AbortSignal;
}

type AILanguageModelPromptInput = string | AILanguageModelPrompt | AILanguageModelPrompt[];

type AILanguageModelInitialPromptRole = 'system' | 'user' | 'assistant';
type AILanguageModelPromptRole = 'user' | 'assistant';

interface Window {
  ai: typeof ai;
}

interface WorkerGlobalScope {
  ai: typeof ai;
}
