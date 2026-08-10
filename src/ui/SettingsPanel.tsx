import type { GameSettings, Quality } from '../game/types/GameTypes';
import { DEFAULT_SETTINGS } from '../app/defaults';
import { Frame, MenuButton } from './Frame';

type SettingsTab = 'gameplay' | 'audio' | 'video' | 'accessibility';

interface SettingsPanelProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  title?: string;
  mode: 'title' | 'pause';
  onBack?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  onReturnToCampaign?: () => void;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

interface RangeRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}

function RangeRow({ label, value, min, max, step, displayValue, onChange }: RangeRowProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <label className="setting-row setting-row--range">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--range-value': `${percentage}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
        data-menu-item
      />
      <output>{displayValue}</output>
    </label>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <button
        type="button"
        className="setting-choice"
        aria-pressed={value}
        aria-label={`${label}: ${value ? 'on' : 'off'}`}
        onClick={() => onChange(!value)}
        data-menu-item
      >
        <span aria-hidden="true">‹</span>
        <strong>{value ? 'ON' : 'OFF'}</strong>
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}

interface ChoiceRowProps {
  label: string;
  value: Quality;
  onChange: (value: Quality) => void;
}

const QUALITY_ORDER: Quality[] = ['low', 'medium', 'high'];

function ChoiceRow({ label, value, onChange }: ChoiceRowProps) {
  const move = (direction: number) => {
    const next =
      (QUALITY_ORDER.indexOf(value) + direction + QUALITY_ORDER.length) % QUALITY_ORDER.length;
    onChange(QUALITY_ORDER[next] ?? 'high');
  };
  return (
    <div className="setting-row">
      <span>{label}</span>
      <div className="setting-choice setting-choice--split">
        <button type="button" onClick={() => move(-1)} aria-label="Previous quality" data-menu-item>
          ‹
        </button>
        <strong>{value.toUpperCase()}</strong>
        <button type="button" onClick={() => move(1)} aria-label="Next quality" data-menu-item>
          ›
        </button>
      </div>
    </div>
  );
}

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'gameplay', label: 'GAMEPLAY' },
  { id: 'audio', label: 'AUDIO' },
  { id: 'video', label: 'VIDEO' },
  { id: 'accessibility', label: 'ACCESSIBILITY' },
];

