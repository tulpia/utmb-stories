// Utils
import { lerp } from 'three/src/math/MathUtils.js';

// Interfaces
import Scene from './scenes/UMTBSceneInterface';
import SceneThreshold from './scenes/UTMBSceneThresholdInterface';

class UTMBScroller {
  public fakeMaxHeight: number;
  public scenesThresholds: Array<SceneThreshold>;
  public fakeScroll: number = 0; // exposed for main class
  public scrollVelocity: number = 0;

  private canvas: HTMLCanvasElement;
  private smoothing: number;
  private friction: number;

  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private prevFrameTime: number = performance.now();

  constructor(
    canvas: HTMLCanvasElement,
    scenes: Array<Scene>,
    options: {
      smoothing?: number;
      friction?: number;
    } = {},
  ) {
    this.canvas = canvas;
    this.smoothing = options.smoothing ?? 0.1;
    this.friction = options.friction ?? 0.9;

    // Calculation des valeurs de base
    // @todo : Relancer au resize de la fenêtre
    this.fakeMaxHeight = UTMBScroller.calculateFakeMaxHeight();
    this.scenesThresholds = this.calculateScenesTresholds(scenes);

    // Bind methods
    this.onWheel = this.onWheel.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.animate = this.animate.bind(this);

    // Event listeners
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);

    // Start loop
    requestAnimationFrame(this.animate);
  }

  private static calculateFakeMaxHeight(): number {
    // Nombre totalement arbitraire lol
    return window.innerHeight / 2;
  }

  private calculateScenesTresholds(scenes: Array<Scene>): Array<SceneThreshold> {
    const finalScenes: Array<SceneThreshold> = [];

    scenes.forEach((scene: Scene) => {
      const threshHold: SceneThreshold = {
        start: Math.floor(this.fakeMaxHeight * (scene.range.start * 0.01)),
        end: Math.floor(this.fakeMaxHeight * (scene.range.end * 0.01)),
      };

      finalScenes.push(threshHold);
    });

    return finalScenes;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    this.scrollVelocity += e.deltaY;
  }

  private onPointerDown(e: PointerEvent) {
    this.isDragging = true;
    this.dragStartY = e.clientY;
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isDragging) return;
    const delta = e.clientY - this.dragStartY;
    this.scrollVelocity += -delta;
    this.dragStartY = e.clientY;
  }

  private onPointerUp() {
    this.isDragging = false;
  }

  private animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaTime = (now - this.prevFrameTime) / 1000;
    this.prevFrameTime = now;

    // Apply friction
    const frictionFactor = this.friction ** (deltaTime * 60);
    this.scrollVelocity *= frictionFactor;

    // Smooth velocity using lerp towards accumulated delta (optional)
    // If you have a rawVelocity coming from wheel/drag each frame, you can lerp toward it
    // For example, we can store rawWheelDelta separately and lerp velocity:
    // this.scrollVelocity = this.lerp(this.scrollVelocity, this.rawVelocity, this.smoothing);

    // For simplicity, you can smooth scroll integration itself:
    this.fakeScroll = lerp(
      this.fakeScroll,
      this.fakeScroll + this.scrollVelocity * deltaTime,
      this.smoothing,
    );
  }

  public getScrollPercent(): number {
    return (this.fakeScroll / this.fakeMaxHeight) * 100;
  }
}

export default UTMBScroller;
