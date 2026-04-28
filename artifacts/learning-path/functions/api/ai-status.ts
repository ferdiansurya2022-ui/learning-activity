export async function onRequestGet() {
  return new Response(JSON.stringify({
    status: "OK",
    message: "AI endpoint hidup"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
