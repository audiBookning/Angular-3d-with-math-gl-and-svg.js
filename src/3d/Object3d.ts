import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';

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
  CameraSettings,
  CameraSettingsInputs,
  Cube3d,
  NodeHash,
  Object3DInput,
  PolygonCubeObj,
  PolygonDistByAxis,
  PolygonsByaxis,
  PolygonsRefNodes,
  VectorHash,
} from './types';

@Injectable({
  providedIn: 'root',
})
export class Object3d {
  defaultCameraSettings: CameraSettingsInputs = {
    eye: new Vector3([1, 1, 1]),
    center: new Vector3([0, 0, 0]),
    up: new Vector3([0, 1, 0]),
  };
  // Math.gl
  // pseudo constants as long as the camera is not changed
  private fullTransformMatrix!: Matrix4;
  private perspectiveMatrix: Matrix4 | undefined;
  public rotateXMatrix: Matrix4 | undefined;
  private stretchMatrix!: Matrix4;
  private fovy: number = Math.PI * 0.5;

  // Temp variables for Performance
  private tempPerformanceVector: Vector4 = new Vector4();

  // Geometries
  private nodesHash: VectorHash | undefined;
  public polygons: PolygonsRefNodes[] | undefined;
  public distanceByAxis: PolygonDistByAxis | undefined;

  // Camera

  private cameraLookAt!: Vector3;

  // TODO: Should be merged on a single object?
  private polygonScaleId: string | undefined;
  private polygonToScale: PolygonsRefNodes | undefined;
  // **
  private _polygonScaleNormal: Vector3 | undefined;
  private polygonAxisId: string | undefined;

  public get polygonScaleNormal(): Vector3 {
    const hytg = this.getPolygonNormal();
    return this._polygonScaleNormal || hytg;
  }
  public set polygonScaleNormal(value: Vector3) {
    this._polygonScaleNormal = value;
  }
  // Camera
  private _cameraObject: CameraSettings | undefined;
  public get cameraObject(): CameraSettings {
    if (!this._cameraObject) throw new Error('Camera not initialized');
    return this._cameraObject;
  }
  public set cameraObject(value: CameraSettings) {
    this._cameraObject = value;
    this.setFullTransformMatrix();
    this.cameraObservable.next(this._cameraObject);
  }

  cameraObservable: BehaviorSubject<CameraSettings>;

  // **

  private setRotationRadians(value: number) {
    const rotationRadians = toRadians(value);
    this.rotateXMatrix = new Matrix4().rotateY(rotationRadians);
  }

  // **************************
  constructor() {
    this.setRotationRadians(0);
    this.cameraObservable = new BehaviorSubject<CameraSettings>({
      eye: new Vector3([1, 1, 1]),
      center: new Vector3([0, 0, 0]),
      up: new Vector3([0, 1, 0]),
    });
  }

  testObsCamera() {
    this.cameraObservable.next(this.cameraObject);
    //requestAnimationFrame(this.testObsCamera);
  }

  private setPerspectiveAndCameraMatrix() {
    this.perspectiveMatrix = new Matrix4().orthographic({
      fovy: this.fovy,
      aspect: 1,
      near: 0,
      far: 1,
    });
    this.setCameraDefaults();
  }

  setCameraDefaults() {
    this.cameraObject = {
      eye: new Vector3([1, 1, 1]),
      center: new Vector3([0, 0, 0]),
      up: new Vector3([0, 1, 0]),
    };
  }

  public setInitValues({
    scale = [1, 1, 1],
    rotation,
  }: Partial<Object3DInput> = {}) {
    const scaleX = Array.isArray(scale) ? scale[0] : scale;
    const scaleY = Array.isArray(scale) ? scale[1] : scale;
    const scaleZ = Array.isArray(scale) ? scale[2] : scale;

    this.stretchMatrix = new Matrix4().scale([scaleX, scaleY, scaleZ]);

    if (rotation) this.setRotationRadians(rotation);

    this.initMathsAnd3D();
    this.stretch3dObject();

    this.updatePolygonDistance();

    this.cameraObservable.next(this.cameraObject);
  }

