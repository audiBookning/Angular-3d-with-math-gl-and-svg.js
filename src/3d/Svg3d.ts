import { toRadians } from '@math.gl/core';
import { G, SVG, Svg } from '@svgdotjs/svg.js';

import { Object3d } from './Object3d';
import {
  ConstructorOptions,
  DisplayPolygonsRefNodes,
  PolygonsRefNodes,
  SvgInput,
  SvgPolygonHash,
} from './types';

export class Svg3D {
  obj3d: Object3d;

  //
  svgPolygonHash: SvgPolygonHash = {};
  svgGroup: G;
  clearSvgFlag: boolean = true;
  svgDraw: Svg;

  polygonTemp: DisplayPolygonsRefNodes[] = [];
  ispinningFlag: boolean = false;

  constructor(
    obj3d: Object3d,
    svg: HTMLElement,
    { rotation = 0, svgWidth = 300, svgHeight = 300 }: Partial<SvgInput> = {}
  ) {
    this.obj3d = obj3d;
    obj3d.rotationRadians = rotation;
    this.svgDraw = SVG();
    this.svgDraw.addTo(svg).size(svgWidth, svgHeight);

    this.svgGroup = this.svgDraw.group();
  }

  svgdestroy() {
    this.ispinningFlag = false;
    this.polygonTemp = [];
    this.svgDraw.remove();
  }

  private drawPolygon = (polygonTemp: DisplayPolygonsRefNodes) => {
    if (!polygonTemp.color || !polygonTemp.id || !polygonTemp.nodes)
      throw new Error('No color found');

    if (this.clearSvgFlag) {
      const newPolygon = this.svgGroup
        .polygon(polygonTemp.nodes)
        .fill(polygonTemp.color);
      this.svgPolygonHash[polygonTemp.id] = newPolygon;
    } else {
      this.svgPolygonHash[polygonTemp.id].plot(polygonTemp.nodes);
      this.svgGroup.add(this.svgPolygonHash[polygonTemp.id]);
    }
  };

  private drawPolygonArray = () => {
    this.polygonTemp.forEach((polygon, index) => {
      this.drawPolygon(polygon);
    });
    this.svgGroup.center(150, 150);
  };

  private rotatePolygon() {
    this.obj3d.rotatePolygon();
  }

  // INFO: let the calls to animate pass by the ispinning flag first
  // this avoids some memory leaks that happenned in this project with possibly angular and requestAnimationFrame
  // because of not using zone??
  animateFrames() {
    this.ispinningFlag = true;
    this.renderAndUpdate();
  }

  private renderAndUpdate = () => {
    if (!this.ispinningFlag) return;
    if (this.clearSvgFlag) this.svgGroup.clear();
    this.polygonTemp = [];
    this.rotatePolygon();

    this.sortPolygonArray();

    this.drawPolygonArray();
    this.clearSvgFlag = false;
    requestAnimationFrame(this.renderAndUpdate);
  };

  private sortPolygonArray() {
    this.sortAndGetScreen();

    // sort polygons by zIndex
    this.polygonTemp = this.polygonTemp.sort((a, b) => {
      return (a.zIndex || 0) - (b.zIndex || 0);
    });
  }

  sortAndGetScreen() {
    // INFO: iterate over the polygons and get the screen points and zIndex
    for (let index = 0; index < this.obj3d.polygons.length; index++) {
      const ki = this.obj3d.polygons[index] || {};

      const newPolygonsRefNodes: DisplayPolygonsRefNodes = {
        ...this.getPolygonPoints(ki),
        color: this.obj3d.polygons[index].color,
        id: this.obj3d.polygons[index].id,
        order: this.obj3d.polygons[index].order,
      };
      this.polygonTemp.push(newPolygonsRefNodes);
    }
  }

  private getPolygonPoints(
    polygonHash: PolygonsRefNodes
  ): Partial<DisplayPolygonsRefNodes> {
    let zIndex: number = 0;

    const hhhhh = polygonHash.order.flatMap((index) => {
      const vect = polygonHash.nodes[index];
      const [pointX1, pointY1, PointZ] = this.obj3d.getScreenCoordinates(vect);
      zIndex += PointZ;
      return [pointX1, pointY1];
    });

    return { nodes: hhhhh, zIndex: zIndex };
  }
}
