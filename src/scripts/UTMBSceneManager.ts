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
  private traceCurve: CatmullRomCurve3;
  private animationState: AnimationStep = {
    trace: {
      count: 0,
    },
  };

  constructor(MapInstance: UTMBMap, scenes: Array<Scene>) {
    this.map = MapInstance;
    this.scenes = scenes;

    this.traceCurve = this.buildCurveFromTrace();
    // Sample the curve
    const sampledPoints = this.traceCurve.getPoints(500); // 500 = resolution
    const curveGeometry = new BufferGeometry().setFromPoints(sampledPoints);

    // Red debug line
    const curveMaterial = new LineBasicMaterial({ color: 0xff0000 });
    const curveLine = new Line(curveGeometry, curveMaterial);
    this.map.scene.add(curveLine);

    this.events();
    this.processStep();
  }

  buildCurveFromTrace(): CatmullRomCurve3 {
    let geometry = this.map.trace.geometry as BufferGeometry;

    // Convert if indexed
    if (geometry.index) {
      geometry = geometry.toNonIndexed();
    }

    const posAttr = geometry.getAttribute('position') as BufferAttribute;
    const points: Vector3[] = [];

    const temp = new Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      temp.fromBufferAttribute(posAttr, i);
      this.map.trace.localToWorld(temp); // convert local → world
      points.push(temp.clone());
    }

    return new CatmullRomCurve3(points);
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
    if (this.scenes[this.currentScene]) {
      // @todo : trigger le onExit avant l'anim, en faire une fonction async
      if (this.lastScene !== null && this.scenes[this.lastScene]) {
        this.scenes[this.lastScene].onExit();
      }

      const total: number = this.map.trace.geometry.index
        ? this.map.trace.geometry.index.count
        : this.map.trace.geometry.attributes.position.count;

      gsap.to(this.animationState.trace, {
        count: total * (this.scenes[this.currentScene].pathPosition * 0.01),
        duration: 1,
        ease: 'sine.inOut',
        onUpdate: () => {
          this.map.trace.geometry.setDrawRange(0, this.animationState.trace.count);

          const t = Math.min(this.animationState.trace.count / total, 1);
          const pos = this.traceCurve.getPointAt(t);

          this.map.character.position.copy(pos);
        },
        onComplete: () => {
          this.scenes[this.currentScene].onEnter();
        },
      });
    }
  }
}

export default UTMBSceneManager;
