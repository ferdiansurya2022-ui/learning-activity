export async function onRequestGet() {
  try {
    const res = await fetch("https://ollama.sistemai.my.id/api/tags");
    const data = await res.json();

    return Response.json({
      ok: true,
      reachable: true,
      ollama_base_url: "https://ollama.sistemai.my.id",
      installed_models: data.models?.map((m: any) => m.name) ?? [],
      model_installed: data.models?.some((m: any) => m.name.startsWith("llama3")) ?? false
    });
  } catch (error: any) {
    return Response.json({
      ok: false,
      reachable: false,
      error: error?.message ?? "Tidak bisa menjangkau Ollama"
    }, { status: 500 });
  }
}