export function SettingsPanel({
  settings,
  onChange,
  title,
  mode,
  onBack,
  onResume,
  onRestart,
  onReturnToCampaign,
  activeTab,
  onTabChange,
}: SettingsPanelProps) {
  const patch = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const moveTab = (currentIndex: number, direction: 1 | -1) => {
    const nextIndex = (currentIndex + direction + TABS.length) % TABS.length;
    const nextTab = TABS[nextIndex];
    if (!nextTab) return;
    onTabChange(nextTab.id);
    window.requestAnimationFrame(() =>
      document.getElementById(`settings-tab-${nextTab.id}`)?.focus(),
    );
  };

  return (
    <Frame className={`settings-panel settings-panel--${mode}`} label={title ?? 'Game settings'}>
      <div className="section-heading settings-title">
        <span className="section-heading__line" aria-hidden="true" />
        <span className="settings-title__diamond" aria-hidden="true" />
        <h2>{title ?? (mode === 'pause' ? 'PAUSED' : 'SETTINGS')}</h2>
        <span className="settings-title__diamond" aria-hidden="true" />
        <span className="section-heading__line" aria-hidden="true" />
      </div>

      <div className="settings-tabs" role="tablist" aria-label="Settings categories">
        {TABS.map((tab, index) => (
          <button
            type="button"
            key={tab.id}
            role="tab"
            id={`settings-tab-${tab.id}`}
            aria-controls="settings-panel-content"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={activeTab === tab.id ? 'is-active' : ''}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
              event.preventDefault();
              event.stopPropagation();
              moveTab(index, event.key === 'ArrowRight' ? 1 : -1);
            }}
            data-menu-item
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="settings-list"
        role="tabpanel"
        id="settings-panel-content"
        aria-labelledby={`settings-tab-${activeTab}`}
      >
        {activeTab === 'gameplay' && (
          <>
            <RangeRow
              label="MOUSE SENSITIVITY"
              value={settings.mouseSensitivity}
              min={0.1}
              max={1}
              step={0.01}
              displayValue={settings.mouseSensitivity.toFixed(2)}
              onChange={(value) => patch('mouseSensitivity', value)}
            />
            <RangeRow
              label="GAMEPAD SENSITIVITY"
              value={settings.gamepadSensitivity}
              min={0.1}
              max={1}
              step={0.01}
              displayValue={settings.gamepadSensitivity.toFixed(2)}
              onChange={(value) => patch('gamepadSensitivity', value)}
            />
            <RangeRow
              label="GAMEPAD DEADZONE"
              value={settings.gamepadDeadzone}
              min={0.05}
              max={0.35}
              step={0.01}
              displayValue={settings.gamepadDeadzone.toFixed(2)}
              onChange={(value) => patch('gamepadDeadzone', value)}
            />
            <RangeRow
              label="AIM ASSIST"
              value={settings.aimAssist}
              min={0}
              max={1}
              step={0.05}
              displayValue={`${Math.round(settings.aimAssist * 100)}%`}
              onChange={(value) => patch('aimAssist', value)}
            />
            <ToggleRow
              label="INVERT VERTICAL LOOK"
              value={settings.invertY}
              onChange={(value) => patch('invertY', value)}
            />
            <ToggleRow
              label="HAPTICS"
              value={settings.haptics}
              onChange={(value) => patch('haptics', value)}
            />
          </>
        )}

        {activeTab === 'audio' && (
          <>
            <RangeRow
              label="MASTER VOLUME"
              value={settings.masterVolume}
              min={0}
              max={1}
              step={0.01}
              displayValue={`${Math.round(settings.masterVolume * 100)}%`}
              onChange={(value) => patch('masterVolume', value)}
            />
            <RangeRow
              label="MUSIC"
              value={settings.musicVolume}
              min={0}
              max={1}
              step={0.01}
              displayValue={`${Math.round(settings.musicVolume * 100)}%`}
              onChange={(value) => patch('musicVolume', value)}
            />
            <RangeRow
              label="EFFECTS"
              value={settings.effectsVolume}
              min={0}
              max={1}
              step={0.01}
              displayValue={`${Math.round(settings.effectsVolume * 100)}%`}
              onChange={(value) => patch('effectsVolume', value)}
            />
            <RangeRow
              label="AMBIENCE"
              value={settings.ambienceVolume}
              min={0}
              max={1}
              step={0.01}
              displayValue={`${Math.round(settings.ambienceVolume * 100)}%`}
              onChange={(value) => patch('ambienceVolume', value)}
            />
          </>
        )}

        {activeTab === 'video' && (
          <>
            <RangeRow
              label="FIELD OF VIEW"
              value={settings.fieldOfView}
              min={60}
              max={100}
              step={1}
              displayValue={`${settings.fieldOfView}°`}
              onChange={(value) => patch('fieldOfView', value)}
            />
            <ChoiceRow
              label="QUALITY"
              value={settings.quality}
              onChange={(value) => patch('quality', value)}
            />
            <RangeRow
              label="CAMERA SHAKE"
              value={settings.cameraShake}
              min={0}
              max={1}
              step={0.05}
              displayValue={`${Math.round(settings.cameraShake * 100)}%`}
              onChange={(value) => patch('cameraShake', value)}
            />
            <ToggleRow
              label="REDUCED FLASHES"
              value={settings.reducedFlashes}
              onChange={(value) => patch('reducedFlashes', value)}
            />
          </>
        )}

        {activeTab === 'accessibility' && (
          <>
            <ToggleRow
              label="CAPTIONS"
              value={settings.captions}
              onChange={(value) => patch('captions', value)}
            />
            <ToggleRow
              label="HIGH-CONTRAST RETICLE"
              value={settings.highContrastReticle}
              onChange={(value) => patch('highContrastReticle', value)}
            />
            <ToggleRow
              label="REDUCED MOTION"
              value={settings.reducedMotion}
              onChange={(value) => patch('reducedMotion', value)}
            />
            <ToggleRow
              label="REDUCED FLASHES"
              value={settings.reducedFlashes}
              onChange={(value) => patch('reducedFlashes', value)}
            />
            <ToggleRow
              label="HAPTICS"
              value={settings.haptics}
              onChange={(value) => patch('haptics', value)}
            />
          </>
        )}
      </div>

      <div className="settings-reset">
        <button type="button" onClick={() => onChange({ ...DEFAULT_SETTINGS })} data-menu-item>
          RESET DEFAULTS
        </button>
      </div>

      {mode === 'pause' ? (
        <div className="pause-actions">
          <MenuButton onClick={() => onResume?.()} primary autoFocus>
            RESUME
          </MenuButton>
          <MenuButton onClick={() => onRestart?.()}>RESTART MISSION</MenuButton>
          <MenuButton onClick={() => onReturnToCampaign?.()}>RETURN TO CAMPAIGN</MenuButton>
        </div>
      ) : (
        <div className="panel-actions panel-actions--center">
          <MenuButton onClick={() => onBack?.()} primary autoFocus>
            RETURN
          </MenuButton>
        </div>
      )}
    </Frame>
  );
}

export type { SettingsTab };
