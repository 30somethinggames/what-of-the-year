const siteUrl = process.env.CONVEX_SITE_URL ?? process.env.MAESTRO_CONVEX_SITE_URL;
const testSecret = process.env.TEST_SECRET ?? process.env.MAESTRO_TEST_SECRET;

if (!siteUrl || !testSecret) {
  throw new Error("CONVEX_SITE_URL and TEST_SECRET must be set");
}

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
