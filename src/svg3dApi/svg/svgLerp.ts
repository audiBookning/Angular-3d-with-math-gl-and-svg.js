import '@svgdotjs/svg.draggable.js';

import { Injectable } from '@angular/core';
import {
  Box,
  G,
  Line as LineSvg,
  Polygon as SVGPolygon,
  Rect,
  SVG,
  Svg,
} from '@svgdotjs/svg.js';

import { LerpLines } from '../3d/lerp/LerpLines';
import { Line } from '../3d/Line';
import { Projection } from '../3d/Projection';
import { SvgInput } from '../types/types';
import { color_generator } from '../utils/utils';

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root',
})
export class SvgLerp {
  private obj3d: LerpLines;
  private projection: Projection;

  moveGroup: [number, number] = [0, 0];

  private svgGroup: G | Svg;

  private svgDraw: Svg;
  constraintBox: Box | undefined;
  svgPolygon: SVGPolygon | undefined;
  lines: Line[] | undefined;
  rectBox: Rect | undefined;
  svgLerpLine: LineSvg | undefined;
  // TODO: move defaults to separate config file?
  defaultViewBox: ViewBox = { x: -60, y: -60, width: 100, height: 100 };

  constructor() {
    this.obj3d = LerpLines.generateDefaultLerpLine();
    this.projection = new Projection();
    this.svgDraw = SVG();
    this.svgDraw.viewbox(
      this.defaultViewBox.x,
      this.defaultViewBox.y,
      this.defaultViewBox.width,
      this.defaultViewBox.height
    );
    this.svgGroup = this.svgDraw.group();
  }

  public setViewBox(viewbox: ViewBox) {
    const { x = -60, y = -60, width = 100, height = 100 }: ViewBox = viewbox;
    this.svgDraw.viewbox(x, y, width, height);
  }

  public getLerpObservable() {
    return this.obj3d?.lerpObservable;
  }

  public setSVG(
    svg: HTMLElement,
    { svgWidth = 150, svgHeight = 150 }: Partial<SvgInput> = {}
  ) {
    this.svgDraw.addTo(svg).size(svgWidth, svgHeight);
  }

  public updateAndRender = (lerpFactor?: number) => {
    if (!this.svgGroup) throw new Error('No obj3d found');
    if (!this.obj3d) throw new Error('No obj3d found');
    if (lerpFactor !== undefined) this.obj3d.lerpFactor = lerpFactor;

    this.drawLinesArray();
  };

  private drawPolygon(lines: Line[]) {
    if (!this.svgGroup) return;

    // TODO: Move to static method on Polygon class?
    // should be a different polygon class than the one existing now
    const originalPointA = lines[0].getVectors()[0];
    const originalPointB = lines[0].getVectors()[1];
    const originalPointC = lines[1].getVectors()[1];
    const originalPointD = lines[1].getVectors()[0];

    const vects = [
      originalPointA,
      originalPointB,
      originalPointC,
      originalPointD,
    ];

    const screenPolygon = vects.flatMap((vect) => {
      const [pointX1, pointY1] = this.projection.getScreenCoordinates(vect);
      return [pointX1, pointY1];
    });

    this.svgPolygon = this.svgGroup
      .polygon(screenPolygon)
      .opacity(0.3)

      .fill(color_generator());

    this.constraintBox = this.svgPolygon.bbox();

    this.svgDraw.viewbox(
      this.constraintBox.x - 10,
      this.constraintBox.y - 10,
      this.constraintBox.width + 10,
      this.constraintBox.height + 10
    );
  }

  // TODO: not needed?
  private getTransformMatrix(box: Box) {
    let { x, y } = box;
    const transconsolidate = this.svgGroup.node.transform.baseVal.consolidate();
    if (transconsolidate) {
      const transMatrix = transconsolidate.matrix;

      const pt = new DOMPointReadOnly(x, y).matrixTransform(
        transMatrix.inverse()
      );
    }
  }

  private drawLinesArray() {
    if (!this.lines || this.lines.length === 0) {
      this.lines = this.obj3d.getBaseLines();
      for (const line of this.lines) {
        this.drawLine(line, 'base');
      }
    }

    if (!this.svgPolygon) this.drawPolygon(this.lines);
    if (!this.constraintBox) this.constraintBox = this.svgGroup.bbox();

    const lerp = this.obj3d.lerpLine;
    this.drawLine(lerp, 'lerp');
  }

  private drawLine(line: Line, type: string) {
    const vects4 = line.getVectors().flatMap((vect) => {
      const [pointX1, pointY1] = this.projection.getScreenCoordinates(vect);

      return [pointX1, pointY1];
    });

    if (type !== 'lerp') {
      const svgLine = SVG()
        .line(vects4)
        .stroke({ width: 1, color: color_generator() });

      svgLine.addTo(this.svgGroup);
      const baseBbox = svgLine.bbox();
    } else if (!this.svgLerpLine) {
      this.svgLerpLine = SVG()
        .line(vects4)
        .stroke({ width: 1, color: color_generator() });

      const lerpBbox = this.svgLerpLine.bbox();

      if (this.rectBox) this.rectBox.remove();
      this.rectBox = this.svgGroup.rect(lerpBbox.width, lerpBbox.height);
      this.rectBox.fill('#f55');
      this.rectBox.opacity(0.6);

      this.svgLerpLine.addTo(this.svgGroup);

      this.rectBox.x(lerpBbox.x);
      this.rectBox.y(lerpBbox.y);
      this.rectBox.after(this.svgLerpLine);

      let boxCache: { x: number; y: number };

      this.rectBox.draggable().on('dragmove', (event) => {
        event.preventDefault();

        if (!this.constraintBox) throw new Error('No constraintBox found');

        //@ts-ignore
        const { handler, box }: { handler: any; box: Box } = event.detail;
        let { x, y } = box;

        if (!this.constraintBox) throw new Error('constraintBox is not set');

        if (x < this.constraintBox.x) {
          x = this.constraintBox.x;
        }

        if (box.x2 > this.constraintBox.x2) {
          x = this.constraintBox.x2 - box.w;
        }

        if (y < this.constraintBox.y) {
          y = this.constraintBox.y;
        }

        if (box.y2 > this.constraintBox.y2) {
          y = this.constraintBox.y2 - box.h;
        }

        if (boxCache && boxCache.x === x && boxCache.y === y) return;
        boxCache = { x, y };

        this.rectBox!.x(x);
        this.rectBox!.y(y);

        const percent =
          1 -
          (y - this.constraintBox.y) / (this.constraintBox.height - box.height);

        handler.move(x, y);

        this.updateAndRender(percent);
      });
    } else if (this.svgLerpLine) {
      this.svgLerpLine.plot(vects4);
    }
  }

  // TODO: not needed?
  private getLinePointsFromBox(box: Box) {
    const pointAX = box.x;
    const pointAY = box.y + box.height;
    const pointBX = box.x + box.width;
    const pointBY = box.y;

    const pointA = this.projection.getInverseScreenCoordinates(
      [pointAX, pointAY],
      1
    );
    const pointB = this.projection.getInverseScreenCoordinates(
      [pointBX, pointBY],
      1
    );

    return [pointA, pointB];
  }

  public onDestroy() {
    this.obj3dReset();

    this.svgDraw.remove();
  }

  private obj3dReset() {
    this.projection.onDestroy();
    this.obj3d = LerpLines.generateDefaultLerpLine();
  }
}
