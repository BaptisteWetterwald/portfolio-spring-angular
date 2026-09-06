export type LighthouseBeamSource = 'header' | 'floating';

export function lighthouseLanternSelector(source: LighthouseBeamSource): string {
  return `[data-lighthouse-lantern="${source}"]`;
}
