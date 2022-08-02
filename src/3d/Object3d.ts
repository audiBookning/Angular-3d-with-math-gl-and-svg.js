import { Injectable } from '@angular/core';
import {
  configure as glConfigure,
  Matrix4,
  toRadians,
  Vector3,
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
  private fullTransformMatrix!: Matrix4;
  private perspectiveMatrix: Matrix4 | undefined;
  private rotateXMatrix: Matrix4 | undefined;
  private stretchMatrix!: Matrix4;
  private fovy: number = Math.PI * 0.5;

  // Temp variables for Performance
  private tempPerformanceVector: Vector4 = new Vector4();

  // Geometries
  private nodesHash!: VectorHash;
  polygons: PolygonsRefNodes[] | undefined;

  // Camera
  private cameraInitialPosition!: Vector3;
  private cameraLookAt!: Vector3;
  private cameraUpDirection!: Vector3;
  private _cameraCurrentPosition!: Vector3;
  public get cameraCurrentPosition(): Vector3 {
    return this._cameraCurrentPosition;
  }
  public set cameraCurrentPosition(value: Vector3) {
    this._cameraCurrentPosition = value;

    this.setFullTransformMatrix();
  }

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

  setInitialcameraPosition = () => {
    // Point the camera is looking at
    this.cameraLookAt = new Vector3([0, 0, 0]);
    // Initial position of the camera
    this.cameraInitialPosition = new Vector3([1, 1, 1]);
    // Current position of the camera
    this._cameraCurrentPosition = this.cameraInitialPosition.clone();

    this.cameraUpDirection = new Vector3([0, 1, 0]);
  };

  set({ scale = [1, 1, 1], rotation }: Partial<Object3DInput> = {}) {
    this.scale = scale;

    this.scaleX = Array.isArray(scale) ? scale[0] : scale;
    this.scaleY = Array.isArray(scale) ? scale[1] : scale;
    this.scaleZ = Array.isArray(scale) ? scale[2] : scale;

    //this.obj3d.scale = scale;
    if (rotation) this.rotationRadians = rotation;

    this.setInitialcameraPosition();
    this.initMathsAnd3D();
  }

  private initMathsAnd3D() {
    // INFO: Math.gl performance config. Doesn't seem to do much in this case.
    glConfigure({ debug: false });
    // INFO: Since the camera isn't moving, we can use the same perspective matrix
    // for all the polygons and transformations (rotation, ...). This is a performance optimization.
    this.setPerspectiveMatrix();
    this.setFullTransformMatrix();

    const { points, polygons } = this.generateCube();
    this.nodesHash = points;

    this.stretchMatrix = new Matrix4().scale(this.scale);
    this.stretchPolygon();
    this.polygons = polygons;
  }

  rotateCamera(rotInput: number) {
    const origin = this.cameraLookAt;
    const rotationVector = this.cameraCurrentPosition;

    const radians = toRadians(rotInput);
    const newCameraPosition = rotationVector.rotateY({
      radians: radians,
      origin,
    });

    this.cameraCurrentPosition = newCameraPosition;
  }

  rotatePolygon() {
    if (this.rotateXMatrix === undefined) {
      return;
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

  // TODO: Not really needed at this moment. Correct Type anotation should be enough.
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

  private setFullTransformMatrix() {
    if (!this.perspectiveMatrix)
      throw new Error('Perspective matrix not initialized');

    const lookAt = this.perspectiveMatrix.lookAt({
      eye: this.cameraCurrentPosition,
      center: this.cameraLookAt,
      up: this.cameraUpDirection,
    });

    this.fullTransformMatrix = lookAt.scale(SCALEDefaultCONSTANT);
  }

  setPerspectiveMatrix() {
    this.perspectiveMatrix = new Matrix4().orthographic({
      fovy: this.fovy,
      aspect: 1,
      near: 0,
      far: 1,
    });
  }
}
