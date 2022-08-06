import { Vector4 } from '@math.gl/core';

// TODO: change the name to something with less probabily of collision with other names
export class Point {
  public node: Vector4;
  constructor(vect4: Vector4) {
    this.node = vect4;
  }
}
