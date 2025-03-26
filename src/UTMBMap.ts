import {
  Color,
  ColorRepresentation,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

class UTMBMap {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  controls!: OrbitControls;
  light!: DirectionalLight;

  constructor() {
    this.scene = new Scene();
    this.scene.background = new Color(0, 0, 0);
    this.camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer();

    this.camera.position.set(5, 10, 5);

    this.addLights();
    this.addFile();
    this.addDebug();
    this.render();
  }

  addControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  addLights(): void {
    this.light = new DirectionalLight(0xffffff, 0.75);
    this.scene.add(this.light);
  }

  addFile(): void {
    const loader = new GLTFLoader();

    loader.load(
      '/models/utmb.glb',
      (gltf) => {
        this.light.target = gltf.scene;
        this.scene.add(gltf.scene);
        this.scene.add(this.light.target);
        this.camera.lookAt(gltf.scene.position);
      },
      undefined,
      (error) => {
        console.error('Error loading GLB:', error);
      },
    );
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

    const lightFolder = gui.addFolder('Light');
    lightFolder.add(this.light.position, 'x', -10, 10, 0.1);
    lightFolder.add(this.light.position, 'y', -10, 10, 0.1);
    lightFolder.add(this.light.position, 'z', -10, 10, 0.1);
    lightFolder.add(this.light, 'intensity', 0, 1, 0.01);
    lightFolder.addColor(obj, 'color').onChange((value: ColorRepresentation) => {
      this.light.color.set(value);
    });

    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(this.camera.position, 'x', -100, 100, 0.1);
    cameraFolder.add(this.camera.position, 'y', -100, 100, 0.1);
    cameraFolder.add(this.camera.position, 'z', -100, 100, 0.1);
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
