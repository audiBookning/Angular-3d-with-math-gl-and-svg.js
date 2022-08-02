import { Subscription } from 'rxjs';

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { Svg3D } from '../../3d/Svg3d';
import { PolygonDistByAxis } from '../../3d/types';

@Component({
  selector: 'app-svg-click',
  templateUrl: './svg-click.component.html',
  styleUrls: ['./svg-click.component.scss'],
})
export class SvgClickComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgParent', { static: true })
  svgParent!: ElementRef<HTMLElement>;
  clicked: string = 'clicked: ';
  clickSubscription: Subscription | undefined;
  distanceSubscription: Subscription | undefined;
  selectedTween: string = 'linear';
  polygonClickedId: string | undefined;

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

  xdistance: string | undefined;
  ydistance: string | undefined;
  zdistance: string | undefined;

  constructor(private svg3D: Svg3D, private cd: ChangeDetectorRef) {}
  ngAfterViewInit(): void {
    this.svg3D.set(this.svgParent.nativeElement, {});
    this.svg3D.obj3dSet();
    this.setDistances();

    // subs
    this.clickSubscription = this.svg3D.clickObservable.subscribe((data) => {
      this.clicked = 'clicked: ' + data?.axis;
      this.polygonClickedId = data?.id;
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

    this.xdistance = dstByaxis.x?.toFixed(2) || '0';
    this.ydistance = dstByaxis.y?.toFixed(2) || '0';
    this.zdistance = dstByaxis.z?.toFixed(2) || '0';
    this.cd.detectChanges();
  }

  beginAnimation() {
    this.svg3D.animatePop({
      duration: 12,
      scale: 3,
      tween: this.selectedTween,
      poligonId: this.polygonClickedId,
    });
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
