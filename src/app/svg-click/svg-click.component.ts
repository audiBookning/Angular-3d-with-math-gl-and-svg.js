import { Subscription } from 'rxjs';

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { Svg3D } from '../../3d/Svg3d';
import { DistanceInputs, PolygonDistByAxis } from '../../3d/types';

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
  prevValue = '';

  distanceInputs: DistanceInputs;

  constructor(private svg3D: Svg3D, private cd: ChangeDetectorRef) {
    this.distanceInputs = {
      id: '1',
      axis: 'x',
      scale: 3,
    };
  }
  ngAfterViewInit(): void {
    this.svg3D.set(this.svgParent.nativeElement, {});
    this.svg3D.obj3dSet();
    this.setDistances();

    // subs
    this.clickSubscription = this.svg3D.clickObservable.subscribe((data) => {
      if (!data) return;

      this.distanceInputs = {
        ...this.distanceInputs,
        id: data?.id,
        axis: data?.axis,
      };

      // TODO: this shouldn't be called in the component
      this.svg3D.obj3d.getPolygonDistance();
    });

    this.distanceSubscription = this.svg3D.distanceByaxisObservable.subscribe(
      (distanceByaxis) => {
        this.setDistances(distanceByaxis);
      }
    );

    this.svg3D.render();
  }

  setDistances(distanceByaxis?: PolygonDistByAxis) {
    const dstByaxis = distanceByaxis
      ? distanceByaxis
      : this.svg3D.obj3d.distanceByAxis;
    if (!dstByaxis) throw new Error('distanceByaxis is undefined');

    const xdistance = dstByaxis.x || 0;
    const ydistance = dstByaxis.y || 0;
    const zdistance = dstByaxis.z || 0;

    this.distanceInputs = {
      ...this.distanceInputs,
      scale: xdistance,
      x: xdistance,
      y: ydistance,
      z: zdistance,
    };

    this.cd.detectChanges();
  }

  beginAnimation() {
    this.svg3D.animatePop({
      duration: 12,
      tween: this.selectedTween,
      distanceInputs: this.distanceInputs,
    });
  }

  saveValue(e: any) {
    this.prevValue = e.target.value.trim();
  }

  processChange(e: any, axis: string) {
    const value = e.target.value.trim();

    if (value !== this.prevValue) {
      // Do some additional processing...
      this.distanceInputs = {
        ...this.distanceInputs,
        axis: axis,
        id: undefined,
        scale: parseFloat(value),
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
  }
}
