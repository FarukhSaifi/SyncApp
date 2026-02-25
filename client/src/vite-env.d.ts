/// <reference types="vite/client" />

declare module "qs";
declare module "file-saver";

interface ImportMetaEnv {
  readonly VITE_API_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
