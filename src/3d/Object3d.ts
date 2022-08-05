import { Injectable } from '@angular/core';
import {
  configure as glConfigure,
  Matrix4,
  toRadians,
  Vector3,
  Vector4,
} from '@math.gl/core';

import { Camera } from './Camera';
import { SCALEDefaultCONSTANT } from './constants';
import { GenerateCube } from './GenerateCube';
import {
  Object3DInput,
  PolygonDistByAxis,
  PolygonsByaxis,
  PolygonsRefNodes,
  VectorHash,
} from './types';
import { GroupBy } from './utils';

@Injectable({
  providedIn: 'root',
})
export class Object3d {
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

  camera: Camera;

  // TODO: Should be merged on a single object?
  private polygonScaleId: string | undefined;
  private polygonToScale: PolygonsRefNodes | undefined;
  // **
  private _polygonScaleNormal: Vector3 | undefined;
  private polygonAxisId: string | undefined;
  cube!: GenerateCube;

  public get polygonScaleNormal(): Vector3 {
    const hytg = this.getPolygonNormal();
    return this._polygonScaleNormal || hytg;
  }
  public set polygonScaleNormal(value: Vector3) {
    this._polygonScaleNormal = value;
  }

  // **

  private setRotationRadians(value: number) {
    const rotationRadians = toRadians(value);
    this.rotateXMatrix = new Matrix4().rotateY(rotationRadians);
  }

  // **************************
  constructor() {
    this.setRotationRadians(0);
    this.camera = new Camera();
    this.setPerspectiveAndCameraMatrix();
    this.setFullTransformMatrix();
    this.camera.cameraObservable.subscribe((cameraObject) => {
      this.setFullTransformMatrix();
    });
    this.cube = new GenerateCube();
  }

  pingObsCamera() {
    this.camera.pingObsCamera();
  }

  private setPerspectiveAndCameraMatrix() {
    this.perspectiveMatrix = new Matrix4().orthographic({
      fovy: this.fovy,
      aspect: 1,
      near: 0,
      far: 1,
    });
    this.camera.setCameraDefaults();
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

    // Todo: return the observable instead of executing it here
  }

  private initMathsAnd3D() {
    // INFO: Math.gl performance config. Doesn't seem to do much in this basic case.
    glConfigure({ debug: false });

    // TODO: refactor the points and polygons to get only accessed through the cube?
    const { points, polygons } = this.cube;
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

    const polygonsByaxis: PolygonsByaxis = GroupBy(
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
    if (!this.perspectiveMatrix || !this.camera.cameraObject)
      throw new Error('Perspective matrix not initialized');

    const lookAt = this.perspectiveMatrix.lookAt(this.camera.cameraObject);

    this.fullTransformMatrix = lookAt.scale(SCALEDefaultCONSTANT);
  }
}
