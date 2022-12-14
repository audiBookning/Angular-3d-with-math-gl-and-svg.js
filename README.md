# Angular 3d basic samples code with Math-gl

Just some basic 3D cubes with animations to try out the technology with angular.
This repo would be what i call scratchpad code.

Uses

- [@math.gl/core](https://github.com/uber-web/math.gl) for the maths

  > A 3D/WebGL math library

- [@svgdotjs/svg.js](https://github.com/svgdotjs/svg.js) for ease of manipulating the svg.

  > The lightweight library for manipulating and animating SVG

- [Popmotion](https://github.com/popmotion/popmotion) for timeline animation of the stretching

  > "Simple animation libraries for delightful user interfaces"

  ## Random/Rant Notes

  - This last commit has done some refactoring, added more interactivity and features but it also introduced several weird bugs. Much refactoring must be done. This case shows well the disadvantages of spaghetti code. As always it is the price of laziness.

  - Based on the code at [Sample-3D-cube
    ](https://github.com/audiBookning/Sample-3D-cube)

  - Althoug this example is very basic, for future performance reasons, most of the code will try to reuse everything it can. Which turns the code pretty illegible. In that same vein, much work has to be done.

  - Refactoring is dearly needed. Not only because of performance but the code, in trying to be simpler and avoid too much abstraction, is also beginning to be too specific and reminds more of spaghetti than anything else.

  - The more one refactor in OOP, the more dependency injection looks good.s

  ## Goals

  I will take advantage that i have some time to learn an experiment here and there. I also have soe potencial aplications for this code.

  In this case i do not want to learn in a safe (fenced) environment, so the code will be for the most part illegible.

  If i continue with this and manage, in the latter phases, to get something minimally useful for anyone, i will let this code stay public.

  ## TODO:

  - distanceByAxis not being updated when stretching
  - stretchMatrix the same...
  - polygons, nodesHash the same...
  - some poligons are not rendered correctly at some times because of the random colors generated are not correct. Sometimes they only have 4 digits instead of 6

  ## Svg3D and Object3d

  The funcionality is divided in 2 classes.

  - Svg3D is the main service and deals mainly with instancianting Object3d and the rendering and animation in the svg tag

  - Object3d deals with the 3d maths and geometry. At this time it is only geometry is a cube.

    - note that the streching is done on world coordinate system, not the model. This needs to change in the future, if ones plans to have a better interaction with the 3d objects.

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
