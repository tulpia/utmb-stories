// Interfaces
import UMTBSceneInterface from './UMTBSceneInterface';

class SceneTest4 implements UMTBSceneInterface {
  pathPosition: number = 100000;
  cameraPosition: number = 3000;

  onEnter(): void {
    console.log('prout');
  }

  onExit(): void {
    console.log('prout');
  }
}

export default SceneTest4;
