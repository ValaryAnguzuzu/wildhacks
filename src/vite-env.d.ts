/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  /** Groq API key — advisor prefers this (free tier; never commit; use .env) */
  readonly VITE_GROQ_API_KEY?: string;
  /** Optional Groq model for advisor (default llama-3.3-70b-versatile) */
  readonly VITE_GROQ_ADVISOR_MODEL?: string;
  /** OpenAI API key — advisor if Groq unset; optional FinSim (never commit; use .env) */
  readonly VITE_OPENAI_API_KEY?: string;
  /** Optional override for OpenAI base URL (e.g. same-origin proxy in production) */
  readonly VITE_OPENAI_URL?: string;
  /** Optional advisor model (default gpt-4o-mini) */
  readonly VITE_OPENAI_ADVISOR_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
