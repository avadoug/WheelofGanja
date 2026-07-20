/** Cloudflare-compatible static asset adapter used only by Sites hosting. */
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") return response;
    return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
  },
};
