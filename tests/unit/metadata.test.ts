import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CANONICAL_URL = 'https://mark-of-the-veil.burry.io/';
const SOCIAL_IMAGE_URL = `${CANONICAL_URL}og-image.jpg`;
const html = readFileSync(`${ROOT}/index.html`, 'utf8');
const manifest = JSON.parse(readFileSync(`${ROOT}/public/manifest.webmanifest`, 'utf8')) as {
  display: string;
  id: string;
  scope: string;
  start_url: string;
  icons: Array<{ purpose: string; sizes: string; src: string; type: string }>;
};

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
      match[1],
      match[2] ?? match[3],
    ]),
  );
}

const headTags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)].map((match) => attributes(match[0]));

function meta(selector: 'name' | 'property', value: string): string | undefined {
  return headTags.find((tag) => tag[selector] === value)?.content;
}

function link(rel: string): string | undefined {
  return headTags.find((tag) => tag.rel === rel)?.href;
}

function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`Invalid JPEG marker at byte ${offset}.`);
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
        marker,
      )
    ) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += length + 2;
  }
  throw new Error('JPEG dimensions were not found.');
}

describe('Vite metadata contract', () => {
  it('publishes one consistent canonical identity across SEO and social metadata', () => {
    expect(link('canonical')).toBe(CANONICAL_URL);
    expect(meta('property', 'og:url')).toBe(CANONICAL_URL);
    expect(meta('property', 'og:image')).toBe(SOCIAL_IMAGE_URL);
    expect(meta('name', 'twitter:image')).toBe(SOCIAL_IMAGE_URL);
    expect(meta('property', 'og:image:width')).toBe('1200');
    expect(meta('property', 'og:image:height')).toBe('630');
    expect(meta('property', 'og:image:alt')).toBeTruthy();
    expect(meta('name', 'twitter:image:alt')).toBeTruthy();
    expect(meta('name', 'robots')).toContain('max-image-preview:large');
  });

  it('ships parseable VideoGame structured data covered by the production CSP', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const source = match?.[1] ?? '';
    const data = JSON.parse(source) as {
      '@type': string;
      image: string;
      name: string;
      url: string;
    };
    expect(data).toMatchObject({
      '@type': 'VideoGame',
      image: SOCIAL_IMAGE_URL,
      name: 'Mark of the Veil',
      url: CANONICAL_URL,
    });

    const csp = JSON.parse(readFileSync(`${ROOT}/vercel.json`, 'utf8')).headers[1].headers.find(
      (header: { key: string }) => header.key === 'Content-Security-Policy',
    ).value as string;
    const digest = createHash('sha256').update(source).digest('base64');
    expect(csp).toContain(`'sha256-${digest}'`);
  });

  it('uses a standalone manifest with distinct any and maskable icon assets', () => {
    expect(manifest).toMatchObject({ id: '/', scope: '/', start_url: '/', display: 'standalone' });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      ]),
    );

    for (const icon of manifest.icons) {
      expect(existsSync(`${ROOT}/public${icon.src}`)).toBe(true);
    }
  });

  it('ships platform artwork at its declared dimensions', () => {
    expect(jpegSize(`${ROOT}/public/og-image.jpg`)).toEqual({ width: 1200, height: 630 });
    expect(pngSize(`${ROOT}/public/apple-touch-icon.png`)).toEqual({
      width: 180,
      height: 180,
    });
    expect(pngSize(`${ROOT}/public/pwa-192x192.png`)).toEqual({ width: 192, height: 192 });
    expect(pngSize(`${ROOT}/public/pwa-512x512.png`)).toEqual({ width: 512, height: 512 });
    expect(pngSize(`${ROOT}/public/pwa-maskable-512x512.png`)).toEqual({
      width: 512,
      height: 512,
    });
  });
});
