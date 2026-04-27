export async function onRequest() {
  try {
    const res = await fetch("https://ollama.sistemai.my.id/api/tags");

    if (!res.ok) {
      return Response.json({
        ok: false,
        reachable: false,
        error: `HTTP ${res.status}`
      });
    }

    const data = await res.json();

    return Response.json({
      ok: true,
      reachable: true,
      ollama_base_url: "https://ollama.sistemai.my.id",
      installed_models: data.models?.map((m: any) => m.name) || [],
      model_installed: data.models?.some((m: any) => m.name === "llama3:latest")
    });

  } catch (err: any) {
    return Response.json({
      ok: false,
      reachable: false,
      error: err?.message || String(err)
    });
  }
}
