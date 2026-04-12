/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  /** OpenAI API key for FinSim scenario text (never commit; use .env) */
  readonly VITE_OPENAI_API_KEY?: string;
  /** Optional override for OpenAI base URL (e.g. same-origin proxy in production) */
  readonly VITE_OPENAI_URL?: string;
  /** Anthropic API key for Fin advisor (hackathon: client-side only; use a backend in production) */
  readonly VITE_CLAUDE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
