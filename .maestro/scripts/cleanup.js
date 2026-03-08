const response = http.post(MAESTRO_CONVEX_SITE_URL + "/test/cleanup", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});

if (!response.ok) {
  throw new Error("Cleanup failed: " + response.status + " " + response.body);
}
