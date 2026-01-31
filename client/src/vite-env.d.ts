/// <reference types="vite/client" />

type Locale = 'en' | 'fr';

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
