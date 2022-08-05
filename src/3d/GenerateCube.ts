import { Vector4 } from '@math.gl/core';

import {
  NodeHash,
  PolygonCubeObj,
  PolygonsRefNodes,
  VectorHash,
} from './types';

export class GenerateCube {
  nodes!: NodeHash;
  polygonObjects!: PolygonCubeObj[];

  points!: VectorHash;

  polygons!: PolygonsRefNodes[];

  constructor() {
    this.generateCube();
  }

  private generateCube() {
    this.nodes = {
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

    this.points = this.convertToVect4();

    // INFO: The order of the polygons is important for choosing the correct normal
    // the first polygon to appear is the one that will be translated
    // see groupBy() method for more info
    // TODO: this is a temporary solution, need to find a better way to do this
    // i was trying to avoid to add more "control structures" and also the hash weight, but ...
    this.polygonObjects = [
      { id: '2', points: [4, 7, 6, 5], opositeFace: '0', axis: 'z' },
      { id: '0', points: [0, 1, 2, 3], opositeFace: '2', axis: 'z' },
      { id: '1', points: [1, 5, 6, 2], opositeFace: '3', axis: 'x' },
      { id: '3', points: [0, 3, 7, 4], opositeFace: '1', axis: 'x' },
      { id: '4', points: [0, 4, 5, 1], opositeFace: '5', axis: 'y' },
      { id: '5', points: [3, 2, 6, 7], opositeFace: '4', axis: 'y' },
    ];

    this.getNodesReferenceByPolygons();
  }

  // TODO: Not really needed at this moment. Correct Type anotation should be enough.
  private convertToVect4(): VectorHash {
    const pointsHash = this.nodes;
    const converted: VectorHash = {};
    Object.keys(pointsHash).forEach(function (key) {
      const point = Object.values(pointsHash[key]);
      point.push(0);
      converted[key] = new Vector4(point);
    });

    return converted;
  }

  // Convert polygon array to a PolygonsRefNodes object
  private getNodesReferenceByPolygons() {
    const polygons = this.polygonObjects;
    const nodesVector = this.points;
    // INFO: iterate over the polygons and get the nodes reference
    this.polygons = [];
    for (const key in polygons) {
      if (Object.prototype.hasOwnProperty.call(polygons, key)) {
        const polygon = polygons[key];

        const randomColor: string =
          '#' + Math.floor(Math.random() * 16777215).toString(16);

        const tempPolygon: PolygonsRefNodes = {
          id: polygon.id,
          nodesHash: {},
          color: randomColor,
          order: polygon.points,
          zIndex: -200,
          axis: polygon.axis,
          opositeFace: polygon.opositeFace,
        };
        let zIndex: number = 0;

        polygon.points.forEach((point) => {
          zIndex += nodesVector[point].z;
          tempPolygon.nodesHash = {
            ...tempPolygon.nodesHash,
            [point]: nodesVector[point],
          };
        });
        tempPolygon.zIndex = zIndex;
        this.polygons.push(tempPolygon);
      }
    }
  }
}
