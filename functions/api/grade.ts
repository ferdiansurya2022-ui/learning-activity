export async function onRequest(context: any) {
  if (context.request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed. Use POST." },
      { status: 405 }
    );
  }

  try {
    const body = await context.request.json();

    const question = body.question || "";
    const answer = body.answer || "";
    const knowledge = body.knowledge_base || "";

    const prompt = `
Kamu adalah evaluator kompetensi profesional.

Nilai jawaban peserta secara objektif.

Soal:
${question}

Jawaban peserta:
${answer}

Referensi:
${knowledge || "Gunakan pengetahuan umum yang relevan."}

Balas HANYA JSON valid TANPA penjelasan tambahan:

{
  "score": 0,
  "strengths": [],
  "weaknesses": [],
  "errors": [],
  "suggestions": [],
  "feedback": ""
}
`;

    const ollamaRes = await fetch("https://ollama.sistemai.my.id/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3:latest",
        prompt,
        stream: false
      })
    });

    const text = await ollamaRes.text();

    if (!ollamaRes.ok) {
      return Response.json({
        error: "Ollama error",
        status: ollamaRes.status,
        body: text
      }, { status: 500 });
    }

    const data = JSON.parse(text);
    const raw = data.response || "";

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      // fallback kalau AI ngawur
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match
        ? JSON.parse(match[0])
        : {
            score: 0,
            strengths: [],
            weaknesses: [],
            errors: ["Output AI bukan JSON valid"],
            suggestions: ["Perbaiki prompt"],
            feedback: raw
          };
    }

    return Response.json(parsed);

  } catch (err: any) {
    return Response.json({
      error: err?.message || String(err)
    }, { status: 500 });
  }
}
