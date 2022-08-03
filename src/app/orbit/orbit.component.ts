import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { toRadians } from '@math.gl/core';

import { Svg3D } from '../../3d/Svg3d';

@Component({
  selector: 'app-orbit',
  templateUrl: './orbit.component.html',
  styleUrls: ['./orbit.component.scss'],
})
export class OrbitComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgParent', { static: true })
  svgParent!: ElementRef<HTMLElement>;

  constructor(private svg3D: Svg3D) {}
  ngAfterViewInit(): void {
    this.svg3D.set(this.svgParent.nativeElement, {});
    this.svg3D.obj3dSet();

    this.svg3D.animateCamera(1);
    // console.log('ngAfterViewInit toRadians: ', toRadians(1));
    console.log('*************');
  }

  ngOnDestroy(): void {
    this.svg3D.svgdestroy();
  }
}