/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_STORAGE_PREFIX?: string
  readonly VITE_DEBUG?: string
  readonly VITE_FEATURE_FLAGS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}