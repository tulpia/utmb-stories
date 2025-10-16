// Utils
import {
  Color,
  ColorRepresentation,
  DirectionalLight,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import {
  BokehPass,
  EffectComposer,
  OutputPass,
  RenderPass,
  SMAAPass,
} from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui';

// Classes
import UTMBLoader from './UTMBLoader';
// eslint-disable-next-line import/no-cycle
import UTMBSceneManager from './UTMBSceneManager';
import SceneTest1 from './scenes/SceneTest1';
import SceneTest2 from './scenes/SceneTest2';
import SceneTest3 from './scenes/SceneTest3';
import SceneTest4 from './scenes/SceneTest4';

class UTMBMap {
  // Essentials
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  light!: DirectionalLight;
  composer!: EffectComposer;
  bokehPass!: BokehPass;

  // Custom stuff
  sceneManager!: UTMBSceneManager;

  // Objects
  character!: Mesh;

  constructor() {
    this.scene = new Scene();
    this.scene.background = new Color(255, 255, 255);
    this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(5, 10, 5);
    this.renderer = new WebGLRenderer();

    this.addPostProcessing();
    this.render();

    const loader = new UTMBLoader();
    loader
      .loadModels(this.renderer)
      .then(([mapObject, traceObject, characterObject, mapPathObject, hdrEnv]) => {
        const trace = traceObject.children[0] as Mesh;
        const mapPath = mapPathObject.children[0] as LineSegments;
        const character = characterObject.children[0] as Mesh;

        this.character = character;
        this.character.scale.set(1.5, 1.5, 1.5);
        this.character.material.color.setHex(0xd70a2c);

        this.camera.lookAt(mapObject.position);
        this.scene.add(this.character);
        this.scene.add(mapObject);
        this.scene.environment = hdrEnv;

        this.sceneManager = new UTMBSceneManager(this, trace, mapPath, [
          new SceneTest1(),
          new SceneTest2(),
          new SceneTest3(),
          new SceneTest4(),
        ]);
      });
  }

  addPostProcessing(): void {
    // Anti-Aliasing
    const w: number = window.innerWidth;
    const h: number = window.innerHeight;
    const rt: WebGLRenderTarget = new WebGLRenderTarget(w, h, { samples: 4 });
    const smaaPass: SMAAPass = new SMAAPass(window.innerWidth, window.innerHeight);

    // DoF
    const DPR: number = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(DPR);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const renderPass: RenderPass = new RenderPass(this.scene, this.camera);
    this.bokehPass = new BokehPass(this.scene, this.camera, {
      focus: 15,
      aperture: 0.01,
      maxblur: 0.1,
    });
    const outputPass: OutputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bokehPass);
    this.composer.addPass(outputPass);
    this.composer.addPass(smaaPass);
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
  }

  render(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  renderLoop(): void {
    requestAnimationFrame(this.renderLoop);

    if (this.character) {
      const tmp = new Vector3();
      this.character.getWorldPosition(tmp);

      this.bokehPass.uniforms.focus.value = tmp.distanceTo(this.camera.position);
    }
    this.composer.render();
  }
}

export default UTMBMap;
