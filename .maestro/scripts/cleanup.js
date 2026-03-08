var BASE_URL = "https://rosy-anteater-532.convex.site";

http.post(BASE_URL + "/test/cleanup", {
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
