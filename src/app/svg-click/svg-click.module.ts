import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SvgClickRoutingModule } from './svg-click-routing.module';
import { SvgClickComponent } from './svg-click.component';

@NgModule({
  declarations: [SvgClickComponent],
  providers: [],
  imports: [CommonModule, FormsModule, SvgClickRoutingModule, NgxSliderModule],
})
export class SvgClickModule {}
