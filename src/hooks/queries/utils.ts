export async function handleError(api: string, response: Response) {
  const errorText = await response.text();
  throw new Error(`${api} API error (${response.status}): ${errorText || response.statusText}`);
}

export const DEFAULT_STALE_TIME = 1000 * 60 * 60 * 24;
