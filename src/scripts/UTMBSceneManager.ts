// Utils
import { Mesh } from 'three';
import { gsap } from 'gsap';

// Interfaces
import Scene from './scenes/UMTBSceneInterface';

class UTMBSceneManager {
  private scenes: Array<Scene>;
  private currentScene: number = 0;
  private currentlySwitchingScenes: boolean = false;
  private trace: Mesh;
  private state: any;

  constructor(trace: Mesh, scenes: Array<Scene>) {
    this.trace = trace;
    this.scenes = scenes;
    this.state = {
      count: 0,
    };

    this.events();
    this.processStep();
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
      gsap.to(this.state, {
        count: this.scenes[this.currentScene].pathPosition,
        duration: 1,
        ease: 'sine.inOut',
        onUpdate: () => this.trace.geometry.setDrawRange(0, this.state.count),
      });
    }
  }
}

export default UTMBSceneManager;
