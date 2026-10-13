export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch (e) {
    console.error(e);
  }
  return `HTTP ${response.status}`;
}
