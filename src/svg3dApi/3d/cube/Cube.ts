import { VectorHash } from '../../types/types';
import { PointsHash } from '../PointsHash';
import { Polygons } from '../Polygons';
import { GenerateCube } from './GenerateCube';

// INFO: This Class should deal with 3d Cubes only
export class Cube {
  // Does the cube need the points as a property?
  public points!: PointsHash;

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
