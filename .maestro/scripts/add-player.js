const response = http.post(MAESTRO_CONVEX_SITE_URL + "/test/add-player", {
  headers: { "Content-Type": "application/json", "x-test-secret": MAESTRO_TEST_SECRET },
  body: JSON.stringify({
    sessionId: output.sessionId,
    name: output.playerName,
    avatar: output.playerAvatar || "😎",
  }),
});

if (!response.ok) {
  throw new Error("Add player failed: " + response.status + " " + response.body);
}

const data = json(response.body);
output.lastPlayerUid = data.uid;
