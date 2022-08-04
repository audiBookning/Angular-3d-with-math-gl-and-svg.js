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
import { BehaviorSubject, map, ReplaySubject, Subject, tap } from 'rxjs';

import { Injectable, NgZone } from '@angular/core';
import { Vector3 } from '@math.gl/core';
import { G, SVG, Svg } from '@svgdotjs/svg.js';

import { Object3d } from './Object3d';
import {
  CameraSettings,
  CameraSettingsInputs,
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
  private svgGroup: G | Svg | undefined;
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
  autoScaleFlag: boolean = true;
  autoCenterFlag: boolean = true;

  constructor(private zone: NgZone) {
    this.obj3d = new Object3d();
    this.obj3dSet();
    this.clickObservable = new Subject<ClickObservable | undefined>();
  }

  getCameraObservable() {
    return this.obj3d.cameraObservable;
  }

  // INFO: set some properties of the obj3d
  obj3dSet({ scale = [1, 1, 1], rotation }: Partial<Object3DInput> = {}) {
    this.resetObj3DInput = { scale, rotation };
    this.obj3d.setInitValues({ scale, rotation });
  }

  // INFO: Init the svg object with the HTML element
  setSVG(
    svg: HTMLElement,
    { svgWidth = 300, svgHeight = 300 }: Partial<SvgInput> = {}
  ) {
    this.svgdestroy();

    this.svgDraw = SVG();
    this.svgDraw.addTo(svg).size(svgWidth, svgHeight);

    this.svgGroup = this.svgDraw.group();
    //this.svgGroup = this.svgDraw.nested();
  }

  // INFO: auto scale the svg to fit the screen
  scaleSvgGroup() {
    // TODO: when the 3d object is not really changing size,
    // like in the rotation example, one can avoid re-calculating the scale
    // This would be good for performance
    // And avoid the wobling animation because of the small changes in the bounding box
    this.svgGroup?.attr('transform', null);
    if (!this.autoScaleFlag) return;

    // reset the transform of the svg group

    const getPercent = (size: number, percent: number) =>
      (size / 100) * percent;
    const svgW = this.svgDraw?.width() as number;
    const svgH = this.svgDraw?.height() as number;
    // TODO: the 80 percent should be a congigurable and  possibly a dynamic value
    // to avoid for example the 'wobling' animation present in the rotation example
    // doint these calculations in the svg/2d side should be more performant
    // but this is getting  more and more complex to avoid edge case situations
    // better should be to calculate everything right on the camera/3d side
    const svgWPercent = getPercent(svgW, 80);
    const svgHPercent = getPercent(svgH, 80);

    const groupWidth = this.svgGroup?.width() as number;
    const groupHeigh = this.svgGroup?.height() as number;
    const scaleafactorW = svgWPercent / groupWidth;
    const scaleafactorH = svgHPercent / groupHeigh;

    this.svgGroup?.scale(scaleafactorW, scaleafactorH);

    const viewbox = this.svgDraw?.viewbox();
  }

  /*
    ANIMATE
  */

  animateBasic = () => {
    this.zone.run(() => {
      this.ispinningFlag = true;
      this.obj3d.rotatePolygon();
      this.updateAndRender();
      this.requestAFID = requestAnimationFrame(this.animateBasic);
    });
  };

  // INFO: animate using Popmotion library
  animatePopmotion = ({
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

    const easing: Easing = this.tweens[
      tween as keyof EasingHash[]
    ] as unknown as Easing;
    //
    const polygonId = distanceInputs?.id;
    if (!distanceInputs.axis) throw new Error('No axis found');
    const axis = distanceInputs.axis;
    this.obj3d.updatePolygonsTransformId(polygonId, axis);

    const from = distanceInputs[axis as keyof DistanceInputs] as number;
    const to = distanceInputs.scale;
    this.lastStep = from;

    this.zone.run(() => {
      animate({
        from: from,
        to: to,
        duration: duration * 5,
        ease: easing,
        //repeat: 2,
        //repeatDelay: 200,
        onUpdate: (latest: number) => {
          this.ispinningFlag = true;
          const step = latest - this.lastStep;
          if (step === 0) return;
          this.obj3d.updatePolygonsScaleAndDistance(step);

          if (this.obj3d.distanceByAxis)
            this.distanceByaxisObservable.next(this.obj3d.distanceByAxis);

          this.updateAndRender();
          this.lastStep = latest;
        },
        onComplete: () => {
          // TODO: to avoid having distances not exactly the same as inputed by the user
          // one can check here and rerun the animation if the distance is not the same
          // with updated values
          this.ispinningFlag = false;
          this.lastStep = 0;
        },
      });
    });
  };

  // INFO: Animate rotating the camera
  animateCamera = (rotInput: number) => {
    this.ispinningFlag = true;
    this.animateCameraDegree = rotInput;
    this.obj3d.rotateXMatrix = undefined;
    this.animateCameraRequest();
  };

  animateCameraRequest = () => {
    if (!this.animateCameraDegree)
      throw new Error('No animateCameraDegree found');

    this.obj3d.rotateCamera(this.animateCameraDegree);

    this.updateAndRender();
    this.requestAFID = requestAnimationFrame(this.animateCameraRequest);
  };

  /*
    RENDER
  */

  updateCameraAndRender(settings: CameraSettingsInputs) {
    this.obj3d.updateCameraSettings(settings);
    this.updateAndRender();
  }

  renderBasic() {
    this.ispinningFlag = true;
    this.updateAndRender();
  }

  private updateAndRender = () => {
    if (!this.svgGroup) throw new Error('No obj3d found');
    if (!this.ispinningFlag) return;
    if (this.clearSvgFlag) this.svgGroup.clear();

    this.polygonTemp = [];

    this.sortPolygonArray();

    this.drawPolygonArray();
    this.clearSvgFlag = false;
    this.scaleSvgGroup();
  };

  private drawPolygonArray = () => {
    if (!this.svgGroup) throw new Error('No svgGroup found');
    this.polygonTemp.forEach((polygon, index) => {
      this.drawPolygon(polygon);
    });
    if (this.autoCenterFlag) this.svgGroup.center(150, 150);
  };

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

      // INFO: add click event to the svg polygon
      newPolygon.click((event: PointerEvent) => {
        if (event !== null && event.target instanceof SVGPolygonElement) {
          const dataset: DOMStringMap = event.target.dataset as DOMStringMap;
          const gh: string | undefined = dataset['data'];
          if (!gh) throw new Error('No data found');

          const clickParsed: ClickObservable = JSON.parse(gh);

          const clickNext: ClickObservable = {
            ...clickParsed,
            polygon: this.svgPolygonHash[clickParsed.id],
          };

          this.clickObservable.next(clickNext);
        }
      });

      this.svgPolygonHash[polygonTemp.id] = newPolygon;
    } else {
      this.svgPolygonHash[polygonTemp.id].plot(polygonTemp.nodes);
      this.svgGroup.add(this.svgPolygonHash[polygonTemp.id]);
    }
  };

  /*
    +++++++++
  */

  private sortPolygonArray() {
    // sortAndGetScreen
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

    // sort polygons by zIndex
    this.polygonTemp = this.polygonTemp.sort((a, b) => {
      return (a.zIndex || 0) - (b.zIndex || 0);
    });
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

  // INFO: Cleaning the svg and 3d object
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

  obj3dReset() {
    this.obj3d = new Object3d();
    this.obj3dSet();
  }
}
