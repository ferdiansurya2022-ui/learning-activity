export async function onRequestPost(context: any) {
  const body = await context.request.json();

  return new Response(JSON.stringify({
    score: 100,
    feedback: "Ini dummy dulu (belum AI)"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
