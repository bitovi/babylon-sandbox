"use strict";

(function () {
    // Get the canvas element from our HTML above
    var canvas = document.getElementById("renderCanvas");

    // Load the BABYLON 3D engine
    var engine = new BABYLON.Engine(canvas, true);
    var ground;
    var item = null;
    var collisions = [];

    function createScene () {
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new BABYLON.Scene(engine);
        window.scene = scene;

        scene.debugLayer.show();

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
        ground = BABYLON.Mesh.CreateGround("ground1", 60, 60, 2, scene);
        ground.material = new BABYLON.StandardMaterial("groundmat", scene);
        ground.material.specularColor = BABYLON.Color3.Black();

        let itemMaterial = new BABYLON.StandardMaterial( "itemMaterial", scene );

        const size = 2;
        let height = size * 0.5;

        let type = localStorage.getItem("type");
        if ( type ) {
          type = parseInt( type );
        }

        if ( type === 1 ) {
          item = BABYLON.MeshBuilder.CreateSphere("item", {
            diameter: size
          }, scene);
        } else if ( type === 2 ) {
          item = BABYLON.MeshBuilder.CreateCylinder( "item", {
            height: size,
            diameter: size
          }, scene );
        } else if ( type === 3 ) {
          item = BABYLON.MeshBuilder.CreateTorus( "item", {
            diameter: size
          }, scene);
        }
        else if ( type === 4 ) {

          // Load babylon file
          BABYLON.SceneLoader.ImportMesh("", "", "data:" + JSON.stringify( babylonfile ), scene, ( meshes ) => {
            for ( let i = 0; i < meshes.length; ++i ) {
              meshes[i].isVisible = true;
              meshes[i].material = itemMaterial;
            }
            item = meshes[0];
          });
          // For the height!
          height = 0;
        }
        else {
          item = BABYLON.MeshBuilder.CreateBox( "item", {
            width: size,
            height: size,
            depth: size
          }, scene );
        }

        item.material = itemMaterial;
        item.material.diffuseColor = BABYLON.Color3.FromHexString( "#BADBAD" );
        item.material.specularColor = BABYLON.Color3.Black();
        item.material.alpha = 0.8;

        item.position.y = height;
        // item.rotation.y = Math.PI * 0.33;

      item.rotationQuaternion = BABYLON.Quaternion.Identity();

        const collisionSize = 1.5;
        const collisionColor = "#1CE1CE";
        let collisionMaterial = new BABYLON.StandardMaterial( "colMat", scene );
        collisionMaterial.diffuseColor = BABYLON.Color3.FromHexString( collisionColor );
        collisionMaterial.specularColor = BABYLON.Color3.Black();
        collisionMaterial.alpha = 0.7;

        let collisionOptions = {
          width: collisionSize,
          height: collisionSize,
          depth: collisionSize
        };

        let collisionPositions = [
          { x: 0, z: 2 },
          { x: 2.5, z: 2 },
          { x:2, z: 0 },
          { x:2, z:1 }
        ];

        for ( let i = 0; i < collisionPositions.length; ++i ) {
          let collisionBox = BABYLON.MeshBuilder.CreateBox( "collisionBox", collisionOptions, scene );
          collisionBox.material = collisionMaterial;

          let position = collisionPositions[ i ];

          collisionBox.position.x = collisionSize * position.x;
          collisionBox.position.y = collisionSize * 0.5 + 0.25;
          collisionBox.position.z = collisionSize * position.z;

          if ( i == 0 ) {
            collisionBox.rotation.y = Math.PI * 0.33;
          }

          collisions.push( collisionBox );
        }

        let collisionFurniture = item.clone();
        let collisionMeshes = [ collisionFurniture, ...collisionFurniture.getChildMeshes() ];

        collisionFurniture.position.copyFromFloats( -3, 0, 0 );

        for ( let i = 0; i < collisionMeshes.length; ++i ) {
          collisionMeshes[ i ].material = collisionMaterial;
          collisions.push( collisionMeshes[ i ]);
        }

        generateMagnetPoints( item );

        return scene;
    };

    function renderLoop() {

    }

    var scene = createScene();

    window.initMouseEvents( scene, item, ground );

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        renderLoop();
        scene.render();
    });

})();
