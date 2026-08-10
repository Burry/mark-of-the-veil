import * as THREE from 'three';
import { AudioDirector, HapticsDirector } from './audio';
import { InputController, type InputFrame } from './input/InputController';
import {
  animateMark,
  createFirstPersonWeapon,
  createMark,
  setSealState,
  type MarkRig,
} from './render/ActorFactory';
import { animateArena, applyArenaFlashProfile, createArena, type ArenaRig } from './render/Arena';
import { CinematicRenderPipeline } from './render/CinematicRenderPipeline';
import { EffectsDirector } from './render/EffectsDirector';
import { EncounterDirector, type EncounterEvent } from './systems/EncounterDirector';
import { EnemySystem } from './systems/EnemySystem';
import type { EnemyDamageResult, EnemyKind } from './systems/WorldTypes';
import type {
  GameRuntimePort,
  GameSettings,
  Perspective,
  RunStats,
  RuntimeOptions,
  UpgradeId,
} from './types/GameTypes';
import { SeededRandom } from './utils/SeededRandom';
import { clamp, circlePushOut, damp, dampVector, disposeObject, saturate } from './utils/math';

interface UpgradeTuning {
  damage: number;
  fireInterval: number;
  reloadDuration: number;
  dashDuration: number;
  pulseDuration: number;
  pulseDamage: number;
  pulseRadius: number;
}

const BASE_TUNING: UpgradeTuning = {
  damage: 18,
  fireInterval: 0.105,
  reloadDuration: 1.32,
  dashDuration: 2.8,
  pulseDuration: 8.5,
  pulseDamage: 48,
  pulseRadius: 11.5,
};

const MAGAZINE_SIZE = 36;
const PLAYER_RADIUS = 0.72;
const ARENA_RADIUS = 39.5;

