// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { portfolioPublicProfile } from './app/core/content/portfolio-content';

const jpegSignature = Buffer.from([0xff, 0xd8, 0xff]);

describe('social card asset', () => {
  it('is a compact JPEG configured for 1200 x 630 sharing in the public asset tree', () => {
    const socialCard = portfolioPublicProfile.socialCard;
    const assetPath = join(process.cwd(), 'public', socialCard.path.replace(/^\//u, ''));

    expect(existsSync(assetPath)).toBe(true);

    const contents = readFileSync(assetPath);

    expect(contents.subarray(0, jpegSignature.length)).toEqual(jpegSignature);
    expect(contents.length).toBeLessThan(200_000);
    expect(socialCard).toEqual({
      path: '/assets/social/baptiste-wetterwald-social-card-v2.jpg',
      width: 1200,
      height: 630,
      mimeType: 'image/jpeg',
    });
  });
});
