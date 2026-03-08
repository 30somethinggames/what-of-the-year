var BASE_URL = "https://rosy-anteater-532.convex.site";

http.post(BASE_URL + "/test/make-selection", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: output.sessionId,
    uid: output.playerUid,
    roundNumber: Number(output.roundNumber),
    pickName: output.pickName,
  }),
});
