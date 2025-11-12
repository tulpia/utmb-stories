// Interfaces
import UMTBSceneInterface from './interfaces/SceneInterface';

class SceneTest4 implements UMTBSceneInterface {
  public range = {
    start: 90,
    end: 95,
  };

  onEnter(): void {
    console.log('prout');
  }

  onExit(): void {
    console.log('poyyy');
  }
}

export default SceneTest4;
