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
  selector: 'app-rotation',
  templateUrl: './rotation.component.html',
  styleUrls: ['./rotation.component.scss'],
})
export class RotationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgParent', { static: true })
  svgParent!: ElementRef<HTMLElement>;

  constructor(private svg3D: Svg3D) {}
  ngAfterViewInit(): void {
    this.svg3D.set(this.svgParent.nativeElement, {});
    this.svg3D.obj3dSet({ rotation: 0.7 });

    this.svg3D.animate();
  }

  ngOnDestroy(): void {
    this.svg3D.svgdestroy();
  }
}
