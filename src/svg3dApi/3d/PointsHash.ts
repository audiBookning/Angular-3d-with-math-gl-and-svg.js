import { Vector4 } from '@math.gl/core';

import { NodeHash, VectorHash } from '../types/types';

export class PointsHash {
  public nodes: VectorHash;
  constructor(converted: VectorHash) {
    this.nodes = converted;
  }

  static convertPointHashToVect4(pointsHash: NodeHash): PointsHash {
    const converted: VectorHash = {};
    Object.keys(pointsHash).forEach(function (key) {
      const point = Object.values(pointsHash[key]);
      point.push(0);
      converted[key] = new Vector4(point);
    });

    return new PointsHash(converted);
  }

  static generatePointHash(points: Vector4, id: string) {
    const vectHash: VectorHash = {
      [id]: points,
    };
    return new PointsHash(vectHash);
  }
}
