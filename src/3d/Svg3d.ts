import {
  animate,
  anticipate,
  backIn,
  backInOut,
  backOut,
  circIn,
  circInOut,
  circOut,
  easeIn,
  easeInOut,
  easeOut,
  Easing,
  linear,
} from 'popmotion';
import { Subject } from 'rxjs';

import { Injectable, NgZone } from '@angular/core';
import { Vector3 } from '@math.gl/core';
import { G, SVG, Svg } from '@svgdotjs/svg.js';

import { Object3d } from './Object3d';
import {
  DisplayPolygonsRefNodes,
  Object3DInput,
  PolygonsRefNodes,
  SvgInput,
  SvgPolygonHash,
} from './types';

interface EasingHash {
  [key: string]: Easing;
}

@Injectable({
  providedIn: 'root',
})
export class Svg3D {
  //
  private svgPolygonHash: SvgPolygonHash = {};
  private svgGroup: G | undefined;
  private clearSvgFlag: boolean = true;
  private svgDraw: Svg | undefined;

  private polygonTemp: DisplayPolygonsRefNodes[] = [];
  private ispinningFlag: boolean = false;

  // Popmotion
  private playback: {
    stop: () => void;
  } | null = null;

  private lastStep: number = 0;

  obj3d: Object3d;

  resetObj3DInput: Object3DInput | undefined;

  // Popmotion
  tweens: EasingHash[] = [
    { linear: linear },
    { easeIn: easeIn },
    { easeOut: easeOut },
    { easeInOut: easeInOut },
    { circIn: circIn },
    { circOut: circOut },
    { circInOut: circInOut },
    { backIn: backIn },
    { backOut: backOut },
    { backInOut: backInOut },
    { anticipate: anticipate },
    //{'cubicBezier': cubicBezier},
  ];
  clickObservable: Subject<string>;
  requestAFID: number | undefined;
  animateCameraDegree: number | undefined;

  constructor(private zone: NgZone) {
    this.obj3d = new Object3d();
    this.clickObservable = new Subject<string>();
  }

  obj3dSet({ scale = [1, 1, 1], rotation }: Partial<Object3DInput> = {}) {
    this.resetObj3DInput = { scale, rotation };
    this.obj3d.set({ scale, rotation });
  }

  obj3dReset() {
    this.obj3d = new Object3d();
    this.obj3dSet(this.resetObj3DInput);
  }

  set(
    svg: HTMLElement,
    { svgWidth = 300, svgHeight = 300 }: Partial<SvgInput> = {}
  ) {
    this.svgdestroy();

    this.svgDraw = SVG();
    this.svgDraw.addTo(svg).size(svgWidth, svgHeight);

    this.svgGroup = this.svgDraw.group();
  }

  svgdestroy() {
    this.obj3dReset();
    this.ispinningFlag = false;
    this.polygonTemp = [];
    this.svgPolygonHash = {};
    if (this.requestAFID) cancelAnimationFrame(this.requestAFID);

    this.clearSvgFlag = true;
    if (this.svgDraw && this.svgGroup) {
      this.svgDraw.remove();
      //this.svgGroup.remove();
    }
  }

  private drawPolygon = (polygonTemp: DisplayPolygonsRefNodes) => {
    if (
      !polygonTemp.color ||
      !polygonTemp.id ||
      !polygonTemp.nodes ||
      !this.svgGroup
    )
      throw new Error('No color found');

    if (this.clearSvgFlag) {
      const newPolygon = this.svgGroup
        .polygon(polygonTemp.nodes)
        .fill(polygonTemp.color);

      newPolygon.data('id', polygonTemp.id);

      newPolygon.click((event: PointerEvent) => {
        if (event !== null && event.target instanceof SVGPolygonElement) {
          const data: DOMStringMap = event.target.dataset as DOMStringMap;

          this.clickObservable.next(data['id'] || '');
        }
      });

      this.svgPolygonHash[polygonTemp.id] = newPolygon;
    } else {
      this.svgPolygonHash[polygonTemp.id].plot(polygonTemp.nodes);
      this.svgGroup.add(this.svgPolygonHash[polygonTemp.id]);
    }
  };

  private drawPolygonArray = () => {
    if (!this.svgGroup) throw new Error('No svgGroup found');
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
    this.updateAndRender();
  }

  render() {
    this.ispinningFlag = true;
    this.updateAndRender();
  }

  animatePop = ({
    duration,
    scale,
    tween = 'linear',
  }: {
    duration: number;
    scale: number;
    tween: string;
  }) => {
    if (!this.obj3d) throw new Error('No obj3d found');
    this.obj3dReset();

    //
    this.lastStep = this.obj3d.scaleX;
    const beginScale = this.obj3d.scaleX;
    const easing: Easing = this.tweens[
      tween as keyof EasingHash[]
    ] as unknown as Easing;

    this.zone.run(() => {
      this.playback = animate({
        from: beginScale,
        to: scale,
        duration: duration * 100,
        ease: easing,
        //repeat: 2,
        //repeatDelay: 200,
        onUpdate: (latest: number) => {
          this.ispinningFlag = true;

          const step = latest / this.lastStep;

          this.obj3d.scaleX = step;
          this.updateAndRender();
          this.lastStep = latest;
        },
        onComplete: () => {
          this.ispinningFlag = false;
          this.lastStep = 0;
        },
      });
      this.ispinningFlag = true;
    });
  };
  animate = () => {
    this.zone.run(() => {
      this.ispinningFlag = true;
      this.updateAndRender();
      this.requestAFID = requestAnimationFrame(this.animate);
    });
  };

  animateCamera = (rotInput: number) => {
    this.ispinningFlag = true;
    this.animateCameraDegree = rotInput;
    this.animateRequest();
  };

  animateRequest = () => {
    if (!this.animateCameraDegree)
      throw new Error('No animateCameraDegree found');

    this.obj3d.rotateCamera(this.animateCameraDegree);

    this.updateAndRender();

    this.requestAFID = requestAnimationFrame(this.animateRequest);
  };

  private updateAndRender = () => {
    if (!this.svgGroup) throw new Error('No obj3d found');
    if (!this.ispinningFlag) return;
    if (this.clearSvgFlag) this.svgGroup.clear();

    this.polygonTemp = [];
    this.rotatePolygon();

    this.sortPolygonArray();

    this.drawPolygonArray();
    this.clearSvgFlag = false;
  };

  private sortPolygonArray() {
    this.sortAndGetScreen();
    //    console.log('this.polygonTemp: ', this.polygonTemp);

    // sort polygons by zIndex
    this.polygonTemp = this.polygonTemp.sort((a, b) => {
      return (a.zIndex || 0) - (b.zIndex || 0);
    });
  }

  sortAndGetScreen() {
    if (!this.obj3d) throw new Error('No obj3d found');
    if (!this.obj3d.polygons) throw new Error('No polygons found');
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
