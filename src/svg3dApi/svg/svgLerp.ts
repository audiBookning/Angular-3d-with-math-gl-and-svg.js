import { Injectable } from '@angular/core';
import { G, SVG, Svg } from '@svgdotjs/svg.js';

import { LerpLines } from '../3d/lerp/LerpLines';
import { Line } from '../3d/Line';
import { Projection } from '../3d/Projection';
import { SvgInput } from '../types/types';
import { color_generator } from '../utils/utils';

@Injectable({
  providedIn: 'root',
})
export class SvgLerp {
  private obj3d: LerpLines;
  private projection: Projection;
  private autoScaleFlag: boolean = true;
  private autoCenterFlag: boolean = true;

  private svgGroup: G | Svg | undefined;
  private clearSvgFlag: boolean = true;
  private svgDraw: Svg | undefined;

  constructor() {
    this.obj3d = LerpLines.generateLerpLine();
    this.projection = new Projection();
  }

  public setSVG(
    svg: HTMLElement,
    { svgWidth = 300, svgHeight = 300 }: Partial<SvgInput> = {}
  ) {
    this.svgDraw = SVG();
    this.svgDraw.addTo(svg).size(svgWidth, svgHeight);

    this.svgGroup = this.svgDraw.group();
    //this.svgGroup = this.svgDraw.nested();
  }

  public toggleAutoCenter(ischecked: boolean): void {
    this.autoCenterFlag = ischecked;
    this.updateAndRender();
  }

  public toggleAutoScale(ischecked: boolean) {
    this.autoScaleFlag = ischecked;
    this.updateAndRender();
  }

  public updateAndRender = (lerpFactor?: number) => {
    if (!this.svgGroup) throw new Error('No obj3d found');
    if (!this.obj3d) throw new Error('No obj3d found');
    if (lerpFactor !== undefined) this.obj3d.lerpFactor = lerpFactor;

    if (this.clearSvgFlag) this.svgGroup.clear();
    this.drawLinesArray();
    //if (this.autoCenterFlag) this.svgGroup.center(150, 150);
    //this.clearSvgFlag = false;
    //this.scaleSvgGroup();
  };

  drawPolygon(lines: Line[]) {
    if (!this.svgGroup) return;

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

    this.svgGroup?.attr('transform', null);
    const svgPolygon = this.svgGroup
      ?.polygon(screenPolygon)
      .opacity(0.3)
      // Note: these ever changing random colors are not good for the user experience
      .fill(color_generator());

    this.svgGroup.move(100, 100).scale(3);

    svgPolygon?.on('mouseover', (event) => {
      const ev = event as PointerEvent;
      if (!this.svgGroup) return;

      const pt = new DOMPointReadOnly(ev.clientX, ev.clientY).matrixTransform(
        this.svgGroup.node.getScreenCTM()?.inverse()
      );

      console.log('mousemove pt', pt.x, pt.y);
    });
  }

  drawLinesArray() {
    const lines = this.obj3d.getLines();

    for (const line of lines) {
      this.drawLine(line);
    }
    this.drawPolygon(lines);
    //if (this.autoCenterFlag) this.svgGroup?.center(150, 150);
  }

  drawLine(line: Line) {
    const vects4 = line.getVectors().flatMap((vect) => {
      const [pointX1, pointY1] = this.projection.getScreenCoordinates(vect);

      return [pointX1, pointY1];
    });

    this.svgGroup?.line(vects4).stroke({ width: 1, color: color_generator() });
  }

  private scaleSvgGroup() {
    this.svgGroup?.attr('transform', null);
    if (!this.autoScaleFlag) return;

    const getPercent = (size: number, percent: number) =>
      (size / 100) * percent;
    const svgW = this.svgDraw?.width() as number;
    const svgH = this.svgDraw?.height() as number;

    const svgWPercent = getPercent(svgW, 80);
    const svgHPercent = getPercent(svgH, 80);

    // TODO: if the width and height are not set, this will give infinity as the scale value
    const groupWidth = (this.svgGroup?.width() as number) || svgWPercent;
    const groupHeigh = (this.svgGroup?.height() as number) || svgHPercent;

    const scaleafactorW = svgWPercent / groupWidth;
    const scaleafactorH = svgHPercent / groupHeigh;

    this.svgGroup?.scale(scaleafactorW, scaleafactorH);

    const viewbox = this.svgDraw?.viewbox();
  }

  onDestroy() {
    console.log('onDestroy');
    this.obj3dReset();

    this.clearSvgFlag = true;
    if (this.svgDraw && this.svgGroup) {
      this.svgDraw.remove();
      //this.svgGroup.remove();
    }
  }

  obj3dReset() {
    this.projection.onDestroy();
    this.obj3d = LerpLines.generateLerpLine();
  }
}
