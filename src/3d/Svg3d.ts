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
import { G, SVG, Svg } from '@svgdotjs/svg.js';

import { Object3d } from './Object3d';
import {
  ClickObservable,
  DisplayPolygonsRefNodes,
  DistanceInputs,
  EasingHash,
  Object3DInput,
  PolygonDistByAxis,
  PolygonsRefNodes,
  SvgInput,
  SvgPolygonHash,
} from './types';

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
  clickObservable: Subject<ClickObservable | undefined>;
  // INFO: requestAnimationFrame id used to avoid memory leaks
  requestAFID: number | undefined;
  animateCameraDegree: number | undefined;

  // stream the uppdated distance of the faces of the polygons
  distanceByaxisObservable: Subject<PolygonDistByAxis> =
    new Subject<PolygonDistByAxis>();

  constructor(private zone: NgZone) {
    this.obj3d = new Object3d();
    this.clickObservable = new Subject<ClickObservable | undefined>();
  }

  obj3dSet({ scale = [1, 1, 1], rotation }: Partial<Object3DInput> = {}) {
    this.resetObj3DInput = { scale, rotation };
    this.obj3d.setInitValues({ scale, rotation });
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

      const data: ClickObservable = {
        id: polygonTemp.id,
        axis: polygonTemp.axis,
      };

      newPolygon.data('data', data);

      newPolygon.click((event: PointerEvent) => {
        if (event !== null && event.target instanceof SVGPolygonElement) {
          const dataset: DOMStringMap = event.target.dataset as DOMStringMap;
          const gh: string | undefined = dataset['data'];
          if (!gh) throw new Error('No data found');

          const tt: ClickObservable = JSON.parse(gh);

          this.clickObservable.next(tt);
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
    tween = 'linear',
    //scale,
    //poligonId = '1',
    distanceInputs,
  }: {
    duration: number;
    tween: string;
    //scale: number;
    //poligonId?: string;
    distanceInputs: DistanceInputs;
  }) => {
    if (!this.obj3d) throw new Error('No obj3d found');
    //

    const easing: Easing = this.tweens[
      tween as keyof EasingHash[]
    ] as unknown as Easing;

    //

    const polygonId = distanceInputs.id;
    this.obj3d.polygonScaleId = polygonId;
    const axix = distanceInputs.axis;
    this.obj3d.polygonAxisId = axix;

    const from = distanceInputs[axix as keyof DistanceInputs] as number;
    const to = distanceInputs.scale;
    this.lastStep = from;

    this.zone.run(() => {
      animate({
        from: from,
        to: to,
        duration: duration * 5,
        //ease: easing,
        //repeat: 2,
        //repeatDelay: 200,
        onUpdate: (latest: number) => {
          this.ispinningFlag = true;

          const step = latest - this.lastStep;

          if (step === 0) return;
          this.obj3d.setPoligonScale(step);

          this.obj3d.getPolygonDistance();
          // INFO: The subject observable must be called in the zone or inside a DI class?
          if (this.obj3d.distanceByAxis)
            this.distanceByaxisObservable.next(this.obj3d.distanceByAxis);

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
        axis: this.obj3d.polygons[index].axis,
        opositeFace: this.obj3d.polygons[index].opositeFace,
      };
      this.polygonTemp.push(newPolygonsRefNodes);
    }
  }

  private getPolygonPoints(
    polygonHash: PolygonsRefNodes
  ): Partial<DisplayPolygonsRefNodes> {
    let zIndex: number = 0;

    const hhhhh = polygonHash.order.flatMap((index) => {
      const vect = polygonHash.nodesHash[index];
      const [pointX1, pointY1, PointZ] = this.obj3d.getScreenCoordinates(vect);
      zIndex += PointZ;
      return [pointX1, pointY1];
    });

    return { nodes: hhhhh, zIndex: zIndex };
  }
}
