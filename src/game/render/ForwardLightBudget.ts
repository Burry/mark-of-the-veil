import * as THREE from 'three';

interface ManagedPointLight {
  light: THREE.PointLight;
  baseVisible: boolean;
  selected: boolean;
}

export interface ForwardLightBudgetDiagnostics {
  active: number;
  eligible: number;
  total: number;
}

/**
 * Keeps Three's forward PBR shader from evaluating every cathedral practical
 * on every fragment. The nearest/influential lights remain active, with a
 * small selection hysteresis to prevent visible popping while the camera
 * moves between bays.
 */
export class ForwardLightBudget {
  private readonly managed = new Map<string, ManagedPointLight>();
  private readonly worldPosition = new THREE.Vector3();
  private refreshTimer = 0;
  private selectionTimer = 0;
  private suspended = false;
  private diagnosticsValue: ForwardLightBudgetDiagnostics = {
    active: 0,
    eligible: 0,
    total: 0,
  };

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
  ) {
    this.refreshLights();
  }

  update(deltaSeconds: number, maxLights: number): void {
    this.refreshTimer -= deltaSeconds;
    this.selectionTimer -= deltaSeconds;
    if (this.refreshTimer <= 0) {
      this.refreshTimer = 2;
      this.refreshLights();
    }
    if (this.suspended || this.selectionTimer > 0) return;
    this.selectionTimer = 0.2;
    this.selectLights(Math.max(0, Math.floor(maxLights)));
  }

  setSuspended(suspended: boolean): void {
    if (this.suspended === suspended) return;
    this.suspended = suspended;
    if (suspended) {
      this.managed.forEach((entry) => {
        entry.light.visible = entry.baseVisible;
      });
      this.diagnosticsValue = {
        active: this.countWorldVisibleLights(),
        eligible: this.countEligibleLights(),
        total: this.managed.size,
      };
      return;
    }
    this.selectionTimer = 0;
  }

  diagnostics(): ForwardLightBudgetDiagnostics {
    return this.diagnosticsValue;
  }

  dispose(): void {
    this.managed.forEach((entry) => {
      entry.light.visible = entry.baseVisible;
    });
    this.managed.clear();
  }

  private refreshLights(): void {
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.PointLight) || this.managed.has(object.uuid)) return;
      this.managed.set(object.uuid, {
        light: object,
        baseVisible: object.visible,
        selected: false,
      });
    });
    this.diagnosticsValue.total = this.managed.size;
  }

  private selectLights(limit: number): void {
    const candidates = [...this.managed.values()]
      .filter((entry) => entry.baseVisible && ancestorsAreVisible(entry.light.parent))
      .map((entry) => {
        entry.light.getWorldPosition(this.worldPosition);
        const distance = this.camera.position.distanceTo(this.worldPosition);
        const range = entry.light.distance > 0 ? entry.light.distance : 60;
        const reach = Math.max(1, range + 4);
        const proximity = THREE.MathUtils.clamp(1 - distance / reach, 0, 1);
        const energy = Math.log2(1 + Math.max(0, entry.light.intensity));
        // Keep the currently selected set stable until a replacement is
        // meaningfully more influential.
        const hysteresis = entry.selected ? 0.35 : 0;
        return { entry, score: energy * (0.18 + proximity * proximity) + hysteresis };
      })
      .sort((a, b) => b.score - a.score);

    const selected = new Set(candidates.slice(0, limit).map(({ entry }) => entry.light.uuid));
    this.managed.forEach((entry) => {
      entry.selected = selected.has(entry.light.uuid);
      entry.light.visible = entry.baseVisible && entry.selected;
    });
    this.diagnosticsValue = {
      active: Math.min(limit, candidates.length),
      eligible: candidates.length,
      total: this.managed.size,
    };
  }

  private countWorldVisibleLights(): number {
    let count = 0;
    this.managed.forEach((entry) => {
      if (entry.light.visible && ancestorsAreVisible(entry.light.parent)) count += 1;
    });
    return count;
  }

  private countEligibleLights(): number {
    let count = 0;
    this.managed.forEach((entry) => {
      if (entry.baseVisible && ancestorsAreVisible(entry.light.parent)) count += 1;
    });
    return count;
  }
}

function ancestorsAreVisible(object: THREE.Object3D | null): boolean {
  let current = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  return true;
}
