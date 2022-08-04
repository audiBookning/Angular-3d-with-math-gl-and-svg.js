import { BehaviorSubject, Subscription } from 'rxjs';

import { ChangeContext, Options } from '@angular-slider/ngx-slider';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Vector3 } from '@math.gl/core';

import { Svg3D } from '../../3d/Svg3d';
import {
  CameraSettings,
  CameraSettingsInputs,
  DistanceInputs,
  PolygonDistByAxis,
} from '../../3d/types';

@Component({
  selector: 'app-svg-click',
  templateUrl: './svg-click.component.html',
  styleUrls: ['./svg-click.component.scss'],
})
export class SvgClickComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgParent', { static: true })
  svgParent!: ElementRef<HTMLElement>;

  clickSubscription: Subscription | undefined;
  distanceSubscription: Subscription | undefined;
  cameraSubscription: any;

  //
  selectedTween: string = 'linear';

  tweens: string[] = [
    'linear',
    'easeIn',
    'easeOut',
    'easeInOut',
    'circIn',
    'circOut',
    'circInOut',
    'backIn',
    'backOut',
    'backInOut',
    'anticipate',
    //{'cubicBezier': cubicBezier},
  ];

  // INFO: temp value
  prevValue: number | undefined;

  polygonDistanceInputs: DistanceInputs | undefined;
  svgPolygonClicked: import('@svgdotjs/svg.js').Polygon | undefined;
  cameraObs: BehaviorSubject<CameraSettings> | undefined;

  private _cameraSettings: CameraSettings;

  public get cameraSettings(): CameraSettings {
    return {
      eye: this._cameraSettings.eye,
      center: this._cameraSettings.center,
      up: this._cameraSettings.up,
    };
  }
  public set cameraSettings(value: CameraSettings) {
    this._cameraSettings = value;
  }

  autoscale: boolean = true;

  // Slider

  // TODO: add steps to the slider to try to control the frames of the animation?
  sliderOptions: {
    floor: number;
    ceil: number;
    step: number;
  } = {
    floor: -50,
    ceil: 50,
    step: 2,
  };

  constructor(private svg3D: Svg3D, private cd: ChangeDetectorRef) {
    this.polygonDistanceInputs = {};

    this._cameraSettings = {
      eye: new Vector3([1, 1, 1]),
      center: new Vector3([0, 0, 0]),
      up: new Vector3([0, 1, 0]),
    };
  }

  ngAfterViewInit(): void {
    this.svg3D.setSVG(this.svgParent.nativeElement, {});
    this.svg3D.obj3dSet();
    this.setDistances();

    // subs
    this.clickSubscription = this.svg3D.clickObservable.subscribe((data) => {
      if (!data) return;

      // reset the last polygon clcked
      if (this.svgPolygonClicked) {
        this.svgPolygonClicked.attr({ 'fill-opacity': '1', stroke: null });
      }
      if (this.polygonDistanceInputs?.id !== data.id) {
        // TODO: the stroke tickness should be dynamic based on the polygon size
        this.svgPolygonClicked = data.polygon;
        this.svgPolygonClicked?.attr('fill-opacity', '0.4');
        this.svgPolygonClicked?.attr('stroke', 'black');

        this.polygonDistanceInputs = {
          ...this.polygonDistanceInputs,
          id: data.id,
          axis: data.axis,
        };
      } else {
        this.polygonDistanceInputs = {
          ...this.polygonDistanceInputs,
          id: undefined,
          axis: data.axis,
        };
      }

      // TODO: this shouldn't be called in the component
      //this.svg3D.obj3d.updatePolygonDistance();
    });

    this.distanceSubscription = this.svg3D.distanceByaxisObservable.subscribe(
      (distanceByaxis) => {
        this.setDistances(distanceByaxis);
      }
    );

    this.svg3D.renderBasic();

    //

    this.cameraObs = this.svg3D.getCameraObservable();

    this.cameraSubscription = this.cameraObs.subscribe(
      (cameraSettings: CameraSettings) => {
        this.cameraSettings = cameraSettings;
      }
    );
  }

  // TODO: could animate and lerp the camera settings instead of setting them directly
  resetCameraSettings() {
    this.svg3D.obj3d.setCameraDefaults();
    this.svg3D.updateCameraAndRender({});
  }

  toggleAutoScale($target: EventTarget | null) {
    const ischecked = (<HTMLInputElement>$target).checked;

    this.svg3D.autoScaleFlag = ischecked;
    this.svg3D.updateCameraAndRender({});
  }
  toggleAutoCenter($target: EventTarget | null) {
    const ischecked = (<HTMLInputElement>$target).checked;

    this.svg3D.autoCenterFlag = ischecked;
    this.svg3D.updateCameraAndRender({});
  }

  // INFO: exemple: T === CameraSettings['center']
  sliderInputCamera<T>(
    value: number,
    axis: keyof T,
    tttt: keyof CameraSettingsInputs
  ) {
    //console.log(typeof value);
    // TODO: give feedback to the user if the value is not a number
    if (isNaN(value)) return;

    if (value !== this.prevValue) {
      this.setCameraSettings<T>(value, axis, tttt);
    }
  }

  // INFO: exemple: T === CameraSettings['center']
  sliderCameraChange<T>(
    changeContext: ChangeContext,
    key: keyof T,
    tttt: keyof CameraSettingsInputs
  ) {
    const value = changeContext.value;
    this.setCameraSettings<T>(value, key, tttt);
  }

  setCameraSettings<T>(
    value: number,
    key: keyof T,
    tttt: keyof CameraSettingsInputs
  ) {
    const { x, y, z } = this._cameraSettings[tttt];
    const centerNumbers = Object.values({
      ...{ x, y, z },
      [key]: value,
    });
    const center = new Vector3(...centerNumbers);
    this.svg3D.updateCameraAndRender({ [tttt]: center });
  }

  setDistances(distanceByaxis?: PolygonDistByAxis) {
    const dstByaxis = distanceByaxis
      ? distanceByaxis
      : this.svg3D.obj3d.distanceByAxis;
    if (!dstByaxis) throw new Error('distanceByaxis is undefined');

    const xdistance = dstByaxis.x || 0;
    const ydistance = dstByaxis.y || 0;
    const zdistance = dstByaxis.z || 0;

    this.polygonDistanceInputs = {
      ...this.polygonDistanceInputs,
      scale: xdistance,
      x: xdistance,
      y: ydistance,
      z: zdistance,
    };

    this.cd.detectChanges();
  }

  beginAnimation() {
    if (!this.polygonDistanceInputs)
      throw new Error('polygonDistanceInputs is undefined');
    this.svg3D.animatePopmotion({
      duration: 12,
      tween: this.selectedTween,
      distanceInputs: this.polygonDistanceInputs,
    });
  }

  saveValue(e: any) {
    // TODO: give feedback to the user if the value is not a number
    const value = parseFloat(e.target.value.trim());
    if (isNaN(+value)) return;
    this.prevValue = value;
  }

  processChange(e: any, axis: string) {
    const value = parseFloat(e.target.value.trim());
    // TODO: give feedback to the user if the value is not a number
    if (isNaN(value)) return;

    if (value !== this.prevValue) {
      // Do some additional processing...
      this.polygonDistanceInputs = {
        ...this.polygonDistanceInputs,
        axis: axis,
        id: undefined,
        scale: value,
      };

      this.beginAnimation();
    }
  }

  ngOnDestroy(): void {
    this.svg3D.svgdestroy();
    if (this.clickSubscription) {
      this.clickSubscription.unsubscribe();
    }
    if (this.distanceSubscription) {
      this.distanceSubscription.unsubscribe();
    }
    if (this.cameraSubscription) {
      this.cameraSubscription.unsubscribe();
    }
  }
}
