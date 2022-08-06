import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SvgLerp } from '../../svg3dApi/svg/svgLerp';
import { LerpRoutingModule } from './lerp-routing.module';
import { LerpComponent } from './lerp.component';

@NgModule({
  declarations: [LerpComponent],
  providers: [SvgLerp],
  imports: [CommonModule, FormsModule, LerpRoutingModule, NgxSliderModule],
})
export class LerpModule {}
