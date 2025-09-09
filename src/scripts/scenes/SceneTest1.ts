// Interfaces
import UMTBSceneInterface from './UMTBSceneInterface';

class SceneTest1 implements UMTBSceneInterface {
  pathPosition: number = 3408;
  cameraPosition: number = 1123;

  onEnter(): void {
    console.log('caca');
  }

  onExit(): void {
    console.log('caca');
  }
}

export default SceneTest1;