export class GameRuntime implements GameRuntimePort {
  private settings: GameSettings;
  private readonly callbacks: RuntimeOptions['callbacks'];
  private readonly seed: number;
  private readonly random: SeededRandom;
  private readonly diagnosticsEnabled =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('diagnostics');
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.06, 130);
  private readonly audio: AudioDirector;
  private readonly haptics: HapticsDirector;
  private renderer: THREE.WebGLRenderer | null = null;
  private renderPipeline: CinematicRenderPipeline | null = null;
  private input: InputController | null = null;
  private arena: ArenaRig | null = null;
  private mark: MarkRig | null = null;
  private firstPersonWeapon: ReturnType<typeof createFirstPersonWeapon> | null = null;
  private effects: EffectsDirector | null = null;
  private enemies: EnemySystem | null = null;
  private encounter: EncounterDirector | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrame = 0;
  private started = false;
  private disposed = false;
  private paused = true;
  private runEnded = false;
  private hasCapturedPointer = false;
  private lastFrameTime = 0;
  private worldTime = 0;
  private runTime = 0;
  private snapshotTime = 0;
  private fpsTime = 0;
  private fpsFrames = 0;
  private fps = 60;

  private readonly playerPosition = new THREE.Vector3(0, 0, 16.5);
  private readonly playerVelocity = new THREE.Vector3();
  private yaw = 0;
  private pitch = -0.04;
  private perspective: Perspective = 'third';
  private health = 100;
  private maxHealth = 100;
  private shield = 50;
  private maxShield = 50;
  private ammo = MAGAZINE_SIZE;
  private magazineSize = MAGAZINE_SIZE;
  private reserveAmmo = 180;
  private reloadTimer = 0;
  private fireTimer = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  private pulseCooldown = 0;
  private invulnerableTimer = 0;
  private shieldRegenDelay = 0;
  private weaponRecoil = 0;
  private cameraTrauma = 0;
  private trailTimer = 0;
  private hitMarker = 0;
  private damageDirection: number | null = null;
  private damageDirectionTimer = 0;
  private caption: string | null = null;
  private captionTimer = 0;
  private selectedUpgrade: UpgradeId | null = null;
  private tuning: UpgradeTuning = { ...BASE_TUNING };
  private score = 0;
  private multiplier = 1;
  private comboTimer = 0;
  private kills = 0;
  private shotsFired = 0;
  private shotsHit = 0;
  private damageTaken = 0;

  constructor(private readonly options: RuntimeOptions) {
    this.settings = { ...options.settings };
    this.callbacks = options.callbacks;
    this.seed = options.seed ?? Math.floor(Math.random() * 0xffff_ffff);
    this.random = new SeededRandom(this.seed);
    this.audio = new AudioDirector(() => this.settings);
    this.haptics = new HapticsDirector(() => this.settings);
  }

  async start(): Promise<void> {
    if (this.started || this.disposed) return;
    const context = this.options.canvas.getContext('webgl2', {
      alpha: false,
      antialias: this.settings.quality !== 'low',
      depth: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    if (!context) throw new Error('WebGL 2 is required to enter Vespera.');

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.options.canvas,
      context,
      antialias: this.settings.quality !== 'low',
      alpha: false,
      precision: 'highp',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.renderer.shadowMap.enabled = this.settings.quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x05070c, 1);
    this.scene.background = new THREE.Color(0x05070c);
    this.scene.fog = new THREE.FogExp2(0x0a0e15, this.settings.quality === 'low' ? 0.018 : 0.0145);
    this.scene.add(this.camera);

    this.configureRenderer();
    this.callbacks.publish({ loadingProgress: 0.58 });
    void this.audio.start();

    this.effects = new EffectsDirector(
      this.scene,
      this.settings.quality,
      this.settings.reducedFlashes,
    );
    const arena = await createArena(this.scene, this.renderer, this.settings.quality, this.random);
    if (this.disposed) {
      this.disposeArena(arena);
      return;
    }
    this.arena = arena;
    this.callbacks.publish({ loadingProgress: 0.8 });

    this.mark = createMark();
    this.scene.add(this.mark.root);
    this.firstPersonWeapon = createFirstPersonWeapon();
    this.camera.add(this.firstPersonWeapon.root);
    this.enemies = new EnemySystem(this.scene, this.effects, this.options.difficulty, this.random);
    this.encounter = new EncounterDirector(
      this.arena.seals.map((seal) => seal.root.position.clone()),
      this.arena.carrot.position.clone().setY(0),
      this.arena.extraction.root.position.clone().setY(0),
    );
    this.input = new InputController(this.options.canvas, () => this.settings, {
      pointerLockChanged: this.onPointerLockChanged,
      deviceChanged: (inputDevice) => this.callbacks.publish({ inputDevice }),
    });
    this.renderPipeline = new CinematicRenderPipeline(
      this.renderer,
      this.scene,
      this.camera,
      this.settings,
    );

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.options.canvas);
    window.addEventListener('resize', this.resize);
    window.addEventListener('blur', this.onFocusLost);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.options.canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.options.canvas.tabIndex = 0;

    this.started = true;
    this.resetRun();
    this.paused = false;
    this.lastFrameTime = performance.now();
    this.resize();
    this.callbacks.publish({ loadingProgress: 1 });
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  pause(): void {
    if (!this.started || this.paused || this.runEnded) return;
    this.paused = true;
    this.input?.clearHeld();
    this.input?.exitPointerLock();
    this.audio.pause();
    this.haptics.pause();
    this.callbacks.publish({ pointerLocked: false });
  }

  resume(): void {
    if (!this.started || this.runEnded || this.encounter?.phase === 'upgrade') return;
    this.input?.clearHeld();
    this.paused = false;
    this.lastFrameTime = performance.now();
    void this.audio.resume();
    this.haptics.resume();
    this.callbacks.publish({ caption: this.settings.captions ? this.caption : null });
  }

  restart(): void {
    if (!this.started || this.disposed) return;
    this.input?.clearHeld();
    this.resetRun();
    this.paused = false;
    this.lastFrameTime = performance.now();
    void this.audio.resume();
    this.haptics.resume();
  }

  chooseUpgrade(id: UpgradeId): void {
    if (!this.encounter?.beginBoss() || !this.enemies || !this.arena) return;
    this.selectedUpgrade = id;
    this.tuning = { ...BASE_TUNING };
    if (id === 'ace') {
      this.tuning.damage = 23;
      this.tuning.fireInterval = 0.078;
      this.tuning.reloadDuration = 0.92;
      this.magazineSize = 48;
      this.ammo = this.magazineSize;
    } else if (id === 'survivor') {
      this.maxHealth = 140;
      this.health = Math.min(this.maxHealth, this.health + 60);
      this.maxShield = 75;
      this.shield = this.maxShield;
      this.tuning.dashDuration = 2.35;
    } else {
      this.tuning.pulseDamage = 78;
      this.tuning.pulseRadius = 16;
      this.tuning.pulseDuration = 5.8;
      this.pulseCooldown = 0;
    }
    this.arena.extraction.root.visible = false;
    const boss = this.enemies.spawn('regent', new THREE.Vector3(0, 0, -1));
    this.paused = false;
    this.lastFrameTime = performance.now();
    void this.audio.resume().then(() => this.audio.play('boss', boss.rig.root.position));
    this.haptics.resume();
    this.haptics.play('boss', 1, this.input?.getGamepad() ?? undefined);
    this.setCaption('THE HOLLOW REGENT: Crown made hungry.', 3.8);
    this.callbacks.publish({
      selectedUpgrade: id,
      bossName: 'HOLLOW REGENT',
      bossHealth: boss.health,
      bossMaxHealth: boss.maxHealth,
      magazineSize: this.magazineSize,
      ammo: this.ammo,
      maxHealth: this.maxHealth,
      health: this.health,
      maxShield: this.maxShield,
      shield: this.shield,
    });
  }

  updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    this.audio.updateSettings(this.settings);
    this.haptics.updateSettings(this.settings);
    this.effects?.setReducedFlashes(this.settings.reducedFlashes);
    if (this.arena) {
      applyArenaFlashProfile(this.arena, this.worldTime, this.settings.reducedFlashes);
    }
    this.configureRenderer();
    this.renderPipeline?.updateSettings(this.settings);
    this.resize();
  }

  requestPointerLock(): void {
    this.input?.requestPointerLock();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.started = false;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('blur', this.onFocusLost);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.options.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.input?.dispose();
    this.input = null;
    this.enemies?.dispose();
    this.enemies = null;
    this.effects?.dispose();
    this.effects = null;
    this.audio.dispose();
    this.haptics.dispose();
    this.renderPipeline?.dispose();
    this.renderPipeline = null;
    if (this.mark) {
      this.mark.root.removeFromParent();
      disposeObject(this.mark.root);
      this.mark = null;
    }
    if (this.firstPersonWeapon) {
      this.firstPersonWeapon.root.removeFromParent();
      disposeObject(this.firstPersonWeapon.root);
      this.firstPersonWeapon = null;
    }
    if (this.arena) {
      this.disposeArena(this.arena);
      this.arena = null;
    }
    this.scene.environment = null;
    this.renderer?.renderLists.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }

  private disposeArena(arena: ArenaRig): void {
    const sceneLights = arena.root.userData.sceneLights as THREE.Light[] | undefined;
    sceneLights?.forEach((light) => light.removeFromParent());
    arena.root.removeFromParent();
    disposeObject(arena.root);
    arena.surfaceTextures.forEach((texture) => texture.dispose());
    this.scene.environment = null;
  }

  private resetRun(): void {
    if (!this.arena || !this.encounter || !this.effects || !this.mark || !this.firstPersonWeapon)
      return;
    this.random.reset(this.seed);
    this.enemies?.clear();
    this.effects.clear();
    this.encounter.reset();
    this.runEnded = false;
    this.worldTime = 0;
    this.runTime = 0;
    this.snapshotTime = 0;
    this.playerPosition.set(0, 0, 16.5);
    this.playerVelocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = -0.04;
    this.perspective = 'third';
    this.health = 100;
    this.maxHealth = 100;
    this.shield = 50;
    this.maxShield = 50;
    this.magazineSize = MAGAZINE_SIZE;
    this.ammo = MAGAZINE_SIZE;
    this.reserveAmmo = 180;
    this.reloadTimer = 0;
    this.fireTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.pulseCooldown = 0;
    this.invulnerableTimer = 0;
    this.shieldRegenDelay = 0;
    this.weaponRecoil = 0;
    this.cameraTrauma = 0;
    this.hitMarker = 0;
    this.damageDirection = null;
    this.damageDirectionTimer = 0;
    this.selectedUpgrade = null;
    this.tuning = { ...BASE_TUNING };
    this.score = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.damageTaken = 0;
    this.arena.carrot.visible = true;
    this.arena.extraction.root.visible = false;
    this.arena.seals.forEach((seal) => setSealState(seal, 'dormant'));
    this.mark.root.position.copy(this.playerPosition);
    this.mark.root.rotation.set(0, this.yaw, 0);
    this.camera.position.set(1.32, 3.56, 21.75);
    this.camera.quaternion.setFromEuler(_viewEuler.set(this.pitch, this.yaw, 0, 'YXZ'));
    this.firstPersonWeapon.root.visible = false;
    this.setCaption('Mark wakes beneath Vespera. The carrot is still here.', 4.5);
    this.publishSnapshot(true);
  }

  private readonly frame = (now: number): void => {
    if (this.disposed || !this.renderer) return;
    this.animationFrame = requestAnimationFrame(this.frame);
    const delta = Math.min(0.05, Math.max(0, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;
    this.fpsFrames += 1;
    this.fpsTime += delta;
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = 0;
      if (this.diagnosticsEnabled) this.renderer.domElement.dataset.fps = String(this.fps);
    }
    if (this.paused) {
      if (this.renderPipeline) {
        this.renderPipeline.render(delta, true);
      } else {
        this.renderer.render(this.scene, this.camera);
      }
      return;
    }
    this.update(delta);
    if (this.renderPipeline) {
      this.renderPipeline.render(delta, false);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private update(delta: number): void {
    if (
      !this.input ||
      !this.arena ||
      !this.mark ||
      !this.firstPersonWeapon ||
      !this.effects ||
      !this.enemies ||
      !this.encounter
    )
      return;
    const input = this.input.sample(delta);
    this.worldTime += delta;
    this.runTime += delta;
    this.snapshotTime += delta;
    this.fireTimer = Math.max(0, this.fireTimer - delta);
    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    this.pulseCooldown = Math.max(0, this.pulseCooldown - delta);
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - delta);
    this.shieldRegenDelay = Math.max(0, this.shieldRegenDelay - delta);
    this.hitMarker = Math.max(0, this.hitMarker - delta * 4.8);
    this.weaponRecoil = damp(this.weaponRecoil, 0, 18, delta);
    this.cameraTrauma = Math.max(0, this.cameraTrauma - delta * 1.7);
    this.comboTimer = Math.max(0, this.comboTimer - delta);
    if (this.comboTimer <= 0) this.multiplier = damp(this.multiplier, 1, 2.5, delta);
    if (this.damageDirectionTimer > 0) {
      this.damageDirectionTimer -= delta;
      if (this.damageDirectionTimer <= 0) this.damageDirection = null;
    }
    if (this.captionTimer > 0) {
      this.captionTimer -= delta;
      if (this.captionTimer <= 0) this.caption = null;
    }

    if (input.perspectivePressed) this.togglePerspective();
    this.updateLook(input);
    this.updateMovement(input, delta);
    this.updateCamera(input.aimHeld, delta);
    this.updateReload(input, delta);

    this.mark.root.position.copy(this.playerPosition);
    this.mark.root.rotation.y = this.yaw;
    animateMark(
      this.mark,
      this.worldTime,
      this.playerVelocity.length(),
      this.pitch,
      input.fireHeld,
      this.perspective === 'first',
    );
    this.firstPersonWeapon.root.visible = this.perspective === 'first';
    this.firstPersonWeapon.root.position.z = -1.88 + this.weaponRecoil * 0.1;
    this.firstPersonWeapon.root.rotation.x = -0.045 + this.weaponRecoil * 0.05;
    this.scene.updateMatrixWorld(true);

    const presentationBefore = this.encounter.presentation(this.playerPosition);
    if (input.reloadPressed && !presentationBefore.prompt) this.beginReload();
    if (input.fireHeld) this.tryFire(input.aimHeld);
    if (input.pulsePressed) this.tryPulse();

    const enemyFrame = this.enemies.update(
      delta,
      this.worldTime,
      this.playerPosition,
      this.invulnerableTimer > 0,
    );
    enemyFrame.attacks.slice(0, 2).forEach((position) => this.audio.play('enemyAttack', position));
    if (enemyFrame.damage > 0)
      this.applyPlayerDamage(enemyFrame.damage, enemyFrame.damageOrigins[0]);

    const encounterEvents = this.encounter.update(
      delta,
      this.playerPosition,
      this.enemies.regularCount,
      input.interactPressed,
    );
    encounterEvents.forEach((event) => this.handleEncounterEvent(event));
    if (this.runEnded) return;

    if (this.shieldRegenDelay <= 0 && this.shield < this.maxShield)
      this.shield = Math.min(this.maxShield, this.shield + delta * 9.5);
    if (
      this.selectedUpgrade === 'survivor' &&
      this.health < this.maxHealth * 0.72 &&
      this.shieldRegenDelay <= 0
    ) {
      this.health = Math.min(this.maxHealth, this.health + delta * 2.4);
    }

    animateArena(this.arena, this.worldTime, delta, this.settings.reducedFlashes);
    this.effects.update(delta);
    const boss = this.enemies.boss;
    const intensity = boss
      ? 1
      : clamp(
          0.18 + this.enemies.count * 0.075 + (1 - this.health / this.maxHealth) * 0.2,
          0.15,
          0.88,
        );
    this.audio.setIntensity(intensity);
    this.haptics.setIntensity(0.55 + intensity * 0.45);
    this.camera.getWorldDirection(_aimDirection);
    this.audio.setListener(this.camera.position, _aimDirection, _up);
    this.publishSnapshot(this.snapshotTime >= 0.075);
  }

  private updateLook(input: InputFrame): void {
    this.yaw -= input.lookX;
    this.pitch = clamp(this.pitch - input.lookY, -1.12, 1.05);
  }

  private updateMovement(input: InputFrame, delta: number): void {
    _viewQuaternion.setFromEuler(_viewEuler.set(this.pitch, this.yaw, 0, 'YXZ'));
    _forward.set(0, 0, -1).applyQuaternion(_viewQuaternion).setY(0).normalize();
    _right.set(1, 0, 0).applyQuaternion(_viewQuaternion).setY(0).normalize();
    _movement.copy(_forward).multiplyScalar(input.moveY).addScaledVector(_right, input.moveX);
    if (_movement.lengthSq() > 1) _movement.normalize();

    if (input.dashPressed && this.dashCooldown <= 0) {
      if (_movement.lengthSq() < 0.01) _movement.copy(_forward);
      this.playerVelocity.copy(_movement).normalize().multiplyScalar(24);
      this.dashTimer = 0.22;
      this.dashCooldown = this.tuning.dashDuration;
      this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.38);
      this.trailTimer = 0;
      this.effects?.pulse(this.playerPosition, 2.4, 0x9b78ff, 0.34);
      this.audio.play('dash', this.playerPosition);
      this.haptics.play('dash', 0.7, this.input?.getGamepad() ?? undefined);
      this.cameraTrauma = Math.max(this.cameraTrauma, 0.18);
    }
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - delta);
      this.playerVelocity.multiplyScalar(Math.exp(-delta * 1.7));
      this.trailTimer -= delta;
      if (this.trailTimer <= 0) {
        this.trailTimer = 0.045;
        this.effects?.burst(this.playerPosition.clone().setY(1), 0x9576ff, 5, 2, 0.5);
      }
    } else {
      const speed = input.aimHeld ? 4.1 : 6.2;
      _targetVelocity.copy(_movement).multiplyScalar(speed);
      dampVector(
        this.playerVelocity,
        _targetVelocity,
        _movement.lengthSq() > 0.01 ? 12 : 16,
        delta,
      );
    }
    this.playerPosition.addScaledVector(this.playerVelocity, delta);
    const radialDistance = Math.hypot(this.playerPosition.x, this.playerPosition.z);
    if (radialDistance > ARENA_RADIUS) {
      this.playerPosition.x *= ARENA_RADIUS / radialDistance;
      this.playerPosition.z *= ARENA_RADIUS / radialDistance;
    }
    this.arena?.obstacles.forEach((obstacle) =>
      circlePushOut(this.playerPosition, obstacle.center, obstacle.radius + PLAYER_RADIUS),
    );
    this.playerPosition.y = 0;
  }

  private updateCamera(aiming: boolean, delta: number): void {
    _viewQuaternion.setFromEuler(_viewEuler.set(this.pitch, this.yaw, 0, 'YXZ'));
    _forward.set(0, 0, -1).applyQuaternion(_viewQuaternion).normalize();
    _right.set(1, 0, 0).applyQuaternion(_viewQuaternion).normalize();
    _eye.copy(this.playerPosition).add(_eyeHeight);
    if (this.perspective === 'first') {
      _desiredCamera.copy(_eye).addScaledVector(_forward, 0.12);
    } else {
      const distance = aiming ? 4.15 : 5.25;
      _desiredCamera
        .copy(_eye)
        .addScaledVector(_forward, -distance)
        .addScaledVector(_right, aiming ? 1.05 : 1.32);
      _desiredCamera.y += aiming ? 0.12 : 0.42;
    }
    const motionScale = this.settings.reducedMotion ? 0 : this.settings.cameraShake;
    if (this.cameraTrauma > 0 && motionScale > 0) {
      const shake = this.cameraTrauma * this.cameraTrauma * 0.16 * motionScale;
      _desiredCamera.x += Math.sin(this.worldTime * 71) * shake;
      _desiredCamera.y += Math.sin(this.worldTime * 93 + 1.7) * shake;
      _desiredCamera.z += Math.cos(this.worldTime * 83) * shake;
    }
    this.camera.position.lerp(
      _desiredCamera,
      1 - Math.exp(-delta * (this.perspective === 'first' ? 24 : 13)),
    );
    this.camera.quaternion.copy(_viewQuaternion);
    const perspectiveOffset = this.perspective === 'first' ? 7 : -5;
    const targetFov = clamp(
      this.settings.fieldOfView + perspectiveOffset - (aiming ? 10 : 0),
      48,
      94,
    );
    this.camera.fov = damp(this.camera.fov, targetFov, 10, delta);
    this.camera.updateProjectionMatrix();
  }

  private updateReload(input: InputFrame, delta: number): void {
    if (this.reloadTimer <= 0) return;
    this.reloadTimer = Math.max(0, this.reloadTimer - delta);
    this.firstPersonWeapon?.root.rotateZ(Math.sin(this.worldTime * 13) * delta * 0.12);
    if (this.reloadTimer > 0) return;
    const needed = this.magazineSize - this.ammo;
    const transfer = Math.min(needed, this.reserveAmmo);
    this.ammo += transfer;
    this.reserveAmmo -= transfer;
    if (input.fireHeld) this.fireTimer = 0;
  }

  private beginReload(): void {
    if (this.reloadTimer > 0 || this.ammo >= this.magazineSize || this.reserveAmmo <= 0) return;
    this.reloadTimer = this.tuning.reloadDuration;
    this.audio.play('reload', this.playerPosition);
    this.haptics.play('reload', 0.35, this.input?.getGamepad() ?? undefined);
  }

  private tryFire(aiming: boolean): void {
    if (
      !this.enemies ||
      !this.effects ||
      !this.mark ||
      !this.firstPersonWeapon ||
      this.fireTimer > 0 ||
      this.reloadTimer > 0
    )
      return;
    if (this.ammo <= 0) {
      this.beginReload();
      return;
    }
    this.fireTimer = this.tuning.fireInterval;
    this.ammo -= 1;
    this.shotsFired += 1;
    this.weaponRecoil = Math.min(1, this.weaponRecoil + 0.5);
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.035);
    this.camera.getWorldDirection(_aimDirection).normalize();
    const muzzle = this.perspective === 'first' ? this.firstPersonWeapon.muzzle : this.mark.muzzle;
    muzzle.getWorldPosition(_muzzlePosition);
    const hit = this.enemies.acquireHit(
      this.camera.position,
      _aimDirection,
      this.settings.aimAssist * (aiming ? 1.3 : 0.75),
    );
    _shotEnd.copy(this.camera.position).addScaledVector(_aimDirection, 88);
    if (hit) {
      _shotEnd.copy(hit.point);
      this.shotsHit += 1;
      this.hitMarker = 1;
      const result = this.enemies.damage(hit.enemy, this.tuning.damage, hit.critical);
      this.score += Math.round((hit.critical ? 36 : 20) * this.multiplier);
      this.comboTimer = 3.5;
      this.multiplier = Math.min(4, this.multiplier + (hit.critical ? 0.08 : 0.035));
      this.audio.play(hit.critical ? 'critical' : 'hit', hit.point);
      this.haptics.play(
        hit.critical ? 'critical' : 'hit',
        hit.critical ? 0.7 : 0.35,
        this.input?.getGamepad() ?? undefined,
      );
      if (result.killed) this.recordKill(result);
    } else {
      this.effects.burst(_shotEnd, 0x8b77cb, 3, 1.5, 0);
    }
    this.effects.tracer(_muzzlePosition, _shotEnd, 0xbca8ff);
    this.effects.muzzle(_muzzlePosition, _aimDirection);
    this.audio.play('shot', _muzzlePosition);
    this.haptics.play('shot', 0.32, this.input?.getGamepad() ?? undefined);
    if (this.ammo <= 0) this.beginReload();
  }

  private tryPulse(): void {
    if (!this.enemies || !this.effects || this.pulseCooldown > 0) return;
    this.pulseCooldown = this.tuning.pulseDuration;
    const center = this.playerPosition.clone().setY(0.25);
    this.effects.pulse(center, this.tuning.pulseRadius, 0xa17fff, 0.82);
    this.effects.burst(center.clone().setY(1.4), 0xb99aff, 54, 8, 3);
    const results = this.enemies.pulse(center, this.tuning.pulseRadius, this.tuning.pulseDamage);
    results.forEach((result) => {
      this.score += Math.round(14 * this.multiplier);
      if (result.killed) this.recordKill(result);
    });
    this.cameraTrauma = Math.max(this.cameraTrauma, 0.28);
    this.audio.play('pulse', center);
    this.haptics.play('pulse', 1, this.input?.getGamepad() ?? undefined);
    this.setCaption('STORMHORN: Veil resonance discharged.', 1.7);
  }

  private recordKill(result: EnemyDamageResult): void {
    this.kills += 1;
    const killValue: Record<EnemyKind, number> = {
      chainling: 110,
      needlewing: 175,
      heavy: 450,
      regent: 2_800,
    };
    this.score += Math.round(killValue[result.kind] * this.multiplier);
    this.multiplier = Math.min(4, this.multiplier + (result.kind === 'heavy' ? 0.35 : 0.18));
    this.comboTimer = 4.5;
    this.reserveAmmo = Math.min(
      240,
      this.reserveAmmo + (result.kind === 'heavy' ? 20 : result.kind === 'regent' ? 0 : 7),
    );
    this.audio.play('enemyDeath', result.position);
    this.haptics.play(
      'enemyDeath',
      result.kind === 'heavy' ? 0.7 : 0.4,
      this.input?.getGamepad() ?? undefined,
    );
    if (result.bossKilled) this.onBossDefeated();
  }

  private applyPlayerDamage(amount: number, origin?: THREE.Vector3): void {
    if (this.runEnded || amount <= 0) return;
    this.invulnerableTimer = 0.28;
    this.shieldRegenDelay = 4.2;
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    const healthDamage = Math.max(0, amount - absorbed);
    this.health = Math.max(0, this.health - healthDamage);
    this.damageTaken += amount;
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.34);
    if (origin) {
      const bearing = Math.atan2(
        origin.x - this.playerPosition.x,
        -(origin.z - this.playerPosition.z),
      );
      const relative = Math.atan2(Math.sin(bearing + this.yaw), Math.cos(bearing + this.yaw));
      this.damageDirection = THREE.MathUtils.radToDeg(relative);
      this.damageDirectionTimer = 0.85;
    }
    this.audio.play('playerDamage', this.playerPosition);
    this.haptics.play(
      'playerDamage',
      saturate(amount / 30 + 0.25),
      this.input?.getGamepad() ?? undefined,
    );
    this.setCaption(this.shield > 0 ? 'Ward lattice taking fire.' : 'Armor breached.', 1.35);
    if (this.health <= 0) this.endRun(false);
  }

  private handleEncounterEvent(event: EncounterEvent): void {
    if (!this.arena || !this.enemies || !this.encounter || !this.effects) return;
    if (event.type === 'carrot') {
      this.arena.carrot.visible = false;
      setSealState(this.arena.seals[0], 'active');
      this.score += 250;
      this.audio.play('ui', this.playerPosition);
      this.haptics.play('ui', 0.42, this.input?.getGamepad() ?? undefined);
      this.setCaption('“Never doubted you, little orange copilot.”', 3.2);
    } else if (event.type === 'wave') {
      const seal = this.arena.seals[event.index];
      setSealState(seal, 'active');
      this.enemies.spawnWave(event.enemies, seal.root.position, 7.5);
      this.effects.pulse(seal.root.position, 8.5, 0xff5d36, 0.8);
      this.audio.play('seal', seal.root.position);
      const enemyName =
        event.index === 0 ? 'CHAINLINGS' : event.index === 1 ? 'NEEDLEWINGS' : 'CROWN HEAVIES';
      this.setCaption(`${enemyName} breach the seal lattice.`, 2.8);
    } else if (event.type === 'seal') {
      setSealState(this.arena.seals[event.index], 'broken');
      this.score += Math.round(800 * this.multiplier);
      this.shield = this.maxShield;
      this.health = Math.min(this.maxHealth, this.health + 18);
      this.audio.play('seal', this.arena.seals[event.index].root.position);
      this.haptics.play('seal', 0.85, this.input?.getGamepad() ?? undefined);
      this.effects.pulse(this.arena.seals[event.index].root.position, 14, 0xffc29d, 1.1);
      if (this.arena.seals[event.index + 1])
        setSealState(this.arena.seals[event.index + 1], 'active');
      this.setCaption(`VEIL SEAL ${event.index + 1} BROKEN`, 2.5);
    } else if (event.type === 'upgrade') {
      this.paused = true;
      this.input?.exitPointerLock();
      this.audio.setIntensity(0.38);
      this.haptics.pause();
      this.publishSnapshot(true);
      this.callbacks.requestUpgrade();
    } else if (event.type === 'victory') {
      this.endRun(true);
    }
  }

  private onBossDefeated(): void {
    if (!this.encounter || !this.arena || !this.enemies || !this.effects) return;
    this.encounter.bossDefeated();
    this.enemies.clear();
    this.arena.extraction.root.visible = true;
    this.effects.pulse(this.arena.extraction.root.position, 16, 0x92ddff, 1.4);
    this.audio.play('boss', this.playerPosition);
    this.haptics.play('boss', 1, this.input?.getGamepad() ?? undefined);
    this.setCaption('REGENT DOWN. Its root channel is exposed. Enter the Choir!', 3.2);
    this.callbacks.publish({ bossName: null, bossHealth: 0, bossMaxHealth: 0 });
  }

  private togglePerspective(): void {
    this.perspective = this.perspective === 'third' ? 'first' : 'third';
    this.audio.play('ui');
    this.haptics.play('ui', 0.25, this.input?.getGamepad() ?? undefined);
    this.callbacks.publish({ perspective: this.perspective });
  }

  private endRun(victory: boolean): void {
    if (this.runEnded || !this.encounter) return;
    this.runEnded = true;
    this.encounter.end();
    this.paused = true;
    this.input?.exitPointerLock();
    if (victory) this.score += Math.round(2_000 * this.multiplier);
    const stats = this.buildRunStats(victory);
    this.audio.setIntensity(victory ? 0.35 : 0.08);
    this.audio.play(victory ? 'victory' : 'defeat', this.playerPosition);
    this.haptics.play(victory ? 'victory' : 'defeat', 1, this.input?.getGamepad() ?? undefined);
    this.callbacks.publish({ runStats: stats, pointerLocked: false });
    this.callbacks.runEnded(stats, victory);
  }

  private buildRunStats(victory: boolean): RunStats {
    const accuracy = this.shotsFired > 0 ? this.shotsHit / this.shotsFired : 0;
    let rank: RunStats['rank'] = 'C';
    if (victory && this.score >= 9_500 && accuracy >= 0.46 && this.damageTaken < 95) rank = 'S';
    else if (victory && this.score >= 7_000 && accuracy >= 0.32) rank = 'A';
    else if (victory && this.score >= 4_800) rank = 'B';
    return {
      score: Math.round(this.score),
      elapsedSeconds: Math.round(this.runTime * 10) / 10,
      kills: this.kills,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      damageTaken: Math.round(this.damageTaken),
      rank,
    };
  }

  private setCaption(caption: string, duration: number): void {
    this.caption = caption;
    this.captionTimer = duration;
    if (this.settings.captions) this.callbacks.publish({ caption });
  }

  private publishSnapshot(force = false): void {
    if (!force || !this.encounter || !this.enemies) return;
    this.snapshotTime = 0;
    const boss = this.enemies.boss;
    const presentation = this.encounter.presentation(this.playerPosition);
    if (this.renderer && this.diagnosticsEnabled) {
      const canvas = this.renderer.domElement;
      canvas.dataset.playerX = this.playerPosition.x.toFixed(2);
      canvas.dataset.playerZ = this.playerPosition.z.toFixed(2);
      canvas.dataset.encounterPhase = this.encounter.phase;
    }
    this.callbacks.publish({
      health: Math.round(this.health * 10) / 10,
      maxHealth: this.maxHealth,
      shield: Math.round(this.shield * 10) / 10,
      maxShield: this.maxShield,
      ammo: this.ammo,
      magazineSize: this.magazineSize,
      reserveAmmo: this.reserveAmmo,
      weaponName: this.selectedUpgrade === 'ace' ? 'SUNLANCE // ACE' : 'SUNLANCE',
      dashCooldown: saturate(this.dashCooldown / this.tuning.dashDuration),
      pulseCooldown: saturate(this.pulseCooldown / this.tuning.pulseDuration),
      perspective: this.perspective,
      objective: presentation.objective,
      objectiveDetail: presentation.detail,
      seals: this.encounter.sealsBroken,
      totalSeals: 3,
      enemiesRemaining:
        this.encounter.phase === 'boss' ? this.enemies.count : this.enemies.regularCount,
      bossName: boss ? 'HOLLOW REGENT' : null,
      bossHealth: boss?.health ?? 0,
      bossMaxHealth: boss?.maxHealth ?? 0,
      score: Math.round(this.score),
      multiplier: Math.round(this.multiplier * 100) / 100,
      hitMarker: this.hitMarker,
      damageDirection: this.damageDirection,
      caption: this.settings.captions ? this.caption : null,
      interactPrompt: presentation.prompt,
      pointerLocked: this.input?.isPointerLocked() ?? false,
      selectedUpgrade: this.selectedUpgrade,
      fps: this.fps,
    });
  }

  private configureRenderer(): void {
    if (!this.renderer) return;
    const cap = this.settings.quality === 'high' ? 2 : this.settings.quality === 'medium' ? 1.5 : 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    this.renderer.shadowMap.enabled = this.settings.quality !== 'low';
    this.renderer.toneMappingExposure = this.settings.reducedFlashes ? 0.84 : 0.96;
  }

  private readonly resize = (): void => {
    if (!this.renderer) return;
    const width = Math.max(1, this.options.canvas.clientWidth || window.innerWidth);
    const height = Math.max(1, this.options.canvas.clientHeight || window.innerHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderPipeline?.setSize(width, height, this.renderer.getPixelRatio());
  };

  private readonly onPointerLockChanged = (locked: boolean): void => {
    this.callbacks.publish({ pointerLocked: locked });
    if (locked) {
      this.hasCapturedPointer = true;
      return;
    }
    if (
      this.hasCapturedPointer &&
      !this.paused &&
      !this.runEnded &&
      this.encounter?.phase !== 'upgrade'
    ) {
      this.pause();
      this.callbacks.requestScreen('paused');
    }
  };

  private readonly onFocusLost = (): void => {
    if (!this.paused && !this.runEnded && this.encounter?.phase !== 'upgrade') {
      this.pause();
      this.callbacks.requestScreen('paused');
    }
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.onFocusLost();
  };

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.pause();
    this.callbacks.publish({ caption: 'The WebGL device was lost. Reload to re-enter Vespera.' });
    this.callbacks.requestScreen('unsupported');
  };
}

const _viewEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _viewQuaternion = new THREE.Quaternion();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _movement = new THREE.Vector3();
const _targetVelocity = new THREE.Vector3();
const _eye = new THREE.Vector3();
const _eyeHeight = new THREE.Vector3(0, 3.14, 0);
const _desiredCamera = new THREE.Vector3();
const _aimDirection = new THREE.Vector3();
const _muzzlePosition = new THREE.Vector3();
const _shotEnd = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
