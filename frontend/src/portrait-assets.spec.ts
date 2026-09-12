// @vitest-environment node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface PortraitAssetContract {
  readonly fileName: string;
  readonly format: 'avif' | 'webp';
  readonly width: number;
  readonly height: number;
  readonly maximumBytes: number;
}

const portraitDirectory = join(process.cwd(), 'public', 'assets', 'portrait');
const contracts: readonly PortraitAssetContract[] = [
  {
    fileName: 'baptiste-wetterwald-portrait-v1-240w.avif',
    format: 'avif',
    width: 240,
    height: 360,
    maximumBytes: 75_000,
  },
  {
    fileName: 'baptiste-wetterwald-portrait-v1-480w.avif',
    format: 'avif',
    width: 480,
    height: 720,
    maximumBytes: 150_000,
  },
  {
    fileName: 'baptiste-wetterwald-portrait-v1-240w.webp',
    format: 'webp',
    width: 240,
    height: 360,
    maximumBytes: 75_000,
  },
  {
    fileName: 'baptiste-wetterwald-portrait-v1-480w.webp',
    format: 'webp',
    width: 480,
    height: 720,
    maximumBytes: 150_000,
  },
];

describe('responsive portrait assets', () => {
  it.each(contracts)('provides $fileName with the expected type and dimensions', (contract) => {
    const assetPath = join(portraitDirectory, contract.fileName);

    expect(existsSync(assetPath)).toBe(true);

    const contents = readFileSync(assetPath);

    expect(contents.byteLength).toBeGreaterThan(5_000);
    expect(contents.byteLength).toBeLessThanOrEqual(contract.maximumBytes);
    expect(imageFormat(contents)).toBe(contract.format);
    expect(imageDimensions(contents, contract.format)).toEqual({
      width: contract.width,
      height: contract.height,
    });
  });

  it('retains the approved source master byte-for-byte', () => {
    const source = readFileSync(join(portraitDirectory, 'baptiste-wetterwald-portrait.png'));

    expect(source.byteLength).toBe(19_207_685);
    expect(createHash('sha256').update(source).digest('hex')).toBe(
      'f1b20a6057765277ccd90bbc6e162df1673a3577b3a3eb525be6a2a8315517af',
    );
  });
});

function imageFormat(contents: Buffer): 'avif' | 'webp' | undefined {
  if (contents.subarray(4, 12).toString('ascii') === 'ftypavif') {
    return 'avif';
  }

  if (
    contents.subarray(0, 4).toString('ascii') === 'RIFF' &&
    contents.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }

  return undefined;
}

function imageDimensions(
  contents: Buffer,
  format: PortraitAssetContract['format'],
): { width: number; height: number } {
  if (format === 'avif') {
    const ispeOffset = contents.indexOf('ispe', 0, 'ascii');

    if (ispeOffset < 0) {
      throw new Error('AVIF is missing its ispe dimensions box');
    }

    return {
      width: contents.readUInt32BE(ispeOffset + 8),
      height: contents.readUInt32BE(ispeOffset + 12),
    };
  }

  const frameHeaderOffset = contents.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));

  if (frameHeaderOffset < 0) {
    throw new Error('WebP is missing its VP8 frame header');
  }

  return {
    width: contents.readUInt16LE(frameHeaderOffset + 3) & 0x3fff,
    height: contents.readUInt16LE(frameHeaderOffset + 5) & 0x3fff,
  };
}
