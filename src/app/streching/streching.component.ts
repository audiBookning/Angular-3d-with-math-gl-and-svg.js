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
  obj3d!: Object3d;
  svg3D!: Svg3D;

  constructor() {}
  ngAfterViewInit(): void {
    this.obj3d = new Object3d({
      scale: [1.5, 1, 1],
    });

    this.svg3D = new Svg3D(this.obj3d, this.svgParent.nativeElement, {
      rotation: 0,
    });
    this.svg3D.animateFrames();
  }

  ngOnDestroy(): void {
    this.svg3D?.svgdestroy();
  }
}
