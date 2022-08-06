import { ChangeContext } from '@angular-slider/ngx-slider';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { SvgLerp } from '../../svg3dApi/svg/svgLerp';

@Component({
  selector: 'app-lerp',
  templateUrl: './lerp.component.html',
  styleUrls: ['./lerp.component.scss'],
})
export class LerpComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgParent', { static: true })
  svgParent!: ElementRef<HTMLElement>;

  lerpSetting: number;

  // SLIDER
  sliderOptions: {
    floor: number;
    ceil: number;
    step: number;
  } = {
    floor: 0,
    ceil: 1,
    step: 0.1,
  };

  constructor(private svg3D: SvgLerp) {
    this.lerpSetting = 0.7;
  }
  ngAfterViewInit(): void {
    this.svg3D.setSVG(this.svgParent.nativeElement, {});
    this.svg3D.updateAndRender(this.lerpSetting);
  }

  sliderLerpChange<T>(changeContext: ChangeContext) {
    const value = changeContext.value;
    this.lerpSetting = value;
    this.svg3D.updateAndRender(this.lerpSetting);
  }

  sliderInputCamera<T>(value: number) {
    // TODO: give feedback to the user if the value is not a number
    if (isNaN(value)) return;
    this.lerpSetting = value;

    this.svg3D.updateAndRender(this.lerpSetting);
  }

  ngOnDestroy(): void {
    this.svg3D.onDestroy();
  }
}
