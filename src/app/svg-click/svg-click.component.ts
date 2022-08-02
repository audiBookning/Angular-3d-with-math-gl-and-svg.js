import { Subscription } from 'rxjs';

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { Svg3D } from '../../3d/Svg3d';

@Component({
  selector: 'app-svg-click',
  templateUrl: './svg-click.component.html',
  styleUrls: ['./svg-click.component.scss'],
})
export class SvgClickComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgParent', { static: true })
  svgParent!: ElementRef<HTMLElement>;
  clicked: string = 'clicked: ';
  subscription: Subscription | undefined;

  constructor(private svg3D: Svg3D) {}
  ngAfterViewInit(): void {
    this.svg3D.set(this.svgParent.nativeElement, {});
    this.svg3D.obj3dSet();
    this.subscription = this.svg3D.clickObservable.subscribe((id) => {
      this.clicked = 'clicked: ' + id;
    });

    this.svg3D.render();
  }

  ngOnDestroy(): void {
    this.svg3D.svgdestroy();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
