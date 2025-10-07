// Interfaces
import UMTBSceneInterface from './UMTBSceneInterface';

class SceneTest3 implements UMTBSceneInterface {
  public range = {
    start: 60,
    end: 65,
  };

  onEnter(): void {
    console.log('prout');
  }

  onExit(): void {
    console.log('prout');
  }
}

export default SceneTest3;
