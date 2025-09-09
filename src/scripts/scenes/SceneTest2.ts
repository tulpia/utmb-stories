// Interfaces
import UMTBSceneInterface from './UMTBSceneInterface';

class SceneTest2 implements UMTBSceneInterface {
  pathPosition: number = 17763;
  cameraPosition: number = 1567;

  onEnter(): void {
    console.log('pipi');
  }

  onExit(): void {
    console.log('pipi');
  }
}

export default SceneTest2;
