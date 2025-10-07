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
import UTMBScroller from './UTMBScroller';

class UTMBSceneManager {
  private scenes: Array<Scene>;
  private map: UTMBMap;
  private scroller: UTMBScroller;
  private trace: Line;
  private cameraPath: CatmullRomCurve3;
  private lastYaw!: number;

  private lastActiveScene!: Scene;
  private currentActiveScene!: Scene;

  constructor(MapInstance: UTMBMap, trace: Mesh, camera: LineSegments, scenes: Array<Scene>) {
    this.map = MapInstance;
    this.scenes = scenes;

    const { line } = UTMBSceneManager.buildCurveFromTrace(trace);
    this.trace = line;
    this.trace.geometry.setDrawRange(0, 0);

    const { curve, line: lineTemp } = UTMBSceneManager.buildCurveFromTrace(camera, true);
    this.cameraPath = curve;
    this.lineTemp = lineTemp;

    this.scroller = new UTMBScroller(this.map.renderer.domElement, this.scenes);
    this.update = this.update.bind(this);
    requestAnimationFrame(this.update);

    // this.map.camera.position.copy(this.cameraPath.getPointAt(0));
    // this.map.camera.lookAt(this.map.character.position);
    this.map.scene.add(this.trace);
  }

  private update() {
    requestAnimationFrame(this.update);

    // Access fakeScroll from handler
    const scroll = this.scroller.getScrollPercent();
    const correspondingScene = this.scenes.find(
      (scene) => scroll >= scene.range.start && scroll <= scene.range.end,
    );

    this.drawTrace(scroll);
    this.followCamera(scroll);

    if (correspondingScene && this.currentActiveScene !== correspondingScene) {
      if (this.lastActiveScene) {
        this.lastActiveScene.onExit();
        this.lastActiveScene = this.currentActiveScene;
      }
      this.currentActiveScene = correspondingScene;

      this.currentActiveScene.onEnter();
    }
  }

  private drawTrace(scroll: number): void {
    const totalTrace: number = this.trace.geometry.index
      ? this.trace.geometry.index.count
      : this.trace.geometry.attributes.position.count;
    const percentOfTrace: number = Math.floor(totalTrace * (scroll * 0.01));

    this.trace.geometry.setDrawRange(0, percentOfTrace);

    const posAttr = (this.trace.geometry as BufferGeometry).attributes.position as BufferAttribute;
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
  }

  private followCamera(scroll: number): void {
    // Animation de la caméra
    this.map.camera.position.copy(this.cameraPath.getPointAt(scroll / 100));
    this.map.camera.lookAt(this.map.character.position);
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
}

export default UTMBSceneManager;
