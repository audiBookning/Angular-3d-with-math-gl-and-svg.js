import { PolygonsRefNodes, VectorHash } from '../types/types';
import { Points } from './Points';
import { Polygons } from './Polygons';

// INFO: This Class is just a factory for generating a 3d Cube
export class GenerateCube {
  points!: Points;

  polygons!: Polygons;

  constructor() {
    this.generateCube();
  }

  private generateCube() {
    const nodes = {
      '0': {
        x: -1,
        y: 1,
        z: -1,
      },
      '1': {
        x: 1,
        y: 1,
        z: -1,
      },
      '2': {
        x: 1,
        y: -1,
        z: -1,
      },
      '3': {
        x: -1,
        y: -1,
        z: -1,
      },
      '4': {
        x: -1,
        y: 1,
        z: 1,
      },
      '5': {
        x: 1,
        y: 1,
        z: 1,
      },
      '6': {
        x: 1,
        y: -1,
        z: 1,
      },
      '7': {
        x: -1,
        y: -1,
        z: 1,
      },
    };

    this.points = Points.convertPointHashToVect4(nodes);

    // INFO: The order of the polygons is important for choosing the correct normal
    // the first polygon to appear is the one that will be translated
    // see groupBy() method for more info
    // TODO: this is a temporary solution, need to find a better way to do this
    // i was trying to avoid to add more "control structures" and also the hash weight, but ...
    const polygonObjects = [
      { id: '2', points: [4, 7, 6, 5], opositeFace: '0', axis: 'z' },
      { id: '0', points: [0, 1, 2, 3], opositeFace: '2', axis: 'z' },
      { id: '1', points: [1, 5, 6, 2], opositeFace: '3', axis: 'x' },
      { id: '3', points: [0, 3, 7, 4], opositeFace: '1', axis: 'x' },
      { id: '4', points: [0, 4, 5, 1], opositeFace: '5', axis: 'y' },
      { id: '5', points: [3, 2, 6, 7], opositeFace: '4', axis: 'y' },
    ];

    this.polygons = Polygons.getNodesReferenceByPolygons(
      polygonObjects,
      this.points.nodes
    );
  }
}
