import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ResultScreen } from '../../src/ui/GameOverlays';

describe('ResultScreen', () => {
  it('surfaces a saved personal best', () => {
    const markup = renderToStaticMarkup(
      createElement(ResultScreen, {
        victory: true,
        stats: null,
        bestRun: { score: 12_450, elapsedSeconds: 521, rank: 'A' },
        onReplay: vi.fn(),
        onTitle: vi.fn(),
      }),
    );

    expect(markup).toContain('PERSONAL BEST');
    expect(markup).toContain('RANK A');
    expect(markup).toContain('12,450 PTS');
    expect(markup).toContain('8:41');
  });

  it('hides the personal-best row before a completed run', () => {
    const markup = renderToStaticMarkup(
      createElement(ResultScreen, {
        victory: false,
        stats: null,
        bestRun: { score: 0, elapsedSeconds: 0, rank: 'C' },
        onReplay: vi.fn(),
        onTitle: vi.fn(),
      }),
    );

    expect(markup).not.toContain('PERSONAL BEST');
  });
});
