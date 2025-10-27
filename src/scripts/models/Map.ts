// Utils
import { Color, Group, Object3DEventMap, Scene } from 'three';

// Classes
import Model from './Model';

class Map extends Model {
  map: Group;
  scene: Scene;

  constructor(map: Group<Object3DEventMap>, scene: Scene) {
    super();

    this.map = map;
    this.scene = scene;
  }

  update(scroll: number): void {
    const factor: number = 1 - 1.2 * Math.exp(-((scroll - 50) ** 2) / (2 * 20 * 20));
    const nightColor: Color = new Color(0x000000); // black
    const dayColor: Color = new Color(0xffffff); // white

    this.scene.environmentIntensity = factor;
    this.scene.background = nightColor.clone().lerp(dayColor, factor);
  }
}

export default Map;
