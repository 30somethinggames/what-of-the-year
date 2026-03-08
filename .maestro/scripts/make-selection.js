const response = http.post(MAESTRO_CONVEX_SITE_URL + "/test/make-selection", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: output.sessionId,
    uid: output.playerUid,
    roundNumber: Number(output.roundNumber),
    pickName: output.pickName,
  }),
});

if (!response.ok) {
  throw new Error("Make selection failed: " + response.status + " " + response.body);
}
