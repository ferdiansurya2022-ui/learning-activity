import { Router, type IRouter } from "express";
import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  OLLAMA_TAGS_URL,
} from "../lib/ollama";

const router: IRouter = Router();

interface OllamaTag {
  name?: string;
  model?: string;
}

router.get("/ai-status", async (req, res) => {
  const startedAt = Date.now();

  // Abort after 5s so a dead tunnel doesn't hang the request.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(OLLAMA_TAGS_URL, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      res.status(502).json({
        ok: false,
        reachable: false,
        ollama_base_url: OLLAMA_BASE_URL,
        ollama_model: OLLAMA_MODEL,
        latency_ms: Date.now() - startedAt,
        error: `Ollama responded with status ${response.status}`,
        details: text.slice(0, 300),
        hint: "Cek apakah Ollama berjalan di laptop dan tunnel Cloudflare aktif untuk OLLAMA_BASE_URL.",
      });
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      models?: OllamaTag[];
    };
    const models = (data.models || [])
      .map((m) => m.name || m.model)
      .filter((n): n is string => typeof n === "string");

    const modelInstalled = models.some(
      (n) => n === OLLAMA_MODEL || n.startsWith(`${OLLAMA_MODEL}:`),
    );

    res.json({
      ok: true,
      reachable: true,
      ollama_base_url: OLLAMA_BASE_URL,
      ollama_model: OLLAMA_MODEL,
      model_installed: modelInstalled,
      installed_models: models,
      latency_ms: Date.now() - startedAt,
      ...(modelInstalled
        ? {}
        : {
            warning: `Model "${OLLAMA_MODEL}" belum di-pull di Ollama. Jalankan: ollama pull ${OLLAMA_MODEL}`,
          }),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    req.log.warn(
      { err, ollamaBaseUrl: OLLAMA_BASE_URL },
      "AI status check failed",
    );
    res.status(502).json({
      ok: false,
      reachable: false,
      ollama_base_url: OLLAMA_BASE_URL,
      ollama_model: OLLAMA_MODEL,
      latency_ms: Date.now() - startedAt,
      error: aborted
        ? "Timeout (>5s) saat menghubungi OLLAMA_BASE_URL"
        : "Tidak bisa menjangkau OLLAMA_BASE_URL",
      details: err instanceof Error ? err.message : String(err),
      hint: `Pastikan Cloudflare Tunnel aktif dan domain mengarah ke Ollama. URL yang dipakai backend: ${OLLAMA_BASE_URL}`,
    });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;
