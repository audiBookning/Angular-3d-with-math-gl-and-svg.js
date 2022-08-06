import { Injectable } from '@angular/core';
import { configure as glConfigure, Matrix4, toRadians } from '@math.gl/core';

import { Object3DInput, PolygonsRefNodes, VectorHash } from '../types/types';
import { Cube } from './cube/Cube';
import { Projection } from './Projection';

// INFO: This Class should deal with 3d objects in general
@Injectable({
  providedIn: 'root',
})
export class Object3d {
  public rotateXMatrix: Matrix4 | undefined;
  private stretchMatrix!: Matrix4;

  // Geometries
  private nodesHash: VectorHash | undefined;

  public cube!: Cube;
  public projection: Projection;

  private setRotationRadians(value: number) {
    const rotationRadians = toRadians(value);
    this.rotateXMatrix = new Matrix4().rotateY(rotationRadians);
  }

  // **************************
  constructor() {
    this.projection = new Projection();
    this.setRotationRadians(0);

    this.cube = new Cube();
  }

  /*
    ABSTRACTIONS
  */

  public updatePolygonsTransformId(
    polygonId: string | undefined,
    axis: string
  ) {
    this.cube.polygons.updatePolygonsTransformId(polygonId, axis);
  }

  public sortPolygonArray() {
    return this.cube.polygons.sortPolygonArray(this.projection);
  }

  /*
    ---------
  */
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

    this.cube.updatePolygonDistance(this.nodesHash);
  }

  private initMathsAnd3D() {
    // INFO: Math.gl performance config. Doesn't seem to do much in this basic case.
    glConfigure({ debug: false });

    // TODO: refactor the points and polygons to get only accessed through the cube?
    const { points } = this.cube;
    this.nodesHash = points.nodes;

    this.stretchMatrix = new Matrix4().scale([1, 1, 1]);
  }

  /*
    POLYGONS
  */

  // TODO: refactor - move to polygon class,
  // but this has a tight dependency on the stretch matrix
  // and it is a public method
  public updatePolygonsScaleAndDistance(scale: number) {
    this.cube.polygons.transformPoligonByScale(
      scale,
      this.nodesHash,
      this.stretchMatrix
    );

    this.cube.polygons.updatePolygonDistance(this.nodesHash);
  }

  /*
    TRANSFORM Objects
  */

  public rotateObj() {
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
}
