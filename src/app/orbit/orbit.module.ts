import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrbitRoutingModule } from './orbit-routing.module';
import { OrbitComponent } from './orbit.component';


@NgModule({
  declarations: [
    OrbitComponent
  ],
  imports: [
    CommonModule,
    OrbitRoutingModule
  ]
})
export class OrbitModule { }
