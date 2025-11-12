// Utils
import { Object3DEventMap, Group, Mesh, MeshPhysicalMaterial, PointLight } from 'three';

// Interfaces
import Model from './Model';

class Character extends Model {
  private character: Mesh;
  private light: PointLight;
  public group: Group;

  constructor(characterModel: Group<Object3DEventMap>) {
    super();

    this.character = characterModel.children[0] as Mesh;
    this.light = new PointLight(0xffffff, 0, 100);
    this.group = new Group();

    this.setDefaults();

    this.group.add(this.character);
    this.group.add(this.light);
  }

  setDefaults(): void {
    this.character.scale.set(2, 2, 2);
    this.character.material = new MeshPhysicalMaterial({
      color: 0xd70a2c,
      roughness: 0.3,
      metalness: 0.0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      envMapIntensity: 0.6,
    });
  }

  public setLightIntensity(percentage: number): void {
    const clampedNumber: number = 0.5 * Math.exp(-((percentage - 50) ** 2) / (2 * 10 * 10));

    this.light.intensity = clampedNumber;
  }

  update(scroll: number): void {
    this.setLightIntensity(scroll);
  }
}

export default Character;
