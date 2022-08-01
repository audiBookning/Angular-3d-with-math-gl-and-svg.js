# Angular 3d basic samples code with Math-gl

Just some basic 3D cubes with animations to try out the technology with angular.

Uses

- [@math.gl/core](https://github.com/uber-web/math.gl) for the maths
  > A 3D/WebGL math library
- [@svgdotjs/svg.js](https://github.com/svgdotjs/svg.js) for ease of manipulating the svg.

  > The lightweight library for manipulating and animating SVG

  ## Notes

  Based on the code at [Sample-3D-cube
  ](https://github.com/audiBookning/Sample-3D-cube)

  For performance reasons, most of the code will try to reuse everything it can. Which turns the code pretty illegible. In that same vein many thing can be done yet. And a good part of the code reminds more of spaguety than anything else. refactoring is dearly needed.

## Usefull Angular cli commands for dev

Add `--dry-run` flag to only test the command without creating any files

### modules

- generate a lazy loaded module with a default fooMod component and with routing for that component inside the fooMod module.

  - `--route` is to add the module fooMod with a lazy route named 'fooModRoute' to the routes array of the -m module

  `ng g m fooMod --route fooModRoute -m app`

### components

- generate a component at the root project and imported by the root module

  `ng g c fooComp`

- generate a component inside the threejs folder and imported by

  - the root module if no foo module exist
  - the foo module if it exist

  `ng g c foo/barComp`

- generate a component at the root project and imported by the -m module

  `ng g c fooComp -m fooMod`

- generate a component inside the -m module and imported by the same module

  `ng g c foo/fooComp -m fooMod`
