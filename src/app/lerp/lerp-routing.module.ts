import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LerpComponent } from './lerp.component';

const routes: Routes = [{ path: '', component: LerpComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LerpRoutingModule { }
