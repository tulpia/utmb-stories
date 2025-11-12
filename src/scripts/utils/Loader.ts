// Utils
import {
  Group,
  LoadingManager,
  Object3DEventMap,
  PMREMGenerator,
  Texture,
  WebGLRenderer,
} from 'three';
import { EXRLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';

class Loader {
  private loaderContainer: HTMLElement | null;
  private loaderProgressBar: HTMLElement | null;
  private manager: LoadingManager;
  private exrLoader: EXRLoader;
  private gltfLoader: GLTFLoader;

  constructor() {
    this.loaderContainer = document.querySelector('.js-loader');
    this.loaderProgressBar = document.querySelector('.js-loader-progress-bar');
    this.manager = new LoadingManager();
    this.gltfLoader = new GLTFLoader(this.manager);
    this.exrLoader = new EXRLoader(this.manager);

    this.progressManager();
  }

  async loadModels(
    webglrenderer: WebGLRenderer,
  ): Promise<[Group, Group, Group<Object3DEventMap>, Group, Texture]> {
    const loadGLTF = (url: string) =>
      new Promise<Group>((resolve, reject) => {
        this.gltfLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
      });

    const loadEXR = (url: string, renderer: WebGLRenderer) =>
      new Promise<Texture>((resolve, reject) => {
        this.exrLoader.load(
          url,
          (exrTexture) => {
            const pmremGenerator = new PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            const envMap = pmremGenerator.fromEquirectangular(exrTexture).texture;
            exrTexture.dispose();
            pmremGenerator.dispose();
            resolve(envMap);
          },
          undefined,
          reject,
        );
      });

    const [map, trace, character, mapPath, hdrEnv] = await Promise.all([
      loadGLTF(`${import.meta.env.BASE_URL}/models/carte.glb`),
      loadGLTF(`${import.meta.env.BASE_URL}/models/trace.glb`),
      loadGLTF(`${import.meta.env.BASE_URL}/models/character.glb`),
      loadGLTF(`${import.meta.env.BASE_URL}/models/camerapath.glb`),
      loadEXR(`${import.meta.env.BASE_URL}/textures/day.exr`, webglrenderer),
    ]);

    return [map, trace, character, mapPath, hdrEnv];
  }

  progressManager(): void {
    this.manager.onProgress = (_, itemsLoaded, itemsTotal) => {
      this.loaderProgressBar!.style.width = `${(itemsLoaded / itemsTotal) * 100}%`;
    };

    this.manager.onLoad = () => {
      this.loaderContainer!.classList.add('--hidden');
    };
  }
}

export default Loader;
