import { Injectable } from '@angular/core';
import {
  configure as glConfigure,
  Matrix4,
  toRadians,
  Vector4,
} from '@math.gl/core';

import { SCALEDefaultCONSTANT } from './constants';
import {
  Cube3d,
  NodeHash,
  Object3DInput,
  PolygonObj,
  PolygonsRefNodes,
  VectorHash,
} from './types';

@Injectable({
  providedIn: 'root',
})
export class Object3d {
  // Math.gl
  // pseudo constants as long as the camera is not changed
  fullTransformMatrix!: Matrix4;
  perspectiveMatrix: Matrix4 | undefined;
  rotateXMatrix: Matrix4 | undefined;
  stretchMatrix!: Matrix4;

  // Geometries
  nodesHash!: VectorHash;
  polygons: PolygonsRefNodes[] | undefined;

  // Temp variables for Performance

  tempPerformanceVector: Vector4 = new Vector4();

  // Cube
  private _scale: number | number[] = 1;
  public get scale(): number | number[] {
    return this._scale;
  }
  public set scale(value: number | number[]) {
    this._scale = value;
    this.stretchMatrix = new Matrix4().scale(this.scale);
    this.stretchPolygon();
  }
  private _scaleX: number = 1;
  public get scaleX(): number {
    return this._scaleX;
  }
  public set scaleX(value: number) {
    this._scaleX = value;
    this.scale = [value, 1, 1];
  }
  scaleY: number = 1;
  scaleZ: number = 1;

  private _rotationRadians: number | undefined;
  public get rotationRadians() {
    return this._rotationRadians || 0;
  }
  public set rotationRadians(value: number) {
    this._rotationRadians = toRadians(value);
    this.rotateXMatrix = new Matrix4().rotateY(this.rotationRadians);
  }

  constructor() {
    this.rotationRadians = toRadians(0);
  }

  set({ scale = [1, 1, 1], rotation = 0 }: Partial<Object3DInput> = {}) {
    this.scale = scale;

    this.scaleX = Array.isArray(scale) ? scale[0] : scale;
    this.scaleY = Array.isArray(scale) ? scale[1] : scale;
    this.scaleZ = Array.isArray(scale) ? scale[2] : scale;

    //this.obj3d.scale = scale;
    this.rotationRadians = rotation;

    this.initMathsAnd3D();
  }

  private initMathsAnd3D() {
    // INFO: Math.gl performance config. Doesn't seem to do much in this case.
    glConfigure({ debug: false });
    // INFO: Since the camera isn't moving, we can use the same perspective matrix
    // for all the polygons and transformations (rotation, ...). This is a performance optimization.
    this.fullTransformMatrix = this.getPerspectiveMatrix();

    const { points, polygons } = this.generateCube();
    this.nodesHash = points;

    this.stretchMatrix = new Matrix4().scale(this.scale);
    this.stretchPolygon();
    this.polygons = polygons;
  }

  rotatePolygon() {
    if (this.rotateXMatrix === undefined) {
      throw new Error('rotateXMatrix is undefined');
    }

    for (const key in this.nodesHash) {
      if (Object.prototype.hasOwnProperty.call(this.nodesHash, key)) {
        this.nodesHash[key] = this.nodesHash[key].transform(this.rotateXMatrix);
      }
    }
  }

  private stretchPolygon() {
    for (const key in this.nodesHash) {
      if (Object.prototype.hasOwnProperty.call(this.nodesHash, key)) {
        this.nodesHash[key] = this.nodesHash[key].transform(this.stretchMatrix);
      }
    }
  }

  private getNodesReferenceByPolygons(
    polygons: PolygonObj[],
    nodesVector: VectorHash
  ): PolygonsRefNodes[] {
    // INFO: iterate over the polygons and get the nodes reference
    const PolygonsRef: PolygonsRefNodes[] = [];
    for (const key in polygons) {
      if (Object.prototype.hasOwnProperty.call(polygons, key)) {
        const polygon = polygons[key];

        const randomColor: string =
          '#' + Math.floor(Math.random() * 16777215).toString(16);

        const tempPolygon: PolygonsRefNodes = {
          id: polygon.id,
          nodes: {},
          color: randomColor,
          order: polygon.points,
          zIndex: -200,
        };
        let zIndex: number = 0;

        polygon.points.forEach((point) => {
          zIndex += nodesVector[point].z;
          tempPolygon.nodes = {
            ...tempPolygon.nodes,
            [point]: nodesVector[point],
          };
        });
        tempPolygon.zIndex = zIndex;
        PolygonsRef.push(tempPolygon);
      }
    }

    return PolygonsRef;
  }

  private generateCube(): Cube3d {
    let nodes: NodeHash = {
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

    const nodesVector: VectorHash = this.convertToVect4(nodes);

    const polygonObjects: PolygonObj[] = [
      { id: '0', points: [0, 1, 2, 3] },
      { id: '1', points: [1, 5, 6, 2] },
      { id: '2', points: [5, 4, 7, 6] },
      { id: '3', points: [4, 0, 3, 7] },
      { id: '4', points: [4, 5, 1, 0] },
      { id: '5', points: [3, 2, 6, 7] },
    ];

    const polygonsRefNodes: PolygonsRefNodes[] =
      this.getNodesReferenceByPolygons(polygonObjects, nodesVector);

    return {
      points: nodesVector,
      polygons: polygonsRefNodes,
    };
  }

  private convertToVect4(pointsHash: NodeHash): VectorHash {
    const converted: VectorHash = {};
    Object.keys(pointsHash).forEach(function (key) {
      const point = Object.values(pointsHash[key]);
      point.push(0);
      converted[key] = new Vector4(point);
    });

    return converted;
  }

  getScreenCoordinates(vector: Vector4) {
    const transformV = this.fullTransformMatrix.transform(
      vector,
      this.tempPerformanceVector
    );

    const [x, y, Z] = transformV;
    return [x, y, Z];
  }

  private getPerspectiveMatrix() {
    const fovy = Math.PI * 0.5;
    this.perspectiveMatrix = new Matrix4();

    const perspective = this.perspectiveMatrix.orthographic({
      fovy,
      aspect: 1,
      near: 0,
      far: 1,
    });

    const lookAt = perspective.lookAt({
      eye: [1, 1, 1],
      center: [0, 0, 0],
      up: [0, 1, 0],
    });

    const fullTransform = lookAt.scale(SCALEDefaultCONSTANT);

    return fullTransform;
  }
}
