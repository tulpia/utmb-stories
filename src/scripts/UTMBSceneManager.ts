// Utils
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Vector3,
} from 'three';

// Interfaces
import Scene from './scenes/UMTBSceneInterface';

// Classes
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

    const { curve } = UTMBSceneManager.buildCurveFromTrace(camera, true);
    this.cameraPath = curve;

    this.scroller = new UTMBScroller(this.map.renderer.domElement, this.scenes);
    this.update = this.update.bind(this);

    this.map.scene.add(this.trace);
  }

  public update() {
    this.scroller.update();

    // Access fakeScroll from handler
    const scroll = this.scroller.getScrollPercent();
    const correspondingScene = this.scenes.find(
      (scene) => scroll >= scene.range.start && scroll <= scene.range.end,
    );

    this.drawTrace(scroll);
    this.followCamera(scroll);
    this.animateLights(scroll);

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
    this.map.character.group.position.copy(v1);

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
      const threshold = 5;
      if (isLastSegment || Math.abs(delta) > threshold) {
        this.map.character.group.rotation.y = currentYaw;
        this.lastYaw = currentYaw;
      }
    }
  }

  private followCamera(scroll: number): void {
    // Animation de la caméra
    const position: Vector3 = this.cameraPath.getPointAt(scroll / 100);

    this.map.camera.setLookAt(
      position.x,
      position.y,
      position.z,
      this.map.character.group.position.x,
      this.map.character.group.position.y,
      this.map.character.group.position.z,
      true,
    );
  }

  /**
   * Cycle jour/nuit
   * @param scroll
   */
  private animateLights(scroll: number): void {
    this.map.character.setLightIntensity(scroll);

    const factor: number = 1 - 1.2 * Math.exp(-((scroll - 50) ** 2) / (2 * 20 * 20));
    this.map.scene.environmentIntensity = factor;
    const nightColor: Color = new Color(0x000000); // black
    const dayColor: Color = new Color(0xffffff); // white

    this.map.scene.background = nightColor.clone().lerp(dayColor, factor);
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
