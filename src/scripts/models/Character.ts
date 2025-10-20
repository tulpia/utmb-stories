// Utils
import { Object3DEventMap, Group, Mesh, MeshPhysicalMaterial, PointLight, Light } from 'three';

class Character {
  private character: Mesh;
  private light: PointLight;
  public group: Group;

  constructor(characterModel: Group<Object3DEventMap>) {
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

  public setLightIntensity(percentage: number) {
    const clampedNumber: number = 0.5 * Math.exp(-((percentage - 50) ** 2) / (2 * 10 * 10));

    this.light.intensity = clampedNumber;
  }
}

export default Character;
