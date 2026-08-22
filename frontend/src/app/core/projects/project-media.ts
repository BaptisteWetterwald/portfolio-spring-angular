const supportedAbsoluteMediaProtocols = new Set(['http:', 'https:']);

export function projectMediaSrc(mediaRef: string | null | undefined): string | undefined {
  const value = mediaRef?.trim();

  if (!value) {
    return undefined;
  }

  if (isRootRelativePath(value)) {
    return value;
  }

  try {
    const url = new URL(value);

    return supportedAbsoluteMediaProtocols.has(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function absoluteProjectMediaUrl(mediaRef: string | null | undefined): string | undefined {
  const src = projectMediaSrc(mediaRef);

  if (!src) {
    return undefined;
  }

  return /^https?:\/\//i.test(src) ? src : `https://bwetterwald.fr${src}`;
}

function isRootRelativePath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}
