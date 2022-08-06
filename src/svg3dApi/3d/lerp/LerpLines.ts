import { Vector4 } from '@math.gl/core';

import { Line } from '../Line';
import { Point } from '../Point';
import { Projection } from '../Projection';

export class LerpLines {
  baseLines: Line[];
  private _lerpFactor: number;
  public get lerpFactor(): number {
    return this._lerpFactor;
  }
  public set lerpFactor(value: number) {
    this._lerpFactor = value;
  }
  private _lerpLine: Line;
  projection: Projection;
  public get lerpLine(): Line {
    return this.getLerpLine(this.lerpFactor);
  }

  constructor(baseLines: { line1: Line; line2: Line }) {
    this.baseLines = Object.values(baseLines);
    this._lerpFactor = 0.8;
    this._lerpLine = this.getLerpLine(this.lerpFactor);

    this.projection = new Projection();
  }

  // Assume 2 parallel lines.
  public getDistance() {
    const [line1] = this.baseLines;
    const distance = line1.getDistance();
    return distance;
  }

  getLines() {
    const tt = [...this.baseLines, this.lerpLine];

    return tt;
  }

  // TODO: not needed?
  getLinesArray() {
    return [...this.baseLines, this.lerpLine].map((line) => {
      return line.getVectors();
    });
  }

  getLerpLine(lerp: number) {
    const pointAA = this.baseLines[0].getNodeAt(0).node.clone();
    const pointAB = this.baseLines[1].getNodeAt(0).node.clone();

    const pointBA = this.baseLines[0].getNodeAt(1).node.clone();
    const pointBB = this.baseLines[1].getNodeAt(1).node.clone();

    if (lerp === 0) {
      const lerpAPoint = new Point(pointAA);
      const lerpBPoint = new Point(pointBA);
      return new Line([lerpAPoint, lerpBPoint]);
    }

    const lerpFactor = lerp || this.lerpFactor;
    const lerpA = pointAA.lerp(pointAB, lerpFactor);

    const lerpAPoint = new Point(lerpA);

    const lerpB = pointBA.lerp(pointBB, lerpFactor);
    const lerpBPoint = new Point(lerpB);

    return new Line([lerpAPoint, lerpBPoint]);
  }

  static generateLerpLine() {
    const point11 = new Point(new Vector4([1, 1, 1, 0]));
    const point12 = new Point(new Vector4([-1, 1, 1, 0]));
    const line1 = new Line([point11, point12]);

    const point21 = new Point(new Vector4([1, -1, 1, 0]));
    const point22 = new Point(new Vector4([-1, -1, 1, 0]));
    const line2 = new Line([point21, point22]);

    const baseLines2 = { line1, line2 };

    return new LerpLines(baseLines2);
  }
}
