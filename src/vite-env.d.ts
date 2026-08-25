/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  /** New-style key: sb_publishable_… */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Legacy name, still honoured as a fallback */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
