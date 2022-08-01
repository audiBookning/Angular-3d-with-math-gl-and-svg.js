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

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { Object3d } from '../../3d/Object3d';
import { Svg3D } from '../../3d/Svg3d';

@Component({
  selector: 'app-streching',
  templateUrl: './streching.component.html',
  styleUrls: ['./streching.component.scss'],
})
export class StrechingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgParent', { static: true })
  svgParent!: ElementRef<HTMLElement>;
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

  constructor(private svg3D: Svg3D) {}
  ngAfterViewInit(): void {
    this.svg3D.obj3dSet({
      scale: [1, 1, 1],
      //rotation: 3.5,
    });

    this.svg3D.set(this.svgParent.nativeElement);
  }

  beginAnimation() {
    this.svg3D.animatePop({
      duration: 12,
      scale: 3,
      tween: this.selectedTween,
    });
  }

  ngOnDestroy(): void {
    this.svg3D?.svgdestroy();
  }
}
