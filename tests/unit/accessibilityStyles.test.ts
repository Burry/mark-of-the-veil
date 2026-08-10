import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(
  fileURLToPath(new URL('../../src/styles.css', import.meta.url)),
  'utf8',
);

describe('interface motion accessibility', () => {
  it('reduces animation and transitions on elements and their pseudo-elements', () => {
    expect(styles).toMatch(
      /\.reduce-motion \*,\s*\.reduce-motion \*::before,\s*\.reduce-motion \*::after\s*\{/,
    );
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\*,\s*\*::before,\s*\*::after\s*\{/,
    );
  });
});
