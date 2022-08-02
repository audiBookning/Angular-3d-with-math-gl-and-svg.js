import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Svg3D } from '../../3d/Svg3d';
import { SvgClickRoutingModule } from './svg-click-routing.module';
import { SvgClickComponent } from './svg-click.component';

@NgModule({
  declarations: [SvgClickComponent],
  providers: [],
  imports: [CommonModule, FormsModule, SvgClickRoutingModule],
})
export class SvgClickModule {}
