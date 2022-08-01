import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StrechingComponent } from './streching.component';

const routes: Routes = [{ path: '', component: StrechingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StrechingRoutingModule { }
