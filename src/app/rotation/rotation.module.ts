import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { Object3d } from '../../3d/Object3d';
import { Svg3D } from '../../3d/Svg3d';
import { RotationRoutingModule } from './rotation-routing.module';
import { RotationComponent } from './rotation.component';

@NgModule({
  declarations: [RotationComponent],
  providers: [Svg3D],
  imports: [CommonModule, RotationRoutingModule],
})
export class RotationModule {}
