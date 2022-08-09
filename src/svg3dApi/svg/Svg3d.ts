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
  SvgInput,
  SvgPolygonHash,
} from '../types/types';

@Injectable({
  providedIn: 'root',
})
export class Svg3D {
  private svgPolygonHash: SvgPolygonHash = {};
  private svgGroup: G | Svg | undefined;
  private clearSvgFlag: boolean = true;
  private svgDraw: Svg | undefined;

  private polygonTemp: DisplayPolygonsRefNodes[] = [];
  private ispinningFlag: boolean = false;

  private lastStep: number = 0;

  private obj3d: Object3d | undefined;

  private resetObj3DInput: Object3DInput | undefined;

  // Popmotion
  private tweens: EasingHash[] = [
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
  private clickObservable: Subject<ClickObservable | undefined>;

  // INFO: requestAnimationFrame id used to avoid memory leaks
  private requestAFID: number | undefined;
  private animateCameraDegree: number | undefined;

  // stream the uppdated distance of the faces of the polygons

  private autoScaleFlag: boolean = true;
  private autoCenterFlag: boolean = true;

  constructor(private zone: NgZone) {
    this.clickObservable = new Subject<ClickObservable | undefined>();
  }

  newCube() {
    this.obj3d = new Object3d();
    this.obj3dSet();
  }

  // INFO: set some properties of the obj3d
  public obj3dSet({
    scale = [1, 1, 1],
    rotation,
  }: Partial<Object3DInput> = {}) {
    this.resetObj3DInput = { scale, rotation };
    this.obj3d?.setInitValues({ scale, rotation });
  }

  /*
    ABSTRACTIONS
  */

  public getClickObservable() {
    return this.clickObservable;
  }

  public toggleAutoCenter(ischecked: boolean): void {
    this.autoCenterFlag = ischecked;
    this.updateCameraAndRender({});
  }

  public toggleAutoScale(ischecked: boolean) {
    this.autoScaleFlag = ischecked;
    this.updateCameraAndRender({});
  }

  public getDistanceObs() {
    if (!this.obj3d) throw new Error('obj3d is not set');

    return this.obj3d?.cube.polygons.distanceByaxisObservable;
  }

  // TODO: refactor
  public getCameraObservable() {
    if (!this.obj3d) throw new Error('obj3d is not set');
    return this.obj3d?.projection.camera.cameraObservable;
  }

  public resetCameraSettings() {
    this.obj3d?.projection.camera.setCameraDefaults();
    this.updateCameraAndRender({});
  }

  // INFO: Init the svg object with the HTML element
  public setSVG(
    svg: HTMLElement,
    { svgWidth = 300, svgHeight = 300 }: Partial<SvgInput> = {}
  ) {
    this.onDestroy();

    this.svgDraw = SVG();
    this.svgDraw.addTo(svg).size(svgWidth, svgHeight);

    this.svgGroup = this.svgDraw.group();
  }

  // INFO: auto scale the svg to fit the screen
  private scaleSvgGroup() {
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

  // INFO: animate and render the svg, and mae sure to rotate the 3d obj
  public animateBasic = () => {
    this.zone.run(() => {
      this.ispinningFlag = true;
      this.obj3d?.rotateObj();
      this.updateAndRender();
      this.requestAFID = requestAnimationFrame(this.animateBasic);
    });
  };

  // INFO: animate using Popmotion library
  animatePopmotion = ({
    duration,
    tween = 'linear',
    distanceInputs,
  }: {
    duration: number;
    tween: string;
    distanceInputs: DistanceInputs;
  }) => {
    if (!this.obj3d) throw new Error('No obj3d found');

    const easing: Easing = this.tweens[
      tween as keyof EasingHash[]
    ] as unknown as Easing;

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
        onUpdate: (latest: number) => {
          this.ispinningFlag = true;
          const step = latest - this.lastStep;
          if (step === 0) return;
          this.obj3d?.updatePolygonsScaleAndDistance(step);

          // TODO: refactor

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
  public animateCamera = (rotInput: number) => {
    this.ispinningFlag = true;
    this.animateCameraDegree = rotInput;
    if (!this.obj3d) throw new Error('No obj3d found');
    this.obj3d.rotateXMatrix = undefined;
    this.animateCameraRequest();
  };

  private animateCameraRequest = () => {
    if (!this.animateCameraDegree)
      throw new Error('No animateCameraDegree found');

    // TODO: refactor
    this.obj3d?.projection.camera.rotateCamera(this.animateCameraDegree);

    this.updateAndRender();
    this.requestAFID = requestAnimationFrame(this.animateCameraRequest);
  };

  /*
    RENDER
  */

  public updateCameraAndRender(settings?: CameraSettingsInputs) {
    // TODO: refactor
    this.ispinningFlag = true;
    this.updateAndRender(settings);
  }

  private updateAndRender = (settings?: CameraSettingsInputs) => {
    if (settings) this.obj3d?.projection.camera.updateCameraSettings(settings);
    if (!this.svgGroup) throw new Error('No obj3d found');
    if (!this.ispinningFlag) return;
    if (this.clearSvgFlag) this.svgGroup.clear();
    if (!this.obj3d) throw new Error('No obj3d found');

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
  onDestroy() {
    this.obj3dReset();
    this.ispinningFlag = false;
    this.polygonTemp = [];
    this.svgPolygonHash = {};
    if (this.requestAFID) cancelAnimationFrame(this.requestAFID);

    this.clearSvgFlag = true;
    if (this.svgDraw && this.svgGroup) {
      this.svgDraw.remove();
    }
  }

  obj3dReset() {
    this.obj3d?.projection.onDestroy();
    this.obj3d = new Object3d();
    this.obj3dSet();
  }
}
