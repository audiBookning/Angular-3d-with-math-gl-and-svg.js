import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { Object3d } from '../../svg3dApi/3d/Object3d';
import { Svg3D } from '../../svg3dApi/svg/Svg3d';

@Component({
  selector: 'app-rotation',
  templateUrl: './rotation.component.html',
  styleUrls: ['./rotation.component.scss'],
})
export class RotationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgParent', { static: true })
  svgParent!: ElementRef<HTMLElement>;

  constructor(private svg3D: Svg3D) {}
  ngAfterViewInit(): void {
    this.svg3D.setSVG(this.svgParent.nativeElement, {});
    this.svg3D.obj3dSet({ rotation: 0.7 });

    this.svg3D.animateBasic();
  }

  ngOnDestroy(): void {
    this.svg3D.onDestroy();
  }
}
