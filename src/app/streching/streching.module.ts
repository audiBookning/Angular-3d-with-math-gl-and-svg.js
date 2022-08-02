import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Object3d } from '../../3d/Object3d';
import { Svg3D } from '../../3d/Svg3d';
import { StrechingRoutingModule } from './streching-routing.module';
import { StrechingComponent } from './streching.component';

@NgModule({
  declarations: [StrechingComponent],
  providers: [],
  imports: [CommonModule, FormsModule, StrechingRoutingModule],
})
export class StrechingModule {}
