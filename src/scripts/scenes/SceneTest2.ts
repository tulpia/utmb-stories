// Interfaces
import UMTBSceneInterface from './UMTBSceneInterface';

class SceneTest2 implements UMTBSceneInterface {
  public range = {
    start: 20,
    end: 30,
  };

  onEnter(): void {
    console.log('pipi');
  }

  onExit(): void {
    console.log('pipi');
  }
}

export default SceneTest2;
