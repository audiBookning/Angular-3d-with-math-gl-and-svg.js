import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StrechingRoutingModule } from './streching-routing.module';
import { StrechingComponent } from './streching.component';


@NgModule({
  declarations: [
    StrechingComponent
  ],
  imports: [
    CommonModule,
    StrechingRoutingModule
  ]
})
export class StrechingModule { }
