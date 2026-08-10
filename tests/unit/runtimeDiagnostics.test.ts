import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  installRuntimeCompletionIntegrationBridge,
  installRuntimeRenderDiagnostics,
  isRuntimeDiagnosticsEnabled,
  RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY,
  RUNTIME_RENDER_DIAGNOSTICS_KEY,
  type RuntimeCompletionIntegrationBridge,
} from '../../src/game/runtimeDiagnostics';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runtime diagnostics integration bridge', () => {
  it('requires the exact diagnostics=1 query value', () => {
    expect(isRuntimeDiagnosticsEnabled('?diagnostics=1')).toBe(true);
    expect(isRuntimeDiagnosticsEnabled('?quality=low&diagnostics=1')).toBe(true);
    expect(isRuntimeDiagnosticsEnabled('?diagnostics')).toBe(false);
    expect(isRuntimeDiagnosticsEnabled('?diagnostics=0')).toBe(false);
    expect(isRuntimeDiagnosticsEnabled('')).toBe(false);
  });

  it('does not expose a browser global when diagnostics are disabled', () => {
    const browserWindow: Record<string, unknown> = {};
    const complete = vi.fn(() => true);
    vi.stubGlobal('window', browserWindow);

    const dispose = installRuntimeCompletionIntegrationBridge(false, complete);

    expect(browserWindow[RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY]).toBeUndefined();
    dispose();
    expect(complete).not.toHaveBeenCalled();
  });

  it('installs, invokes, and removes the diagnostics bridge', () => {
    const browserWindow: Record<string, unknown> = {};
    const complete = vi.fn(() => true);
    vi.stubGlobal('window', browserWindow);

    const dispose = installRuntimeCompletionIntegrationBridge(true, complete);
    const bridge = browserWindow[
      RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY
    ] as RuntimeCompletionIntegrationBridge;

    expect(bridge.kind).toBe('chapter-completion-integration-bridge');
    expect(bridge.completeCurrentChapter()).toBe(true);
    expect(complete).toHaveBeenCalledOnce();

    dispose();
    expect(browserWindow[RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY]).toBeUndefined();
  });

  it('does not let an older runtime remove a newer runtime bridge', () => {
    const browserWindow: Record<string, unknown> = {};
    vi.stubGlobal('window', browserWindow);

    const disposeFirst = installRuntimeCompletionIntegrationBridge(true, () => true);
    const disposeSecond = installRuntimeCompletionIntegrationBridge(true, () => true);
    const secondBridge = browserWindow[RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY];

    disposeFirst();
    expect(browserWindow[RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY]).toBe(secondBridge);

    disposeSecond();
    expect(browserWindow[RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY]).toBeUndefined();
  });

  it('owns and releases the render diagnostics reader without deleting a newer one', () => {
    const browserWindow: Record<string, unknown> = {};
    vi.stubGlobal('window', browserWindow);

    const disposeFirst = installRuntimeRenderDiagnostics(true, () => ({ calls: 1 }));
    const disposeSecond = installRuntimeRenderDiagnostics(true, () => ({ calls: 2 }));
    const secondReader = browserWindow[RUNTIME_RENDER_DIAGNOSTICS_KEY] as () => { calls: number };

    expect(secondReader()).toEqual({ calls: 2 });
    disposeFirst();
    expect(browserWindow[RUNTIME_RENDER_DIAGNOSTICS_KEY]).toBe(secondReader);

    disposeSecond();
    expect(browserWindow[RUNTIME_RENDER_DIAGNOSTICS_KEY]).toBeUndefined();
  });
});
