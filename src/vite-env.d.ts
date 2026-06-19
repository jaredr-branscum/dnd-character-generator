/// <reference types="vite/client" />

interface Window {
  puter?: {
    ai: {
      chat: (prompt: string, options?: { model?: string; stream?: boolean }) => Promise<{
        message?: {
          content?: string;
        };
      }>;
    };
  };
}