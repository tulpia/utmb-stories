// Utils
import { BufferAttribute, BufferGeometry, Line, Mesh, Vector3 } from 'three';

// Classes
import Model from './Model';
import Character from './Character';

class Trace extends Model {
  public trace: Line;
  public character: Character;

  constructor(trace: Mesh, character: Character) {
    super();

    const { line } = Trace.buildCurveFromTrace(trace);
    this.trace = line;
    this.trace.geometry.setDrawRange(0, 0);

    this.character = character;
  }

  private drawTrace(scroll: number): void {
    const totalTrace: number = this.trace.geometry.index
      ? this.trace.geometry.index.count
      : this.trace.geometry.attributes.position.count;
    const percentOfTrace: number = Math.floor(totalTrace * (scroll * 0.01));

    this.trace.geometry.setDrawRange(0, percentOfTrace);

    const posAttr = (this.trace.geometry as BufferGeometry).attributes.position as BufferAttribute;
    const vertexIndex = Math.max(Math.floor(percentOfTrace) - 1, 0);
    const frac = percentOfTrace - Math.floor(percentOfTrace);

    const v1 = new Vector3().fromBufferAttribute(posAttr, vertexIndex);
    const v2 = new Vector3().fromBufferAttribute(
      posAttr,
      Math.min(vertexIndex + 1, posAttr.count - 1),
    );

    this.trace.localToWorld(v1);
    this.trace.localToWorld(v2);

    v1.lerp(v2, frac);
    this.character.group.position.copy(v1);
  }

  update(scroll: number): void {
    this.drawTrace(scroll);
  }
}

export default Trace;
