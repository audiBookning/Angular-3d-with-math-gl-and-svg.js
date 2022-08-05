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

import { Object3d } from '../3d/Object3d';
import {
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
} from '../types/types';

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

  // TODO: refactor
  public getCameraObservable() {
    return this.obj3d.projection.camera.cameraObservable;
  }

  public getDistanceByAxis() {
    return this.obj3d.GetDistanceByAxis();
  }

  public resetCameraSettings() {
    this.obj3d.projection.camera.setCameraDefaults();
    this.updateCameraAndRender({});
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
      this.obj3d.rotateObj();
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

          // TODO: refactor
          const distanceByaxis = this.obj3d.GetDistanceByAxis();
          if (distanceByaxis)
            this.distanceByaxisObservable.next(distanceByaxis);

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

    // TODO: refactor
    this.obj3d.projection.camera.rotateCamera(this.animateCameraDegree);

    this.updateAndRender();
    this.requestAFID = requestAnimationFrame(this.animateCameraRequest);
  };

  /*
    RENDER
  */

  updateCameraAndRender(settings: CameraSettingsInputs) {
    // TODO: refactor
    this.obj3d.projection.camera.updateCameraSettings(settings);
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

    this.polygonTemp = this.obj3d.sortPolygonArray();

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
    this.obj3d.projection.onDestroy();
    this.obj3d = new Object3d();
    this.obj3dSet();
  }
}
