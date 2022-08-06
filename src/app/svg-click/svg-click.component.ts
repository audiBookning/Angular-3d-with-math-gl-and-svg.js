import { BehaviorSubject, Subscription } from 'rxjs';

import { ChangeContext } from '@angular-slider/ngx-slider';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Vector3 } from '@math.gl/core';

import { Svg3D } from '../../svg3dApi/svg/Svg3d';
import {
  CameraSettings,
  CameraSettingsInputs,
  DistanceInputs,
  PolygonDistByAxis,
} from '../../svg3dApi/types/types';

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
    this.svg3D.newCube();

    // subs
    this.clickSubscription = this.svg3D
      .getClickObservable()
      .subscribe((data) => {
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
      });

    this.distanceSubscription = this.svg3D
      .getDistanceObs()
      .subscribe((distanceByaxis) => {
        this.polygonDistanceInputs = this.getDistances(distanceByaxis);
      });

    this.cameraObs = this.svg3D.getCameraObservable();

    this.cameraSubscription = this.cameraObs.subscribe(
      (cameraSettings: CameraSettings) => {
        this.cameraSettings = cameraSettings;
      }
    );

    this.svg3D.updateCameraAndRender();
    //this.polygonDistanceInputs = this.getDistances();
    this.cd.detectChanges();
  }

  // TODO: could animate and lerp the camera settings instead of setting them directly
  resetCameraSettings() {
    // TODO: camera should be private
    this.svg3D.resetCameraSettings();
  }

  toggleAutoScale($target: EventTarget | null) {
    const ischecked = (<HTMLInputElement>$target).checked;

    this.svg3D.toggleAutoScale(ischecked);
  }

  toggleAutoCenter($target: EventTarget | null) {
    const ischecked = (<HTMLInputElement>$target).checked;

    this.svg3D.toggleAutoCenter(ischecked);
  }

  // INFO: exemple: T === CameraSettings['center']
  sliderInputCamera<T>(
    value: number,
    axis: keyof T,
    tttt: keyof CameraSettingsInputs
  ) {
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
    keyOfCamearSettings: keyof CameraSettingsInputs
  ) {
    const { x, y, z } = this._cameraSettings[keyOfCamearSettings];
    const settingsNumbers = Object.values({
      ...{ x, y, z },
      [key]: value,
    });
    const settings = new Vector3(...settingsNumbers);
    this.svg3D.updateCameraAndRender({ [keyOfCamearSettings]: settings });
  }

  getDistances(distanceByaxis?: PolygonDistByAxis) {
    // TODO: refactor

    if (!distanceByaxis) throw new Error('distanceByaxis is undefined');

    const xdistance = distanceByaxis.x || 0;
    const ydistance = distanceByaxis.y || 0;
    const zdistance = distanceByaxis.z || 0;

    return {
      ...this.polygonDistanceInputs,
      scale: xdistance,
      x: xdistance,
      y: ydistance,
      z: zdistance,
    };
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
    // TODO: Validation- give feedback to the user if the value is not a number
    const value = parseFloat(e.target.value.trim());
    if (isNaN(+value)) return;
    this.prevValue = value;
  }

  processChange(e: any, axis: string) {
    const value = parseFloat(e.target.value.trim());
    // TODO: Validation- give feedback to the user if the value is not a number
    if (isNaN(value)) return;

    if (value !== this.prevValue) {
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
    this.svg3D.onDestroy();
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
