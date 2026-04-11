import { cleanup } from "./convex";

export default async function globalSetup() {
  await cleanup();
}
