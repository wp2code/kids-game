/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_FREESOUND_TOKEN?: string
  readonly VITE_PEXELS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
