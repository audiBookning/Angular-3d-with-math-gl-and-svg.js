import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RotationComponent } from './rotation.component';

const routes: Routes = [{ path: '', component: RotationComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RotationRoutingModule { }
