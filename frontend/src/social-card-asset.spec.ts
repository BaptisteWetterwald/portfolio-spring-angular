// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { portfolioPublicProfile } from './app/core/content/portfolio-content';

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('social card asset', () => {
  it('is the configured 1200 x 630 PNG in the public asset tree', () => {
    const socialCard = portfolioPublicProfile.socialCard;
    const assetPath = join(process.cwd(), 'public', socialCard.path.replace(/^\//u, ''));

    expect(existsSync(assetPath)).toBe(true);

    const contents = readFileSync(assetPath);

    expect(contents.subarray(0, pngSignature.length)).toEqual(pngSignature);
    expect(contents.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(contents.readUInt32BE(16)).toBe(1200);
    expect(contents.readUInt32BE(20)).toBe(630);
    expect(socialCard).toEqual({
      path: '/assets/social/baptiste-wetterwald-social-card-v1.png',
      width: 1200,
      height: 630,
      mimeType: 'image/png',
    });
  });
});
