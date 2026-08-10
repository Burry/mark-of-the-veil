import type { CSSProperties } from 'react';
import type { GameSettings, GameSnapshot } from '../game/types/GameTypes';
import {
  CarrotIcon,
  DashIcon,
  OverdriveIcon,
  PulseIcon,
  ResolveIcon,
  ShieldIcon,
  SigilIcon,
} from './Icons';
import { Keycap } from './Frame';

interface HUDProps {
  snapshot: GameSnapshot;
  settings: GameSettings;
  muted?: boolean;
}

function clampPercent(value: number, maximum: number): number {
  if (maximum <= 0) return 0;
  return Math.min(100, Math.max(0, (value / maximum) * 100));
}

interface MeterProps {
  label: string;
  value: number;
  maximum: number;
  kind: 'shield' | 'health';
  icon: React.ReactNode;
}

function Meter({ label, value, maximum, kind, icon }: MeterProps) {
  const percentage = clampPercent(value, maximum);
  return (
    <div className={`vital-meter vital-meter--${kind}`}>
      <span className="vital-meter__icon">{icon}</span>
      <span className="sr-only">{label}</span>
      <div
        className="vital-meter__track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={maximum}
        aria-valuenow={Math.ceil(value)}
      >
        <span className="vital-meter__fill" style={{ width: `${percentage}%` }} />
        <span className="vital-meter__segments" aria-hidden="true" />
      </div>
      <strong>{Math.max(0, Math.ceil(value))}</strong>
    </div>
  );
}

interface AbilityProps {
  label: string;
  input?: string;
  cooldown: number;
  icon: React.ReactNode;
  active?: boolean;
}

function Ability({ label, input, cooldown, icon, active = false }: AbilityProps) {
  const cooldownPercentage = Math.min(100, Math.max(0, cooldown * 100));
  const ready = cooldown <= 0.03;
  return (
    <div className={`ability ${ready ? 'is-ready' : 'is-cooling'} ${active ? 'is-active' : ''}`}>
      <div className="ability__crest">
        {icon}
        <span
          className="ability__cooldown"
          style={{ '--cooldown': `${cooldownPercentage}%` } as CSSProperties}
          aria-hidden="true"
        />
        {!ready && <strong>{Math.ceil(cooldown * 100)}%</strong>}
      </div>
      <span className="ability__label">{label}</span>
      {input ? <Keycap>{input}</Keycap> : <span className="ability__passive">PASSIVE</span>}
    </div>
  );
}

export function HUD({ snapshot, settings, muted = false }: HUDProps) {
  const perspectiveLabel = snapshot.perspective === 'third' ? 'THIRD' : 'FIRST';
  const cameraInput = snapshot.inputDevice === 'gamepad' ? 'Y' : 'V';
  const dashInput = snapshot.inputDevice === 'gamepad' ? 'A' : 'SPACE';
  const pulseInput = snapshot.inputDevice === 'gamepad' ? 'LB' : 'Q';

  return (
    <div className={`hud ${muted ? 'hud--muted' : ''}`} aria-label="Gameplay status">
      <div className="hud-etched-border" aria-hidden="true" />

      <section className="objective-panel" aria-live="polite">
        <SigilIcon />
        <div>
          <h2>{snapshot.objective}</h2>
          <p>{snapshot.objectiveDetail}</p>
          {snapshot.totalSeals > 0 && (
            <span className="seal-progress">
              {Array.from({ length: snapshot.totalSeals }, (_, index) => (
                <i className={index < snapshot.seals ? 'is-open' : ''} key={index} />
              ))}
              {snapshot.seals} / {snapshot.totalSeals} SEALS
            </span>
          )}
        </div>
      </section>

      <section className="encounter-panel">
        {snapshot.bossName && snapshot.bossMaxHealth > 0 ? (
          <>
            <div className="boss-label">
              <span>{snapshot.bossName}</span>
              <strong>THE CROWN&apos;S LAST WITNESS</strong>
            </div>
            <div
              className="boss-meter"
              role="meter"
              aria-label={`${snapshot.bossName} health`}
              aria-valuemin={0}
              aria-valuemax={snapshot.bossMaxHealth}
              aria-valuenow={snapshot.bossHealth}
            >
              <span
                className="boss-meter__fill"
                style={{ width: `${clampPercent(snapshot.bossHealth, snapshot.bossMaxHealth)}%` }}
              />
            </div>
          </>
        ) : (
          <div className="combat-tally">
            <span>{snapshot.enemiesRemaining} HOSTILES</span>
            <span>
              SCORE {snapshot.score.toLocaleString()} · ×{snapshot.multiplier.toFixed(1)}
            </span>
          </div>
        )}
      </section>

      <section className="player-vitals">
        <Meter
          label="Shield"
          value={snapshot.shield}
          maximum={snapshot.maxShield}
          kind="shield"
          icon={<ShieldIcon />}
        />
        <Meter
          label="Health"
          value={snapshot.health}
          maximum={snapshot.maxHealth}
          kind="health"
          icon={<ResolveIcon />}
        />
      </section>

      <section className="ability-bar" aria-label="Abilities">
        <Ability
          label="HOOF DASH"
          input={dashInput}
          cooldown={snapshot.dashCooldown}
          icon={<DashIcon />}
          active={snapshot.selectedUpgrade === 'ace'}
        />
        <Ability
          label="HORN PULSE"
          input={pulseInput}
          cooldown={snapshot.pulseCooldown}
          icon={<PulseIcon />}
          active={snapshot.selectedUpgrade === 'stormhorn'}
        />
        <Ability
          label="SUNLANCE CARBINE"
          cooldown={0}
          icon={<OverdriveIcon />}
          active={snapshot.multiplier >= 2}
        />
      </section>

      <section className="ammo-panel" aria-label="Weapon and ammunition">
        <div className="weapon-carrot" aria-hidden="true">
          <CarrotIcon />
        </div>
        <div className="ammo-count">
          <strong>{snapshot.ammo}</strong>
          <span>/ {snapshot.reserveAmmo}</span>
        </div>
        <span className="weapon-name">{snapshot.weaponName}</span>
        <div className="weapon-silhouette" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </section>

      <div
        className={`reticle ${settings.highContrastReticle ? 'reticle--contrast' : ''} ${snapshot.hitMarker > 0 ? 'is-hit' : ''}`}
        aria-hidden="true"
      >
        <i />
        <i />
        <i />
        <i />
        <span />
      </div>

      {snapshot.damageDirection !== null && (
        <div
          className="damage-direction"
          style={{ transform: `translateX(-50%) rotate(${snapshot.damageDirection}deg)` }}
          aria-hidden="true"
        >
          <i />
        </div>
      )}

      <div className="camera-hint">
        <span>{perspectiveLabel}</span>
        <span>
          <Keycap>{cameraInput}</Keycap> SWITCH VIEW
        </span>
      </div>

      {snapshot.interactPrompt && (
        <div className="interact-prompt" role="status">
          <Keycap>{snapshot.inputDevice === 'gamepad' ? 'X' : 'E'}</Keycap>
          <span>{snapshot.interactPrompt}</span>
        </div>
      )}

      {settings.captions && snapshot.caption && (
        <div className="caption" role="status" aria-live="assertive">
          {snapshot.caption}
        </div>
      )}

      {snapshot.fps < 45 && <span className="performance-warning">{snapshot.fps} FPS</span>}
    </div>
  );
}
