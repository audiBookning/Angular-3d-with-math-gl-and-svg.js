import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: 'rotation', loadChildren: () => import('./rotation/rotation.module').then(m => m.RotationModule) }, { path: 'streching', loadChildren: () => import('./streching/streching.module').then(m => m.StrechingModule) }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
