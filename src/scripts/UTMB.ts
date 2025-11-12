// Utils
import {
  Color,
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

// Utils - Classes
import UTMBLoader from './utils/Loader';
import Scroller from './utils/Scroller';
import SceneManager from './scenes/SceneManager';

// Scenes
import SceneTest1 from './scenes/SceneTest1';
import SceneTest2 from './scenes/SceneTest2';
import SceneTest3 from './scenes/SceneTest3';
import SceneTest4 from './scenes/SceneTest4';

// Models
import Character from './models/Character';
import Map from './models/Map';
import Trace from './models/Trace';
import Camera from './models/Camera';

class UTMB {
  // Essentials
  scene: Scene;
  realCamera: PerspectiveCamera;
  renderer: WebGLRenderer;
  light!: DirectionalLight;

  // Utils
  scroller!: Scroller;
  sceneManager!: SceneManager;

  // Objects
  map!: Map;
  character!: Character;
  trace!: Trace;
  camera!: Camera;

  // Post Processing
  composer!: EffectComposer;
  bokehPass!: BokehPass;

  constructor() {
    this.scene = new Scene();
    this.scene.background = new Color(255, 255, 255);
    this.realCamera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer();
    this.addPostProcessing();

    new UTMBLoader()
      .loadModels(this.renderer)
      .then(([mapObject, traceObject, characterObject, mapPathObject, hdrEnv]) => {
        // Ajout du HDRi
        this.scene.environment = hdrEnv;

        // Initialisation de tous les objets
        const mapPath = mapPathObject.children[0] as LineSegments;
        const trace = traceObject.children[0] as Mesh;
        this.map = new Map(mapObject, this.scene);
        this.character = new Character(characterObject);
        this.trace = new Trace(trace, this.character);
        this.camera = new Camera(this.realCamera, this.renderer, this.character);
        this.camera.parseTrace(mapPath);

        this.scene.add(this.character.group);
        this.scene.add(this.map.map);
        this.scene.add(this.trace.trace);

        // Creation des utils
        this.scroller = new Scroller(this.renderer.domElement);
        this.sceneManager = new SceneManager([
          new SceneTest1(),
          new SceneTest2(),
          new SceneTest3(),
          new SceneTest4(),
        ]);

        this.render();
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

    const renderPass: RenderPass = new RenderPass(this.scene, this.realCamera);
    this.bokehPass = new BokehPass(this.scene, this.realCamera, {
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

  loopPostProcessing(): void {
    const tmp = new Vector3();
    const tmpCamera = new Vector3();
    const position = this.camera.camera.getPosition(tmpCamera);

    this.character.group.getWorldPosition(tmp);
    this.bokehPass.uniforms.focus.value = tmp.distanceTo(position);

    this.composer.render();
  }

  render(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  renderLoop(): void {
    requestAnimationFrame(this.renderLoop);
    this.scroller.update();

    const scroll: number = this.scroller.getScrollPercent();
    this.sceneManager.update(scroll);
    this.camera.update(scroll);
    this.trace.update(scroll);
    this.character.update(scroll);
    this.map.update(scroll);

    this.loopPostProcessing();
  }
}

export default UTMB;
