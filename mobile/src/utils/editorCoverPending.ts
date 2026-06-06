let pendingCoverUri: string | null = null;

export function setPendingCoverUri(uri: string): void {
  pendingCoverUri = uri;
}

export function consumePendingCoverUri(): string | null {
  const uri = pendingCoverUri;
  pendingCoverUri = null;
  return uri;
}
