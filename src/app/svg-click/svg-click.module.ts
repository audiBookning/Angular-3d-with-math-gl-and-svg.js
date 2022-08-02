import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { Svg3D } from '../../3d/Svg3d';
import { SvgClickRoutingModule } from './svg-click-routing.module';
import { SvgClickComponent } from './svg-click.component';

@NgModule({
  declarations: [SvgClickComponent],
  providers: [],
  imports: [CommonModule, SvgClickRoutingModule],
})
export class SvgClickModule {}
