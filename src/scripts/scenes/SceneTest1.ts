// Interfaces
import UMTBSceneInterface from './interfaces/SceneInterface';

class SceneTest1 implements UMTBSceneInterface {
  public range = {
    start: 5,
    end: 10,
  };

  onEnter(): void {
    console.log('caca');
  }

  onExit(): void {
    console.log('caca');
  }
}

export default SceneTest1;
