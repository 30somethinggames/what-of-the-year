var BASE_URL = "https://rosy-anteater-532.convex.site";

var response = http.post(BASE_URL + "/test/add-player", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: output.sessionId,
    name: output.playerName,
    avatar: output.playerAvatar || "😎",
  }),
});

var data = json(response.body);
output.lastPlayerUid = data.uid;
