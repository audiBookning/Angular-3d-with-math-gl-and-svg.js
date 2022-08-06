import { Vector4 } from '@math.gl/core';

import { Point } from './Point';

// TODO: change the name to something with less probabily of collision with other names
export class Line {
  private _points: Point[];
  public get points(): Point[] {
    return this._points;
  }

  constructor(points: Point[]) {
    this._points = points;
  }

  // get distance between the two points
  public getDistance() {
    const [point1, point2] = this.points;
    const distance = point1.node.distanceTo(point2.node);
    return distance;
  }

  public getNodeAt(position: number) {
    return this.points[position];
  }

  getVectors() {
    const points = Object.values(this.points);
    const vectors = points.map((point) => point.node);
    return vectors;
  }
}
