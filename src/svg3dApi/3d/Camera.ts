import { BehaviorSubject } from 'rxjs';

import { toRadians, Vector3 } from '@math.gl/core';

import { CameraSettings, CameraSettingsInputs } from '../types/types';

export class Camera {
  private _cameraObject: CameraSettings | undefined;
  public get cameraObject(): CameraSettings {
    if (!this._cameraObject) throw new Error('Camera not initialized');
    return this._cameraObject;
  }
  public set cameraObject(value: CameraSettings) {
    this._cameraObject = value;

    this.cameraObservable.next(this._cameraObject);
  }
  public cameraObservable: BehaviorSubject<CameraSettings>;
  private cameraDefaults = {
    eye: new Vector3([1, 1, 1]),
    center: new Vector3([0, 0, 0]),
    up: new Vector3([0, 1, 0]),
  };
  private cameraLookAt!: Vector3;

  constructor() {
    this.cameraObservable = new BehaviorSubject<CameraSettings>(
      this.cameraDefaults
    );
  }

  public getObsCamera(): BehaviorSubject<CameraSettings> {
    return this.cameraObservable;
  }

  public setCameraDefaults() {
    this.cameraObject = this.cameraDefaults;
  }

  public rotateCamera(rotInput: number) {
    if (!this.cameraObject)
      throw new Error('Perspective matrix not initialized');
    const origin = this.cameraLookAt;
    const rotationVector = this.cameraObject.eye;

    const radians = toRadians(rotInput);
    const newCameraPosition = rotationVector.rotateY({
      radians: radians,
      origin,
    });

    //this._cameraObject.eye = newCameraPosition;
    this.updateCameraSettings({ eye: newCameraPosition });
  }

  public updateCameraSettings({ eye, center, up }: CameraSettingsInputs) {
    //
    if (!this.cameraObject)
      throw new Error('Perspective matrix not initialized');

    this.cameraObject = {
      ...this.cameraObject,
      ...(eye && { eye }),
      ...(center && { center }),
      ...(up && { up }),
    };
  }
}
