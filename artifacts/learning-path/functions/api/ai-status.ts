export async function onRequest() {
  try {
    const res = await fetch("https://ollama.sistemai.my.id/api/tags");
    const text = await res.text();

    return new Response(JSON.stringify({
      ok: res.ok,
      status: res.status,
      body: text
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      ok: false,
      error: err.message
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
