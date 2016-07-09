import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './babylon-canvas.less!';
import template from './babylon-canvas.stache!';
import Babylon from 'babylonjs/babylon.max';
import { isServer } from '../../util/environment';
import { ObjLoader } from './bjorn-tests/lib/babylon.objFileLoader.js';
//import './bjorn-tests/lib/cannon.js';
import { debug3d } from './bjorn-tests/debug3d.js';
import { lighting } from './bjorn-tests/lighting.js';
import { main } from './bjorn-tests/app.js';

export const ViewModel = Map.extend({
  define: {
    message: {
      value: 'This is the babylon-canvas component'
    }
  }
});

export default Component.extend({
  tag: 'babylon-canvas',
  viewModel: ViewModel,
  template,
  events: {
    inserted() {
      if ( !isServer ) {
        ObjLoader();
        debug3d();
        lighting();
        main();
        return;
      }
      if ( 1 || isServer ) {
        return;
      }

      var canvas = this.element.find('canvas')[0];

      // Load the Babylon 3D engine
      var engine = new Babylon.Engine(canvas, true);

      // -------------------------------------------------------------
      // Here begins a function that we will 'call' just after it's built
      var createScene = function () {
        // Now create a basic Babylon Scene object
        var scene = new Babylon.Scene(engine);
        // Change the scene background color to green.
        scene.clearColor = new Babylon.Color3(0.9, 0.9, 0.9);
        // This creates and positions a free camera
        var camera = new Babylon.FreeCamera("camera1", new Babylon.Vector3(0, 5, -10), scene);
        // This targets the camera to scene origin
        camera.setTarget(Babylon.Vector3.Zero());
        // This attaches the camera to the canvas
        camera.attachControl(canvas, false);
        // This creates a light, aiming 0,1,0 - to the sky.
        var light = new Babylon.HemisphericLight("light1", new Babylon.Vector3(0, 1, 0), scene);
        // Dim the light a small amount
        light.intensity = .5;
        // Let's try our built-in 'sphere' shape. Params: name, subdivisions, size, scene
        var sphere = Babylon.Mesh.CreateSphere("sphere1", 16, 2, scene);
        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;
        // Let's try our built-in 'ground' shape. Params: name, width, depth, subdivisions, scene
        var ground = Babylon.Mesh.CreateGround("ground1", 6, 6, 2, scene);
        // Leave this function
        return scene;
      }; // End of createScene function
      // -------------------------------------------------------------
      // Now, call the createScene function that you just finished creating
      var scene = createScene();

      // Register a render loop to repeatedly render the scene
      engine.runRenderLoop(function () {
        scene.render();
      });

      // Watch for browser/canvas resize events
      // window.addEventListener("resize", function () {
      //    engine.resize();
      // });
    }
  }
});