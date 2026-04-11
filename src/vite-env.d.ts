/// <reference types="vite/client" />

import type { AppApi } from "./types";

declare global {
  interface Window {
    appApi: AppApi;
  }
}

export {};
