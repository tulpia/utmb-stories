import { Group, LoadingManager } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

class UTMBLoader {
  private loaderContainer: HTMLElement | null;
  private loaderProgressBar: HTMLElement | null;
  private manager: LoadingManager;
  private gltfLoader: GLTFLoader;

  constructor() {
    this.loaderContainer = document.querySelector('.js-loader');
    this.loaderProgressBar = document.querySelector('.js-loader-progress-bar');
    this.manager = new LoadingManager();
    this.gltfLoader = new GLTFLoader(this.manager);

    this.progressManager();
  }

  async loadModels(): Promise<[Group, Group, Group, Group]> {
    const loadGLTF = (url: string) =>
      new Promise<Group>((resolve, reject) => {
        this.gltfLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
      });

    const [map, trace, character, mapPath] = await Promise.all([
      loadGLTF('/models/carte.glb'),
      loadGLTF('/models/trace.glb'),
      loadGLTF('/models/character.glb'),
      loadGLTF('/models/camerapath.glb'),
    ]);

    return [map, trace, character, mapPath];
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

export default UTMBLoader;
