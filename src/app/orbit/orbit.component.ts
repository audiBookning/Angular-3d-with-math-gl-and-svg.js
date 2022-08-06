import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { Svg3D } from '../../svg3dApi/svg/Svg3d';

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
    this.svg3D.setSVG(this.svgParent.nativeElement, {});
    this.svg3D.newCube();
    this.svg3D.obj3dSet();

    this.svg3D.animateCamera(1);
  }

  ngOnDestroy(): void {
    this.svg3D.onDestroy();
  }
}
