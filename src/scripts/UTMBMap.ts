// Utils
import {
  Color,
  ColorRepresentation,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

// Classes
import UTMBLoader from './UTMBLoader';
import UTMBSceneManager from './UTMBSceneManager';
import SceneTest1 from './scenes/SceneTest1';
import SceneTest2 from './scenes/SceneTest2';
import SceneTest3 from './scenes/SceneTest3';
import SceneTest4 from './scenes/SceneTest4';

class UTMBMap {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  sceneManager!: UTMBSceneManager;
  controls!: OrbitControls;
  light!: DirectionalLight;
  trace!: Mesh;

  constructor() {
    this.scene = new Scene();
    this.scene.background = new Color(255, 255, 255);
    this.camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer();
    this.camera.position.set(5, 10, 5);

    this.addLights();
    this.render();

    const loader = new UTMBLoader();
    loader.loadModels().then(([mapObject, traceObject]) => {
      this.trace = traceObject.children[0];
      this.trace.geometry.setDrawRange(0, 0);
      (this.trace.material as MeshStandardMaterial).color.set('#D70A2C');
      this.light.target = mapObject;
      this.camera.lookAt(mapObject.position);
      this.scene.add(this.trace);
      this.scene.add(mapObject);

      this.sceneManager = new UTMBSceneManager(this.trace, [
        new SceneTest1(),
        new SceneTest2(),
        new SceneTest3(),
        new SceneTest4(),
      ]);
    });
  }

  addControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  addLights(): void {
    this.light = new DirectionalLight(0xffffff, 2);
    this.scene.add(this.light);
  }

  addDebug(): void {
    const gui: GUI = new GUI();
    const obj = {
      background: this.scene.background,
      color: this.light.color.getHex(),
      zoom: this.camera.zoom,
    };

    gui.addColor(obj, 'background').onChange((value: ColorRepresentation) => {
      this.scene.background = new Color(value);
    });

    const lightFolder: GUI = gui.addFolder('Light');
    lightFolder.add(this.light.position, 'x', -10, 10, 0.1);
    lightFolder.add(this.light.position, 'y', -10, 10, 0.1);
    lightFolder.add(this.light.position, 'z', -10, 10, 0.1);
    lightFolder.add(this.light, 'intensity', 0, 3, 0.01);
    lightFolder.addColor(obj, 'color').onChange((value: ColorRepresentation) => {
      this.light.color.set(value);
    });

    const cameraFolder: GUI = gui.addFolder('Camera');
    cameraFolder.add(this.camera.position, 'x', -100, 100, 0.1);
    cameraFolder.add(this.camera.position, 'y', -100, 100, 0.1);
    cameraFolder.add(this.camera.position, 'z', -100, 100, 0.1);
    const debug = {
      start: 0,
      count: 0,
      max: this.trace.geometry?.index?.count,
    };
    const traceFolder: GUI = gui.addFolder('Trace');
    traceFolder.add(debug, 'count', debug.start, debug.max, 1).onChange((v: number) => {
      this.trace.geometry.setDrawRange(debug.start, v);
    });
    traceFolder.addColor(obj, 'color').onChange((value: ColorRepresentation) => {
      (this.trace.material as MeshStandardMaterial).color.set(value);
    });
  }

  render(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });
  }
}

export default UTMBMap;
