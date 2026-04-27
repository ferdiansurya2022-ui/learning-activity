// Default fallback bila tidak ada env (mis. tanpa Replit Secrets / tanpa file .env).
// Aplikasi tetap bisa jalan langsung tanpa konfigurasi tambahan.
const DEFAULT_OLLAMA_BASE_URL = "https://ollama.sistemai.my.id";
const DEFAULT_OLLAMA_MODEL = "llama3";

export const OLLAMA_BASE_URL = (
  process.env["OLLAMA_BASE_URL"] ||
  process.env["OLLAMA_URL"] ||
  DEFAULT_OLLAMA_BASE_URL
).replace(/\/$/, "");

export const OLLAMA_MODEL =
  process.env["OLLAMA_MODEL"] || DEFAULT_OLLAMA_MODEL;

export const OLLAMA_GENERATE_URL = `${OLLAMA_BASE_URL}/api/generate`;
export const OLLAMA_TAGS_URL = `${OLLAMA_BASE_URL}/api/tags`;
