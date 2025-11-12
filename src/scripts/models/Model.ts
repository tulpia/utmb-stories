// Utils
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Vector3,
} from 'three';

class Model {
  static buildCurveFromTrace(
    traceMesh: Mesh | LineSegments,
    reverse: boolean = false,
  ): {
    curve: CatmullRomCurve3;
    line: Line;
  } {
    let geometry = traceMesh.geometry as BufferGeometry;

    // Convert to non-indexed if necessary
    if (geometry.index) {
      geometry = geometry.toNonIndexed();
    }

    // Extract points in world space
    const posAttr = geometry.getAttribute('position') as BufferAttribute;
    const points: Vector3[] = [];

    const temp = new Vector3();
    for (let i = 0; i < posAttr.count; i += 1) {
      temp.fromBufferAttribute(posAttr, i);
      traceMesh.localToWorld(temp); // apply mesh transform
      points.push(temp.clone());
    }

    if (reverse) {
      points.reverse();
    }

    // Build CatmullRomCurve3
    const curve = new CatmullRomCurve3(points, false); // false = not closed

    // Build a line for visualization
    const curvePoints = curve.getPoints(points.length - 1); // same resolution as original mesh
    const curveGeometry = new BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new LineBasicMaterial({ color: 0xff0000 });
    const line = new Line(curveGeometry, curveMaterial);

    // Return both so you can add the line to the scene and store the curve for animation
    return { curve, line };
  }

  update(_scroll: number): void {
    // eslint-disable-next-line no-console
    console.warn('replace me');
  }
}

export default Model;
