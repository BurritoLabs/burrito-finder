const baseUrl = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "https://finder.burrito.money");

const pageResponse = await fetch(baseUrl, { redirect: "follow" });
if (!pageResponse.ok) {
  throw new Error(`Finder page returned HTTP ${pageResponse.status}`);
}

const html = await pageResponse.text();
const stylesheetUrls = [...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
  .map((match) => new URL(match[1], baseUrl))
  .filter((url) => url.origin === baseUrl.origin);

if (stylesheetUrls.length === 0) {
  throw new Error("Finder page did not reference a same-origin stylesheet");
}

for (const url of stylesheetUrls) {
  const response = await fetch(url, { redirect: "follow" });
  const contentType = response.headers.get("content-type") ?? "";
  const bodyStart = (await response.text()).slice(0, 512).toLowerCase();
  if (!response.ok || !contentType.includes("text/css") || bodyStart.includes("<!doctype html")) {
    throw new Error(
      `Finder stylesheet unavailable: ${url.pathname} status=${response.status} content-type=${contentType || "missing"}`,
    );
  }
}

console.log(`Production asset audit passed: ${stylesheetUrls.length} same-origin stylesheet(s) returned CSS.`);
