import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { Object3d } from '../../svg3dApi/3d/Object3d';
import { Svg3D } from '../../svg3dApi/svg/Svg3d';
import { RotationRoutingModule } from './rotation-routing.module';
import { RotationComponent } from './rotation.component';

@NgModule({
  declarations: [RotationComponent],
  providers: [],
  imports: [CommonModule, RotationRoutingModule],
})
export class RotationModule {}
