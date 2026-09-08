import type { Page } from "@playwright/test";

const siteUrl = process.env.CONVEX_SITE_URL ?? "";
const testSecret = process.env.TEST_SECRET ?? "";

const HEADERS = {
  "Content-Type": "application/json",
  "x-test-secret": testSecret,
};

async function failWithBody(label: string, res: Response) {
  const body = await res.text().catch(() => "");
  throw new Error(`${label}: ${res.status} ${body}`.trim());
}

export async function cleanup() {
  const res = await fetch(`${siteUrl}/test/cleanup`, {
    method: "POST",
    headers: HEADERS,
  });
  if (!res.ok) await failWithBody("Cleanup failed", res);
}

async function post<T>(path: string, label: string, body: unknown): Promise<T> {
  const res = await fetch(`${siteUrl}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) await failWithBody(label, res);
  return (await res.json()) as T;
}

/**
 * The uid the page is signed in as, once the app has minted its anonymous
 * identity. Convex Auth keeps the token in `localStorage` under a key
 * namespaced by the deployment URL, and its `sub` claim is the `uid` every
 * server function reads off `getUserIdentity()`.
 *
 * There is no `signInAs(page, uid)`, and there cannot be: the token is signed
 * with the deployment's key, which the suite never holds, so a page can never
 * adopt a uid the seed invented. The traffic runs the other way — let the page
 * sign itself in, read the uid here, and hand it to `seedLobby`/`seedGame` as a
 * player. Only a seeded player that never drives a browser gets a server uid.
 */
export async function currentUid(page: Page): Promise<string> {
  const handle = await page.waitForFunction(() => {
    const key = Object.keys(localStorage).find((name) => name.startsWith("__convexAuthJWT"));
    const token = key ? localStorage.getItem(key) : null;
    const payload = token?.split(".")[1];
    if (!payload) return null;

    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof claims.sub === "string" ? claims.sub : null;
  });

  return await handle.jsonValue();
}

/**
 * Signs the page in anonymously and returns its uid. Any route under `/$topic`
 * will do — that layout is where `useAnonymousAuth` is mounted, so home on its
 * own never mints an identity.
 */
export async function signIn(page: Page, path = "/games/2026"): Promise<string> {
  await page.goto(path);
  return await currentUid(page);
}

export type SeedPlayer = { name: string; avatar?: string; uid?: string };
export type SeedSelection = { uid: string; roundNumber: number; pickName: string };
export type SeededPlayer = { uid: string; name: string; isHost: boolean };

/** A lobby with one named host, skipping home → start → name → submit. */
export async function seedLobby({
  name,
  topic,
  year,
  hostUid,
}: {
  name: string;
  topic?: string;
  year?: number;
  hostUid?: string;
}) {
  return await post<{ sessionId: string; hostUid: string }>(
    "/test/create-session",
    "Create session failed",
    { name, topic, year, hostUid },
  );
}

/**
 * A session already at `phase` — `lobby`, `round:<n>`, `revealing:<n>` or
 * `ended`. The first player is the host; pass a `uid` from `signIn` for
 * whichever player drives the browser. Rounds count down, so a game starts at
 * `round:10` and ends at `round:1`.
 */
export async function seedGame({
  phase,
  players,
  selections,
  topic,
  year,
}: {
  phase: string;
  players: SeedPlayer[];
  selections?: SeedSelection[];
  topic?: string;
  year?: number;
}) {
  return await post<{ sessionId: string; roundIds: string[]; players: SeededPlayer[] }>(
    "/test/seed-game",
    "Seed game failed",
    { phase, players, selections, topic, year },
  );
}

export async function addPlayer({
  sessionId,
  name,
  avatar = "😎",
}: {
  sessionId: string;
  name: string;
  avatar?: string;
}) {
  const res = await fetch(`${siteUrl}/test/add-player`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ sessionId, name, avatar }),
  });
  if (!res.ok) await failWithBody("Add player failed", res);
  const json = await res.json();
  if (!json.uid || typeof json.uid !== "string") {
    throw new Error(`Unexpected add-player response: ${JSON.stringify(json)}`);
  }
  return json as { uid: string };
}

export async function makeSelection({
  sessionId,
  uid,
  roundNumber,
  pickName,
}: {
  sessionId: string;
  uid: string;
  roundNumber: number;
  pickName: string;
}) {
  const res = await fetch(`${siteUrl}/test/make-selection`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ sessionId, uid, roundNumber, pickName }),
  });
  if (!res.ok) await failWithBody("Make selection failed", res);
}
