import { Router, type IRouter } from "express";
import {
  OLLAMA_BASE_URL,
  OLLAMA_GENERATE_URL,
  OLLAMA_MODEL,
} from "../lib/ollama";

const router: IRouter = Router();

interface GradeRequestBody {
  question?: string;
  answer?: string;
  knowledge_base?: string;
  criteria?: string;
  max_score?: number;
}

function buildPrompt(body: GradeRequestBody): string {
  const maxScore = body.max_score ?? 100;
  const kb =
    body.knowledge_base?.trim() ||
    "(tidak ada referensi tambahan, gunakan pengetahuan umum)";
  const criteria =
    body.criteria?.trim() ||
    "Akurasi, kelengkapan, kejelasan, dan relevansi terhadap pertanyaan.";

  return `Anda adalah penilai (grader) ahli untuk soal pembelajaran. Nilai jawaban siswa secara objektif.

Pertanyaan:
${body.question || ""}

Jawaban siswa:
${body.answer || ""}

Referensi / knowledge base:
${kb}

Kriteria penilaian dari pengajar:
${criteria}

Skor maksimum: ${maxScore}

Tugas Anda:
1. Berikan skor numerik antara 0 dan ${maxScore}.
2. Tuliskan strengths (kekuatan jawaban) sebagai daftar singkat.
3. Tuliskan weaknesses (kelemahan jawaban) sebagai daftar singkat.
4. Tuliskan errors (kesalahan faktual atau logika) sebagai daftar singkat.
5. Tuliskan suggestions (saran perbaikan konkret) sebagai daftar singkat.
6. Tuliskan feedback narasi singkat untuk siswa (1-3 kalimat).

Balas HANYA dengan JSON valid (tanpa teks lain di luar JSON, tanpa markdown fences) dengan struktur persis:
{
  "score": <number>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "errors": [<string>, ...],
  "suggestions": [<string>, ...],
  "feedback": <string>
}`;
}

function extractJson(text: string): unknown {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  if (!candidate) return null;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

router.post("/grade", async (req, res) => {
  const body = req.body as GradeRequestBody;
  if (
    !body ||
    typeof body.question !== "string" ||
    typeof body.answer !== "string"
  ) {
    res.status(400).json({
      error: "Body must include 'question' (string) and 'answer' (string).",
    });
    return;
  }

  const prompt = buildPrompt(body);

  // Abort after 60s to avoid hanging the frontend if the tunnel/Ollama is slow.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const ollamaResponse = await fetch(OLLAMA_GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.2 },
      }),
      signal: controller.signal,
    });

    if (!ollamaResponse.ok) {
      const text = await ollamaResponse.text().catch(() => "");
      req.log.error(
        {
          status: ollamaResponse.status,
          text,
          ollamaBaseUrl: OLLAMA_BASE_URL,
        },
        "Ollama call failed",
      );
      res.status(502).json({
        error: "Koneksi ke OLLAMA_BASE_URL gagal (bukan error frontend)",
        ollama_base_url: OLLAMA_BASE_URL,
        ollama_status: ollamaResponse.status,
        details: text.slice(0, 500),
        hint: "Cek backend log + status Cloudflare Tunnel + Ollama di laptop. Endpoint /api/ai-status bisa membantu diagnosa.",
      });
      return;
    }

    const ollamaJson = (await ollamaResponse.json()) as { response?: string };
    const raw = ollamaJson.response ?? "";
    const parsed = extractJson(raw) as Record<string, unknown> | null;

    if (!parsed || typeof parsed !== "object") {
      res.status(200).json({
        score: 0,
        strengths: [],
        weaknesses: [],
        errors: ["AI tidak mengembalikan JSON yang valid"],
        suggestions: [],
        feedback: raw.slice(0, 500),
      });
      return;
    }

    const score = Number(parsed["score"]);
    const maxScore = body.max_score ?? 100;
    res.json({
      score: Number.isFinite(score)
        ? Math.max(0, Math.min(maxScore, score))
        : 0,
      strengths: Array.isArray(parsed["strengths"]) ? parsed["strengths"] : [],
      weaknesses: Array.isArray(parsed["weaknesses"])
        ? parsed["weaknesses"]
        : [],
      errors: Array.isArray(parsed["errors"]) ? parsed["errors"] : [],
      suggestions: Array.isArray(parsed["suggestions"])
        ? parsed["suggestions"]
        : [],
      feedback:
        typeof parsed["feedback"] === "string" ? parsed["feedback"] : "",
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    req.log.error(
      { err, ollamaBaseUrl: OLLAMA_BASE_URL },
      "Grade endpoint error",
    );
    res.status(502).json({
      error: aborted
        ? "Timeout (>60s) saat menghubungi OLLAMA_BASE_URL"
        : "Tidak bisa menjangkau OLLAMA_BASE_URL (bukan error frontend)",
      ollama_base_url: OLLAMA_BASE_URL,
      details: err instanceof Error ? err.message : String(err),
      hint: "Pastikan Cloudflare Tunnel aktif & domain mengarah ke Ollama. Coba GET /api/ai-status.",
    });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;
