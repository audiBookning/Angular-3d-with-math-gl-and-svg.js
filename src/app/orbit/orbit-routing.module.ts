import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrbitComponent } from './orbit.component';

const routes: Routes = [{ path: '', component: OrbitComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrbitRoutingModule { }
