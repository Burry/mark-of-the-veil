export const RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY =
  '__MARK_OF_THE_VEIL_RUNTIME_COMPLETION_INTEGRATION_BRIDGE__' as const;
export const RUNTIME_RENDER_DIAGNOSTICS_KEY = '__MARK_RENDER_INFO__' as const;

export interface RuntimeCompletionIntegrationBridge {
  readonly kind: 'chapter-completion-integration-bridge';
  completeCurrentChapter(): boolean;
}

type DiagnosticsWindow = Window & {
  [RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY]?: RuntimeCompletionIntegrationBridge;
  [RUNTIME_RENDER_DIAGNOSTICS_KEY]?: () => unknown;
};

export function isRuntimeDiagnosticsEnabled(search: string): boolean {
  return new URLSearchParams(search).get('diagnostics') === '1';
}

export function installRuntimeCompletionIntegrationBridge(
  enabled: boolean,
  completeCurrentChapter: () => boolean,
): () => void {
  if (!enabled || typeof window === 'undefined') return () => undefined;

  const diagnosticsWindow = window as DiagnosticsWindow;
  const bridge: RuntimeCompletionIntegrationBridge = Object.freeze({
    kind: 'chapter-completion-integration-bridge',
    completeCurrentChapter,
  });
  diagnosticsWindow[RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY] = bridge;

  return () => {
    if (diagnosticsWindow[RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY] === bridge) {
      delete diagnosticsWindow[RUNTIME_COMPLETION_INTEGRATION_BRIDGE_KEY];
    }
  };
}

export function installRuntimeRenderDiagnostics<T>(enabled: boolean, read: () => T): () => void {
  if (!enabled || typeof window === 'undefined') return () => undefined;

  const diagnosticsWindow = window as DiagnosticsWindow;
  const reader = read as () => unknown;
  diagnosticsWindow[RUNTIME_RENDER_DIAGNOSTICS_KEY] = reader;

  return () => {
    if (diagnosticsWindow[RUNTIME_RENDER_DIAGNOSTICS_KEY] === reader) {
      delete diagnosticsWindow[RUNTIME_RENDER_DIAGNOSTICS_KEY];
    }
  };
}
