export async function onRequestGet() {
  const url = "https://ollama.sistemai.my.id/api/tags";

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      return Response.json({
        ok: false,
        reachable: false,
        status: res.status,
        body: text
      }, { status: 500 });
    }

    if (!text.trim()) {
      return Response.json({
        ok: false,
        reachable: false,
        error: "Ollama response kosong",
        hint: "Pastikan cloudflared tunnel dan Ollama di laptop masih berjalan."
      }, { status: 500 });
    }

    const data = JSON.parse(text);

    return Response.json({
      ok: true,
      reachable: true,
      ollama_base_url: url.replace("/api/tags", ""),
      installed_models: data.models?.map((m: any) => m.name) ?? [],
      model_installed: data.models?.some((m: any) => m.name.startsWith("llama3")) ?? false
    });
  } catch (error: any) {
    return Response.json({
      ok: false,
      reachable: false,
      error: error?.message ?? String(error)
    }, { status: 500 });
  }
}
