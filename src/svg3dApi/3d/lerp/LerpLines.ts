import { BehaviorSubject } from 'rxjs';

import { Vector4 } from '@math.gl/core';

import { Line } from '../Line';
import { Point } from '../Point';
import { Projection } from '../Projection';

export class LerpLines {
  baseLineA: Line;
  baseLineB: Line;
  public lerpObservable: BehaviorSubject<number>;
  private _lerpFactor: number;
  public get lerpFactor(): number {
    return this._lerpFactor;
  }
  public set lerpFactor(value: number) {
    this._lerpFactor = value;
    this.lerpObservable.next(this._lerpFactor);
  }
  private _lerpLine: Line;
  projection: Projection;
  public get lerpLine(): Line {
    return this.getLerpLine(this.lerpFactor);
  }

  constructor(baseLines: { line1: Line; line2: Line }) {
    const [baseA, baseB] = Object.values(baseLines);
    this.baseLineA = baseA;
    this.baseLineB = baseB;
    this._lerpFactor = 0.8;
    this._lerpLine = this.getLerpLine(this.lerpFactor);

    this.projection = new Projection();
    this.lerpObservable = new BehaviorSubject<number>(this._lerpFactor);
  }

  // Assume 2 parallel lines.
  public getDistance() {
    const distance = this.baseLineA.getDistance();
    return distance;
  }

  public getLines() {
    const tt = [
      { line: this.baseLineA, type: 'baseA' },
      { line: this.baseLineB, type: 'baseB' },
      { line: this.lerpLine, type: 'lerp' },
    ];

    return tt;
  }

  public getLinesArray() {
    return [this.baseLineA, this.baseLineB, this.lerpLine];
  }

  public getBaseLines() {
    return [this.baseLineA, this.baseLineB];
  }

  // TODO: not needed?
  public getLinesVectors() {
    return [this.baseLineA, this.baseLineB, this.lerpLine].map((line) => {
      return line.getVectors();
    });
  }

  private getLerpLine(lerp: number) {
    const pointAA = this.baseLineA.getNodeAt(0).node.clone();
    const pointAB = this.baseLineB.getNodeAt(0).node.clone();

    const pointBA = this.baseLineA.getNodeAt(1).node.clone();
    const pointBB = this.baseLineB.getNodeAt(1).node.clone();

    if (lerp === 0) {
      const lerpAPoint = new Point(pointAA);
      const lerpBPoint = new Point(pointBA);
      return new Line([lerpAPoint, lerpBPoint]);
    }

    const lerpFactor = lerp;
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
