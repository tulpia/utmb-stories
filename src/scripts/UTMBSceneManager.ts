// Utils
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Line,
  LineBasicMaterial,
  Mesh,
  Vector3,
} from 'three';
import { gsap } from 'gsap';

// Interfaces
import Scene from './scenes/UMTBSceneInterface';
import UTMBMap from './UTMBMap';

interface AnimationStep {
  trace: {
    count: number;
  };
}

class UTMBSceneManager {
  private scenes: Array<Scene>;
  private lastScene: number | null = null;
  private currentScene: number = 0;
  private currentlySwitchingScenes: boolean = false;
  private map: UTMBMap;
  private trace: Line;
  private lastYaw!: number;
  private animationState: AnimationStep = {
    trace: {
      count: 0,
    },
  };

  constructor(MapInstance: UTMBMap, scenes: Array<Scene>) {
    this.map = MapInstance;
    this.scenes = scenes;

    const line = this.buildCurveFromTrace(this.map.tempTrace);
    this.trace = line;
    this.trace.geometry.setDrawRange(0, 0);

    this.map.scene.add(this.trace);

    this.events();
    this.processStep();
  }

  buildCurveFromTrace(traceMesh: Mesh): Line {
    let geometry = traceMesh.geometry as BufferGeometry;

    // Convert to non-indexed if necessary
    if (geometry.index) {
      geometry = geometry.toNonIndexed();
    }

    // Extract points in world space
    const posAttr = geometry.getAttribute('position') as BufferAttribute;
    const points: Vector3[] = [];

    const temp = new Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      temp.fromBufferAttribute(posAttr, i);
      traceMesh.localToWorld(temp); // apply mesh transform
      points.push(temp.clone());
    }

    // Build CatmullRomCurve3
    const curve = new CatmullRomCurve3(points, false); // false = not closed

    // Build a line for visualization
    const curvePoints = curve.getPoints(points.length - 1); // same resolution as original mesh
    const curveGeometry = new BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new LineBasicMaterial({ color: 0xff0000 });
    const line = new Line(curveGeometry, curveMaterial);

    // Return both so you can add the line to the scene and store the curve for animation
    return line;
  }

  events(): void {
    // @todo : faire au scroll et utiliser le currentlySwitchScenes, c'est juste pour tester là
    const btnBack = document.querySelector('.js-btn-back');
    const btnNext = document.querySelector('.js-btn-next');

    btnBack?.addEventListener('click', (e) => {
      e.preventDefault();

      if (this.currentScene) {
        this.currentScene -= 1;

        if (!this.currentScene) {
          btnBack.setAttribute('disabled', 'true');
        } else {
          btnBack.removeAttribute('disabled');
        }
        btnNext?.removeAttribute('disabled');

        this.processStep();
      }
    });

    btnNext?.addEventListener('click', (e) => {
      e.preventDefault();

      if (this.currentScene <= this.scenes.length - 1) {
        this.currentScene += 1;

        if (this.currentScene === this.scenes.length - 1) {
          btnNext.setAttribute('disabled', 'true');
        } else {
          btnNext.removeAttribute('disabled');
        }
        btnBack?.removeAttribute('disabled');

        this.processStep();
      }
    });
  }

  processStep(): void {
    if (!this.scenes[this.currentScene]) return;

    if (this.lastScene !== null && this.scenes[this.lastScene]) {
      this.scenes[this.lastScene].onExit();
    }

    const total: number = this.trace.geometry.index
      ? this.trace.geometry.index.count
      : this.trace.geometry.attributes.position.count;
    const totalOfScene: number = Math.floor(
      total * (this.scenes[this.currentScene].pathPosition * 0.01),
    );

    gsap.to(this.animationState.trace, {
      count: totalOfScene,
      duration: 1,
      ease: 'sine.inOut',
      onUpdate: () => {
        const { count } = this.animationState.trace;
        this.trace.geometry.setDrawRange(0, count);

        const posAttr = (this.trace.geometry as BufferGeometry).attributes
          .position as BufferAttribute;
        const vertexIndex = Math.max(Math.floor(count) - 1, 0);
        const frac = count - Math.floor(count);

        const v1 = new Vector3().fromBufferAttribute(posAttr, vertexIndex);
        const v2 = new Vector3().fromBufferAttribute(
          posAttr,
          Math.min(vertexIndex + 1, posAttr.count - 1),
        );

        this.trace.localToWorld(v1);
        this.trace.localToWorld(v2);

        v1.lerp(v2, frac);
        this.map.character.position.copy(v1);

        // --- Compute yaw ---
        const direction = v2.clone().sub(v1);
        direction.y = 0;
        direction.normalize();

        if (direction.lengthSq() > 0) {
          const currentYaw = Math.atan2(direction.x, direction.z);
          if (!this.lastYaw) {
            this.lastYaw = currentYaw;
          }

          // Normalize yaw difference to avoid 360° jumps
          let delta = currentYaw - this.lastYaw;
          if (delta > Math.PI) delta -= 2 * Math.PI;
          if (delta < -Math.PI) delta += 2 * Math.PI;

          // --- Check if this is the final segment ---
          const isLastSegment = vertexIndex >= totalOfScene - 1;

          console.log(isLastSegment);

          // --- Apply threshold only if NOT last segment ---
          const threshold = 2.5;
          if (isLastSegment || Math.abs(delta) > threshold) {
            this.map.character.rotation.y = currentYaw;
            this.lastYaw = currentYaw;
          }
        }
      },
      onComplete: () => {
        this.scenes[this.currentScene].onEnter();
      },
    });
  }
}

export default UTMBSceneManager;
