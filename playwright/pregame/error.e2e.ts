import { expect, test, type Page } from "@playwright/test";

// A session ID that is not a well-formed Convex ID fails the `v.id("sessions")`
// validator in `getSession`, so the query throws and the root ErrorBoundary
// renders `DisplayError` with its Retry button. The join form must not appear:
// there is no session to join.
async function expectSessionIdRejected(page: Page, sessionId: string) {
  await page.goto(`/games/2026/${sessionId}`);

  await expect(page.getByTestId("error-state")).toBeVisible();
  await expect(page.getByText("Something went wrong")).toBeVisible();
  await expect(page.getByTestId("error-retry")).toBeVisible();
  await expect(page.getByTestId("name-input")).toHaveCount(0);
  await expect(page.getByTestId("session-id")).toHaveCount(0);
}

test("error: a malformed session ID shows the error state, not the join form", async ({ page }) => {
  await expectSessionIdRejected(page, "invalid-session-id");
});

test("error: a well-formed but invalid session ID shows the error state, not the join form", async ({
  page,
}) => {
  // Convex IDs carry a checksum, so a hand-written ID of the right shape is
  // rejected by the validator exactly like the malformed one above — the client
  // never gets as far as a "session not found" read. The remaining case, a
  // genuine ID whose session row is gone (`Lobby`'s `if (!session)`), is not
  // reachable from a spec today: nothing deletes a single session, and
  // `/test/cleanup` wipes the whole deployment, which would break the specs
  // sharing it under CI's four workers.
  await expectSessionIdRejected(page, "j57d9pf2p0vabcdefgh1234");
});
