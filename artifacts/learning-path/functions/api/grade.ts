export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();

    const { question, answer } = body;

    const prompt = `
Kamu adalah evaluator kompetensi.

Nilai jawaban berikut dari 0 sampai 100.

Pertanyaan:
${question}

Jawaban peserta:
${answer}

Berikan output JSON:
{
  "score": number,
  "feedback": "penjelasan singkat"
}
`;

    const res = await fetch("https://ollama.sistemai.my.id/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3:latest",
        prompt: prompt,
        stream: false,
      }),
    });

    const data = await res.json();

    let result;

    try {
      result = JSON.parse(data.response);
    } catch {
      result = {
        score: 0,
        feedback: data.response,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
    });
  }
}
