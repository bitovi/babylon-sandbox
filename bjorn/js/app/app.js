"use strict";

(function () {
    // Get the canvas element from our HTML above
    var canvas = document.getElementById("renderCanvas");

    // Load the BABYLON 3D engine
    var engine = new BABYLON.Engine(canvas, true);
    var item = null;
    var collisions = [];

    function createScene () {
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new BABYLON.Scene(engine);

        // This creates and positions a free camera (non-mesh)
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        var ground = BABYLON.Mesh.CreateGround("ground1", 60, 60, 2, scene);

        const size = 2;

        item = BABYLON.MeshBuilder.CreateBox( "item", {
            width: size,
            height: size,
            depth: size
        }, scene );
        item.material = new BABYLON.StandardMaterial( "itemMaterial", scene );
        item.material.diffuseColor = BABYLON.Color3.FromHexString("#BADBAD");;

        item.position.y = size * 0.5;

        const collisionSize = 1.5;
        let collisionMaterial = new BABYLON.StandardMaterial( "colMat", scene );
        collisionMaterial.diffuseColor = BABYLON.Color3.FromHexString( "#D0GD0G" );

        let collisionOptions = {
          width: collisionSize,
          height: collisionSize,
          depth: collisionSize
        };

        let collisionPositions = [
          { x: 0, z: 2 },
          { x: 0, z: -2 },
          { x:2, z: 0 },
          { x:-2, z:0 }
        ];

        for ( let i = 0; i < collisionPositions.length; ++i ) {
          let collisionBox = BABYLON.MeshBuilder.CreateBox( "collisionBox", collisionOptions, scene );
          collisionBox.material = collisionMaterial;

          let position = collisionPositions[ i ];

          collisionBox.position.x = size * position.x;
          collisionBox.position.y = collisionSize * 0.5;
          collisionBox.position.z = size * position.z;

          collisions.push( collisionBox );
        }

        return scene;
    };

    function renderLoop() {

    }

    var scene = createScene();

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        renderLoop();
        scene.render();
    });

})();
