// Utils
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Vector3,
} from 'three';
import { gsap } from 'gsap';

// Interfaces
import Scene from './scenes/UMTBSceneInterface';
// eslint-disable-next-line import/no-cycle
import UTMBMap from './UTMBMap';

class UTMBSceneManager {
  private scenes: Array<Scene>;
  private lastScene: number | null = null;
  private currentScene: number | null = null;
  private currentlySwitchingScenes: boolean = false;
  private map: UTMBMap;
  private trace: Line;
  private cameraPath: CatmullRomCurve3;
  private lineTemp;
  private lastYaw!: number;
  private animationState: { count: number } = {
    count: 0,
  };

  constructor(MapInstance: UTMBMap, trace: Mesh, camera: LineSegments, scenes: Array<Scene>) {
    this.map = MapInstance;
    this.scenes = scenes;

    const { line } = UTMBSceneManager.buildCurveFromTrace(trace);
    this.trace = line;
    this.trace.geometry.setDrawRange(0, 0);

    const { curve, line: lineTemp } = UTMBSceneManager.buildCurveFromTrace(camera, true);
    this.cameraPath = curve;
    this.lineTemp = lineTemp;
    // this.lineTemp.geometry.setDrawRange(0, 0);

    this.map.camera.position.copy(this.cameraPath.getPointAt(0));
    this.map.camera.lookAt(this.map.character.position);
    this.map.scene.add(this.trace);
    // this.map.scene.add(this.lineTemp);

    this.events();
  }

  static buildCurveFromTrace(
    traceMesh: Mesh | LineSegments,
    reverse: boolean = false,
  ): {
    curve: CatmullRomCurve3;
    line: Line;
  } {
    let geometry = traceMesh.geometry as BufferGeometry;

    // Convert to non-indexed if necessary
    if (geometry.index) {
      geometry = geometry.toNonIndexed();
    }

    // Extract points in world space
    const posAttr = geometry.getAttribute('position') as BufferAttribute;
    const points: Vector3[] = [];

    const temp = new Vector3();
    for (let i = 0; i < posAttr.count; i += 1) {
      temp.fromBufferAttribute(posAttr, i);
      traceMesh.localToWorld(temp); // apply mesh transform
      points.push(temp.clone());
    }

    if (reverse) {
      points.reverse();
    }

    // Build CatmullRomCurve3
    const curve = new CatmullRomCurve3(points, false); // false = not closed

    // Build a line for visualization
    const curvePoints = curve.getPoints(points.length - 1); // same resolution as original mesh
    const curveGeometry = new BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new LineBasicMaterial({ color: 0xff0000 });
    const line = new Line(curveGeometry, curveMaterial);

    // Return both so you can add the line to the scene and store the curve for animation
    return { curve, line };
  }

  events(): void {
    // @todo : faire au scroll et utiliser le currentlySwitchScenes, c'est juste pour tester là
    const btnBack = document.querySelector('.js-btn-back');
    const btnNext = document.querySelector('.js-btn-next');

    btnBack?.addEventListener('click', (e) => {
      e.preventDefault();

      if (this.currentScene !== null) {
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

      if (this.currentScene === null) {
        this.currentScene = 0;
        btnBack?.removeAttribute('disabled');

        this.processStep();
      } else if (this.currentScene <= this.scenes.length - 1) {
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
    if (this.currentScene === null) {
      this.currentScene = 0;
    }

    if (!this.scenes[this.currentScene]) return;

    if (this.lastScene !== null && this.scenes[this.lastScene]) {
      this.scenes[this.lastScene].onExit();
    }
    const totalTrace: number = this.trace.geometry.index
      ? this.trace.geometry.index.count
      : this.trace.geometry.attributes.position.count;
    const totalPath: number = this.lineTemp.geometry.index
      ? this.lineTemp.geometry.index.count
      : this.lineTemp.geometry.attributes.position.count;

    gsap.to(this.animationState, {
      count: this.scenes[this.currentScene].pathPosition,
      duration: 1,
      ease: 'sine.inOut',
      onUpdate: () => {
        const { count } = this.animationState;
        const percentOfPOath: number = Math.floor(totalPath * (count * 0.01));
        // Animation de la caméra
        this.lineTemp.geometry.setDrawRange(0, percentOfPOath);
        this.map.camera.position.copy(this.cameraPath.getPointAt(count / 100));
        this.map.camera.lookAt(this.map.character.position);

        // Animation du tracé
        const percentOfTrace: number = Math.floor(totalTrace * (count * 0.01));
        this.trace.geometry.setDrawRange(0, percentOfTrace);

        const posAttr = (this.trace.geometry as BufferGeometry).attributes
          .position as BufferAttribute;
        const vertexIndex = Math.max(Math.floor(percentOfTrace) - 1, 0);
        const frac = percentOfTrace - Math.floor(percentOfTrace);

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
          const isLastSegment = vertexIndex >= totalTrace - 1;

          // --- Apply threshold only if NOT last segment ---
          const threshold = 2.5;
          if (isLastSegment || Math.abs(delta) > threshold) {
            this.map.character.rotation.y = currentYaw;
            this.lastYaw = currentYaw;
          }
        }
      },
      onComplete: () => {
        this.scenes[this.currentScene ?? 0].onEnter();
      },
    });
  }
}

export default UTMBSceneManager;
