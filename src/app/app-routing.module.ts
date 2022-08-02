import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'rotation',
    loadChildren: () =>
      import('./rotation/rotation.module').then((m) => m.RotationModule),
  },
  {
    path: 'svgClick',
    loadChildren: () =>
      import('./svg-click/svg-click.module').then((m) => m.SvgClickModule),
  },
  {
    path: 'orbit',
    loadChildren: () =>
      import('./orbit/orbit.module').then((m) => m.OrbitModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
