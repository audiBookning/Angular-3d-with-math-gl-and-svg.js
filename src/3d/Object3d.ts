import { Subject } from 'rxjs';

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
  PolygonCubeObj,
  PolygonDistByAxis,
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
  distanceByAxis: PolygonDistByAxis | undefined;

  // Camera
  private cameraInitialPosition!: Vector3;
  private cameraLookAt!: Vector3;
  private cameraUpDirection!: Vector3;
  polygonScaleId: string | undefined;
  polygonToScale: PolygonsRefNodes | undefined;
  // **
  private _polygonScaleNormal: Vector3 | undefined;
  polygonAxisId: string | undefined;

  public get polygonScaleNormal(): Vector3 {
    const hytg = this.getNormal();
    return this._polygonScaleNormal || hytg;
  }
  public set polygonScaleNormal(value: Vector3) {
    this._polygonScaleNormal = value;
    //this.getNormal()
  }
  // **
  private _cameraCurrentPosition!: Vector3;
  public get cameraCurrentPosition(): Vector3 {
    return this._cameraCurrentPosition;
  }
  public set cameraCurrentPosition(value: Vector3) {
    this._cameraCurrentPosition = value;
    this.setFullTransformMatrix();
  }

  // TODO: delete all the scale props?
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
  // **
  private _scaleX: number = 1;
  public get scaleX(): number {
    return this._scaleX;
  }
  public set scaleX(value: number) {
    this._scaleX = value;
    this.scale = [value, 1, 1];
  }
  // **
  private _scaleY: number = 1;
  public get scaleY(): number {
    return this._scaleY;
  }
  public set scaleY(value: number) {
    this._scaleY = value;
    this.scale = [1, value, 1];
  }
  // **
  private _scaleZ: number = 1;
  public get scaleZ(): number {
    return this._scaleZ;
  }
  public set scaleZ(value: number) {
    this._scaleZ = value;
    this.scale = [1, 1, value];
  }

  // **
  private _rotationRadians: number | undefined;
  public get rotationRadians() {
    return this._rotationRadians || 0;
  }
  public set rotationRadians(value: number) {
    this._rotationRadians = toRadians(value);
    this.rotateXMatrix = new Matrix4().rotateY(this.rotationRadians);
  }

  // **************************
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

  setInitValues({ scale = [1, 1, 1], rotation }: Partial<Object3DInput> = {}) {
    this.scale = scale;

    this.scaleX = Array.isArray(scale) ? scale[0] : scale;
    this.scaleY = Array.isArray(scale) ? scale[1] : scale;
    this.scaleZ = Array.isArray(scale) ? scale[2] : scale;

    //this.obj3d.scale = scale;
    if (rotation) this.rotationRadians = rotation;

    this.setInitialcameraPosition();
    this.initMathsAnd3D();
    this.stretchPolygon();

    this.getPolygonDistance();
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
    this.polygons = polygons;
  }

  /* ****************** */

  setPoligonScale = (scale2: number) => {
    this.getNormal();
    if (!this.polygonToScale) throw new Error('Polygon not found');
    const normalTemp = this.polygonScaleNormal;
    const ggg = normalTemp.clone().multiplyByScalar(scale2);

    const [x, y, z] = ggg;
    this.stretchMatrix = new Matrix4().makeTranslation(+x, +y, +z);
    for (const iterator of this.polygonToScale.order) {
      const gghb: Vector4 = this.nodesHash[iterator];
      gghb.transform(this.stretchMatrix);
    }
  };

  getNormal(): Vector3 {
    let polygon: PolygonsRefNodes | undefined;
    if (this.polygonScaleId) {
      polygon = this.polygons?.find(
        (polygon) => polygon.id === this.polygonScaleId
      );
    } else {
      polygon = this.polygons?.find(
        (polygon) => polygon.axis === this.polygonAxisId
      );
    }
    if (!polygon) throw new Error('Polygon not found');
    this.polygonToScale = polygon;
    // INFO: get first 3 points of the polygon
    const [a, b, c] = Object.keys(polygon.nodesHash);

    const aVector2 = polygon.nodesHash[a].clone().slice(0, 3);
    const bVector2 = polygon.nodesHash[b].clone().slice(0, 3);
    const cVector2 = polygon.nodesHash[c].clone().slice(0, 3);

    const aVector = new Vector3(aVector2);
    const bVector = new Vector3(bVector2);
    const cVector = new Vector3(cVector2);

    const ba = bVector.subtract(aVector);

    const ca = cVector.subtract(aVector);
    const normal = ca.cross(ba).normalize();

    return normal;
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
    polygons: PolygonCubeObj[],
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
        PolygonsRef.push(tempPolygon);
      }
    }

    return PolygonsRef;
  }

  groupBy = <T>(
    array: Array<T>,
    property: (x: T) => string
  ): { [key: string]: Array<T> } =>
    array.reduce((memo: { [key: string]: Array<T> }, x: T) => {
      if (!memo[property(x)]) {
        memo[property(x)] = [];
      }
      memo[property(x)].push(x);
      return memo;
    }, {});

  // TODO: to delete?
  setAxisDistances() {
    this.getPolygonDistance();
  }

  getPolygonDistance() {
    if (!this.polygons) throw new Error('Polygons not found');

    const polygonsByaxis = this.groupBy(
      this.polygons,
      (x: PolygonsRefNodes) => x.axis
    );

    for (const key in polygonsByaxis) {
      if (Object.prototype.hasOwnProperty.call(polygonsByaxis, key)) {
        const opositeFaces = polygonsByaxis[key];
        const pointAId = opositeFaces[0].order[0];
        const pointBId = opositeFaces[1].order[0];
        const pointA = this.nodesHash[pointAId];
        const pointB = this.nodesHash[pointBId];
        const distance = pointA.distanceTo(pointB);

        this.distanceByAxis = {
          ...this.distanceByAxis,
          [key]: distance,
        };
      }
    }
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

    // INFO: The order of the polygons is important for choosing the correct normal
    // the first polygon to appear is the one that will be translated
    // see groupBy() method for more info
    // TODO: this is a temporary solution, need to find a better way to do this
    // i was trying to avoid to add more "control structures" and also the hash weight, but ...
    const polygonObjects: PolygonCubeObj[] = [
      { id: '2', points: [4, 7, 6, 5], opositeFace: '0', axis: 'z' },
      { id: '0', points: [0, 1, 2, 3], opositeFace: '2', axis: 'z' },
      { id: '1', points: [1, 5, 6, 2], opositeFace: '3', axis: 'x' },
      { id: '3', points: [0, 3, 7, 4], opositeFace: '1', axis: 'x' },
      { id: '4', points: [0, 4, 5, 1], opositeFace: '5', axis: 'y' },
      { id: '5', points: [3, 2, 6, 7], opositeFace: '4', axis: 'y' },
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
