import { BehaviorSubject, Subscription } from 'rxjs';

import { Matrix4, Vector2, Vector4 } from '@math.gl/core';

import { CameraSettings } from '../types/types';
import { SCALEDefaultCONSTANT } from '../utils/constants';
import { Camera } from './Camera';

export class Projection {
  public fullTransformMatrix!: Matrix4;

  private tempPerformanceVector: Vector4 = new Vector4();
  public perspectiveMatrix: Matrix4 | undefined;
  private fovy: number = Math.PI * 0.5;
  public camera: Camera;
  private cameraObs: BehaviorSubject<CameraSettings>;
  private cameraSubscription: Subscription;

  constructor() {
    this.camera = new Camera();
    this.setPerspectiveAndCameraMatrix();
    this.setFullTransformMatrix();
    this.cameraObs = this.camera.getObsCamera();
    // TODO: should be destroyed when component is destroyed
    this.cameraSubscription = this.cameraObs.subscribe((cameraObject) => {
      this.setFullTransformMatrix();
    });
  }

  public onDestroy() {
    if (this.cameraSubscription) this.cameraSubscription.unsubscribe();
  }

  public setPerspectiveAndCameraMatrix() {
    this.perspectiveMatrix = new Matrix4().orthographic({
      fovy: this.fovy,
      aspect: 1,
      near: 0,
      far: 1,
    });
    this.camera.setCameraDefaults();
  }

  public setFullTransformMatrix() {
    if (!this.perspectiveMatrix || !this.camera.cameraObject)
      throw new Error('Perspective matrix not initialized');

    const lookAt = this.perspectiveMatrix.lookAt(this.camera.cameraObject);

    this.fullTransformMatrix = lookAt.scale(SCALEDefaultCONSTANT);
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
    const [x, y, z] = transformV;

    return [x, y, z];
  }

  getInverseScreenCoordinates(vector: number[], z: number) {
    //

    const inverseMatrix = this.fullTransformMatrix.clone().invert();
    const [x, y] = vector;

    const transformVm1 = inverseMatrix.transform(
      [x, y, z, 0],
      this.tempPerformanceVector
    );

    return new Vector4(transformVm1);
  }
}
