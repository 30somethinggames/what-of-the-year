import { cleanup } from "./helpers/convex";

export default async function globalSetup() {
  await cleanup();
}
