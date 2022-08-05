import { Matrix4, Vector3, Vector4 } from '@math.gl/core';

import {
  DisplayPolygonsRefNodes,
  PolygonCubeObj,
  PolygonDistByAxis,
  PolygonsByaxis,
  PolygonsRefNodes,
  VectorHash,
} from '../types/types';
import { GroupBy } from '../utils/utils';
import { Projection } from './Projection';

export class Polygons {
  public polygons!: PolygonsRefNodes[];
  public distanceByAxis: PolygonDistByAxis | undefined;
  public polygonScaleId: string | undefined;
  public polygonAxisId: string | undefined;
  public polygonToScale: PolygonsRefNodes | undefined;

  private _polygonScaleNormal: Vector3 | undefined;

  public get polygonScaleNormal(): Vector3 {
    const hytg = this.getPolygonNormal();
    return this._polygonScaleNormal || hytg;
  }
  public set polygonScaleNormal(value: Vector3) {
    this._polygonScaleNormal = value;
  }

  constructor(polygons: PolygonsRefNodes[]) {
    this.polygons = polygons;
  }

  // TODO: should this method be here in this manner?
  // it is kind of specific to the svg class...
  public sortPolygonArray(projection: Projection) {
    let polygonTemp: DisplayPolygonsRefNodes[] = [];

    if (!this.polygons) throw new Error('No polygons found');
    // INFO: iterate over the polygons and get the screen points and zIndex
    for (let index = 0; index < this.polygons.length; index++) {
      const ki = this.polygons[index] || {};

      const newPolygonsRefNodes: DisplayPolygonsRefNodes = {
        ...this.getPolygonPoints(ki, projection),
        color: this.polygons[index].color,
        id: this.polygons[index].id,
        order: this.polygons[index].order,
        axis: this.polygons[index].axis,
        opositeFace: this.polygons[index].opositeFace,
      };
      polygonTemp.push(newPolygonsRefNodes);
    }
    polygonTemp = polygonTemp.sort((a, b) => {
      return (a.zIndex || 0) - (b.zIndex || 0);
    });
    return polygonTemp;
  }

  // TODO: should this method be here in this manner?
  // it is kind of specific to the svg class...
  private getPolygonPoints(
    polygonHash: PolygonsRefNodes,
    projection: Projection
  ): Partial<DisplayPolygonsRefNodes> {
    let zIndex: number = 0;

    const hhhhh = polygonHash.order.flatMap((index) => {
      const vect = polygonHash.nodesHash[index];
      const [pointX1, pointY1, PointZ] = projection.getScreenCoordinates(vect);
      zIndex += PointZ;
      return [pointX1, pointY1];
    });

    return { nodes: hhhhh, zIndex: zIndex };
  }

  // TODO: refactor - since there is already a reference to the nodes in the polygons
  public transformPoligonByScale = (
    scale2: number,
    nodesHash: VectorHash | undefined,
    stretchMatrix: Matrix4
  ) => {
    if (!nodesHash) throw new Error('nodesHash is undefined');

    this.getPolygonNormal();
    if (!this.polygonToScale) throw new Error('Polygon not found');
    const normalTemp = this.polygonScaleNormal;
    const ggg = normalTemp.clone().multiplyByScalar(scale2);

    const [x, y, z] = ggg;
    stretchMatrix = new Matrix4().makeTranslation(+x, +y, +z);
    for (const iterator of this.polygonToScale.order) {
      const gghb: Vector4 = nodesHash[iterator];
      gghb.transform(stretchMatrix);
    }
  };

  public updatePolygonsTransformId(
    polygonId: string | undefined,
    axis: string
  ) {
    this.polygonScaleId = polygonId;
    this.polygonAxisId = axis;
  }

  public getPolygonNormal(): Vector3 {
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

  // TODO: Refactor - since there is already a reference to the nodes in the polygons
  // there is no need to pass it as a parameter
  // unless this is a static method
  // INFO: Update the distance of the opposite polygons
  public updatePolygonDistance(nodesHash: VectorHash | undefined) {
    if (!nodesHash) throw new Error('nodesHash is undefined');
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
        const pointA = nodesHash[pointAId];
        const pointB = nodesHash[pointBId];
        const distance = pointA.distanceTo(pointB);

        this.distanceByAxis = {
          ...this.distanceByAxis,
          [key]: distance,
        };
      }
    }
  }

  // Convert polygon array to a PolygonsRefNodes object
  static getNodesReferenceByPolygons(
    polygonObjects: PolygonCubeObj[],
    nodesVector: VectorHash
  ) {
    // INFO: iterate over the polygons and get the nodes reference
    const polygonsTemp = [];
    for (const key in polygonObjects) {
      if (Object.prototype.hasOwnProperty.call(polygonObjects, key)) {
        const polygon = polygonObjects[key];

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
        polygonsTemp.push(tempPolygon);
      }
    }
    return new Polygons(polygonsTemp);
  }
}
