import { Vector4 } from '@math.gl/core';
import { Polygon as SvgPolygon } from '@svgdotjs/svg.js';

export interface SvgPolygonHash {
  [key: string]: SvgPolygon;
}

export type ConstructorOptions = Object3DInput & SvgInput;

export interface Object3DInput {
  scale: number[];
}

export interface SvgInput {
  svgWidth: number;
  svgHeight: number;
  rotation: number;
}

export interface NodeHash {
  [key: string]: NodeVector;
}

export interface NodeVector {
  x: number;
  y: number;
  z: number;
  w?: number;
}

export interface Cube3d {
  points: VectorHash;
  polygons: PolygonsRefNodes[];
}

export interface VectorHash {
  [key: string]: Vector4;
}

export interface PolygonObj {
  points: Array<number>;
  id: string;
  color?: string;
}

export interface SortingPolygons {
  polygonPoints: number[];
  zIndex?: number;
  color?: string;
  id: string;
}

export interface PolygonsRefNodes {
  nodes: VectorHash;
  zIndex: number;
  color: string;
  id: string;
  order: number[];
}

export interface DisplayPolygonsRefNodes {
  nodes?: number[];
  zIndex?: number;
  color?: string;
  id?: string;
  order: number[];
}
