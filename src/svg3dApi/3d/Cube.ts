import { VectorHash } from '../types/types';
import { GenerateCube } from './GenerateCube';
import { Points } from './Points';
import { Polygons } from './Polygons';

// INFO: This Class should deal with 3d Cubes only
export class Cube {
  public points!: Points;

  public polygons!: Polygons;

  constructor() {
    const { points, polygons } = new GenerateCube();
    this.points = points;
    this.polygons = polygons;
  }

  // TODO: refactor - this is just an unecessary abstraction
  public updatePolygonDistance(nodesHash: VectorHash | undefined) {
    this.polygons.updatePolygonDistance(nodesHash);
  }
}
