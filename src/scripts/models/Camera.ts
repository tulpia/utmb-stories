// Utils
import {
  CatmullRomCurve3,
  Clock,
  LineSegments,
  PerspectiveCamera,
  Vector3,
  WebGLRenderer,
} from 'three';
import CameraControls from 'camera-controls';

// Classes
import Model from './Model';
import Character from './Character';

class Camera extends Model {
  public camera;
  public character: Character;
  public cameraPath!: CatmullRomCurve3;
  public clock: Clock;

  constructor(camera: PerspectiveCamera, renderer: WebGLRenderer, character: Character) {
    super();

    this.camera = new CameraControls(camera, renderer.domElement);
    this.clock = new Clock();
    this.character = character;

    this.camera.setTarget(
      this.character.group.position.x,
      this.character.group.position.y,
      this.character.group.position.z,
    );
  }

  public parseTrace(trace: LineSegments): void {
    const { curve } = Model.buildCurveFromTrace(trace, true);

    this.cameraPath = curve;
  }

  update(scroll: number): void {
    const delta: number = this.clock.getDelta();
    this.camera.update(delta);

    // Animation de la caméra
    const position: Vector3 = this.cameraPath.getPointAt(scroll / 100);

    this.camera.setLookAt(
      position.x,
      position.y,
      position.z,
      this.character.group.position.x,
      this.character.group.position.y,
      this.character.group.position.z,
      true,
    );
  }
}

export default Camera;
