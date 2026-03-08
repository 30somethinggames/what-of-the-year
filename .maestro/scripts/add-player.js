const response = http.post(CONVEX_SITE_URL + "/test/add-player", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: output.sessionId,
    name: output.playerName,
    avatar: output.playerAvatar || "😎",
  }),
});

const data = json(response.body);
output.lastPlayerUid = data.uid;
