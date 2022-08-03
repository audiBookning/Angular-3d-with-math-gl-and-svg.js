import { Easing } from 'popmotion';

import { Vector4 } from '@math.gl/core';
import { Polygon as SvgPolygon } from '@svgdotjs/svg.js';

// 3d
export interface Cube3d {
  points: VectorHash;
  polygons: PolygonsRefNodes[];
}

export interface VectorHash {
  [key: string]: Vector4;
}

export interface NodeHash {
  [key: string]: NodeVector;
}

// Types for laziness sake.
// Could be removed if the 3d points are converted to vector4 at the origin
// The advantage is that they are not tightly coupled to Math.gl
// if latter ones want to load them from the component.
export interface NodeVector {
  x: number;
  y: number;
  z: number;
  w?: number;
}

export interface PolygonDistByAxis {
  x?: number;
  y?: number;
  z?: number;
}

interface PolygonBasic {
  id: string;
  color?: string;
  // specific to cubes
  axis: string;
  opositeFace: string;
}
interface SortedPolygon {
  zIndex?: number;
  order: number[];
}

// TODO: Use of hash for polygons migh not be needed in general.
// That way one can avoid converting back and forth between array and hash
export interface PolygonsRefNodes extends PolygonBasic, SortedPolygon {
  nodesHash: VectorHash;
}

export interface PolygonCubeObj extends PolygonBasic {
  points: Array<number>;
}

export interface Object3DInput {
  scale?: number[];
  rotation?: number;
}

// SVG
export interface DisplayPolygonsRefNodes extends PolygonBasic, SortedPolygon {
  nodes?: number[];
}

export interface SvgPolygonHash {
  [key: string]: SvgPolygon;
}

export interface SvgInput {
  svgWidth: number;
  svgHeight: number;
}

export interface ClickObservable {
  id: string;
  axis: string;
}

// Popmotion
export interface EasingHash {
  [key: string]: Easing;
}

// Component

export interface DistanceInputs {
  id?: string;
  axis: string;
  scale: number;
  // distances
  x?: number;
  y?: number;
  z?: number;
}