  private initMathsAnd3D() {
    // INFO: Math.gl performance config. Doesn't seem to do much in this basic case.
    glConfigure({ debug: false });

    this.setPerspectiveAndCameraMatrix();

    const { points, polygons } = this.generateCube();
    this.nodesHash = points;
    this.polygons = polygons;

    this.stretchMatrix = new Matrix4().scale([1, 1, 1]);
  }

  /*
    POLYGONS
  */

  public updatePolygonsTransformId(
    polygonId: string | undefined,
    axis: string
  ) {
    this.polygonScaleId = polygonId;
    this.polygonAxisId = axis;
  }

  public updatePolygonsScaleAndDistance(scale: number) {
    this.transformPoligonByScale(scale);

    this.updatePolygonDistance();
  }

  private transformPoligonByScale = (scale2: number) => {
    if (!this.nodesHash) throw new Error('nodesHash is undefined');

    this.getPolygonNormal();
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

  private getPolygonNormal(): Vector3 {
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

  // INFO: Update the distance of the opposite polygons
  public updatePolygonDistance() {
    if (!this.nodesHash) throw new Error('nodesHash is undefined');
    if (!this.polygons) throw new Error('Polygons not found');

    const polygonsByaxis: PolygonsByaxis = this.groupBy(
      this.polygons,
      (x: PolygonsRefNodes) => x.axis
    );

    for (let [key, value] of Object.entries(polygonsByaxis)) {
      if (Object.prototype.hasOwnProperty.call(polygonsByaxis, key)) {
        const opositeFaces = value;
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

  /*
    CAMERA
  */
  public rotateCamera(rotInput: number) {
    if (!this.perspectiveMatrix || !this._cameraObject)
      throw new Error('Perspective matrix not initialized');
    const origin = this.cameraLookAt;
    const rotationVector = this._cameraObject.eye;

    const radians = toRadians(rotInput);
    const newCameraPosition = rotationVector.rotateY({
      radians: radians,
      origin,
    });

    //this._cameraObject.eye = newCameraPosition;
    this.updateCameraSettings({ eye: newCameraPosition });
  }

  updateCameraSettings({ eye, center, up }: CameraSettingsInputs) {
    //
    if (!this._cameraObject)
      throw new Error('Perspective matrix not initialized');

    this.cameraObject = {
      ...this._cameraObject,
      ...(eye && { eye }),
      ...(center && { center }),
      ...(up && { up }),
    };
  }

  /*
    Transform Objects
  */
  // INFO: Rotate the 3d object
  public rotatePolygon() {
    if (this.rotateXMatrix === undefined) {
      return;
    }

    for (const key in this.nodesHash) {
      if (Object.prototype.hasOwnProperty.call(this.nodesHash, key)) {
        this.nodesHash[key] = this.nodesHash[key].transform(this.rotateXMatrix);
      }
    }
  }

  private stretch3dObject() {
    for (const key in this.nodesHash) {
      if (Object.prototype.hasOwnProperty.call(this.nodesHash, key)) {
        this.nodesHash[key] = this.nodesHash[key].transform(this.stretchMatrix);
      }
    }
  }

  /*
    Set transform matrixes
  */
  // Convert Vextor4 to array of 3 numbers
  public getScreenCoordinates(vector: Vector4) {
    if (!this.fullTransformMatrix)
      throw new Error('fullTransformMatrix is undefined');
    if (!this.tempPerformanceVector)
      throw new Error('tempPerformanceVector is undefined');

    const transformV = this.fullTransformMatrix.transform(
      vector,
      this.tempPerformanceVector
    );

    const [x, y, Z] = transformV;
    return [x, y, Z];
  }

  private setFullTransformMatrix() {
    if (!this.perspectiveMatrix || !this._cameraObject)
      throw new Error('Perspective matrix not initialized');

    const lookAt = this.perspectiveMatrix.lookAt(this._cameraObject);

    this.fullTransformMatrix = lookAt.scale(SCALEDefaultCONSTANT);
  }

  /*
    UTILS - Cube
  */
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

  /*
    UTILS - general
   */
  private groupBy = <T>(
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

  // Convert polygon array to a PolygonsRefNodes object
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
}
