// Interfaces
import Scene from './interfaces/SceneInterface';

class SceneManager {
  private scenes: Array<Scene>;
  private lastActiveScene!: Scene;
  private currentActiveScene!: Scene;

  constructor(scenes: Array<Scene>) {
    this.scenes = scenes;
  }

  public update(scroll: number): void {
    // Access fakeScroll from handler
    const correspondingScene = this.scenes.find(
      (scene) => scroll >= scene.range.start && scroll <= scene.range.end,
    );

    if (correspondingScene && this.currentActiveScene !== correspondingScene) {
      if (this.lastActiveScene) {
        this.lastActiveScene.onExit();
        this.lastActiveScene = this.currentActiveScene;
      }
      this.currentActiveScene = correspondingScene;

      this.currentActiveScene.onEnter();
    }
  }
}

export default SceneManager;
