/// <reference types="vite/client" />

// Injected by vite.config.ts `define`. True only when the LLM API key is configured.
declare const __LLM_ENABLED__: boolean;

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_MODEL?: string;
  readonly VITE_OPENROUTER_FALLBACK_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
