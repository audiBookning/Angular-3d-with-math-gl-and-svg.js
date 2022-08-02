import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SvgClickComponent } from './svg-click.component';

const routes: Routes = [{ path: '', component: SvgClickComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SvgClickRoutingModule { }
