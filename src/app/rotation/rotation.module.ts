import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RotationRoutingModule } from './rotation-routing.module';
import { RotationComponent } from './rotation.component';


@NgModule({
  declarations: [
    RotationComponent
  ],
  imports: [
    CommonModule,
    RotationRoutingModule
  ]
})
export class RotationModule { }
