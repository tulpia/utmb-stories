// Interfaces
import UMTBSceneInterface from './UMTBSceneInterface';

class SceneTest3 implements UMTBSceneInterface {
  pathPosition: number = 50345;
  cameraPosition: number = 2312;

  onEnter(): void {
    console.log('prout');
  }

  onExit(): void {
    console.log('prout');
  }
}

export default SceneTest3;
