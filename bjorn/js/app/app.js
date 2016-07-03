"use strict";
/**
 * @typedef {Object} SceneItem
 * @property {string} name
 * @property {BABYLON.Mesh[]|BABYLON.AbstractMesh[]} meshes
 */
(function () {
    // Get the canvas element from our HTML above
    var canvas = document.getElementById("renderCanvas");

    // Load the BABYLON 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    var ground;
    // Now, call the createScene function that you just finished creating
    var scene = createScene();
    // The rendered items in the scene
    var items = [];

    createModels();

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });

    document.getElementById("createobj").addEventListener("click", addItem);

    // This begins the creation of a function that we will 'call' just after it's built
    function createScene() {

        // Now create a basic Babylon Scene object 
        var scene = new BABYLON.Scene(engine);
        // Change the scene background color to green.
        scene.clearColor = new BABYLON.Color3(0, 1, 0);

        // Gravity & physics stuff
        var physicsPlugin = new BABYLON.CannonJSPlugin();
        var gravityVector = new BABYLON.Vector3(0, -9.81, 0);

        scene.enablePhysics(gravityVector, physicsPlugin);

        scene.collisionsEnabled = true;
        scene.workerCollisions = true;

        // This creates and positions a free camera
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
        camera.speed *= 0.25;
        // var cameraAlpha = 3 * Math.PI / 2;
        // var cameraBeta =  Math.PI / 3;
        // var camera = new BABYLON.ArcRotateCamera("Camera", cameraAlpha, cameraBeta, 10, BABYLON.Vector3.Zero(), scene);
        // console.log(camera);
        //camera.lowerRadiusLimit = 3;
        //camera.upperRadiusLimit = 15;

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        // This attaches the camera to the canvas
        camera.attachControl(canvas, false);

        //This creates a light, aiming 0,1,0 - to the sky.
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.groundColor = new BABYLON.Color3(1, 1, 1);
        light.intensity = 1;

        // var pointlight = new BABYLON.PointLight("plight", new BABYLON.Vector3(0,0,0), scene);

        // Z axis is above/below
        // var dirLight = new BABYLON.DirectionalLight("dirlight1", new BABYLON.Vector3(1, 0, 0), scene);
        BABYLON.StandardMaterial.AmbientTextureEnabled = false;

        // Let's try our built-in 'ground' shape.  Params: name, width, depth, subdivisions, scene
        ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);
        ground.collisionsEnabled = true;
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.5 }, scene);

        BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
        scene.debugLayer.show();

        //scene.ambientColor = new BABYLON.Color3(1,1,1);

        window.scene = scene;
        // Leave this function
        return scene;
    }  // End of createScene function

    /**
     * Add an item to the scene when you click a button for demo purposes
     */
    function addItem(){

        /**
         * Get a random position on the floor
         * @returns {BABYLON.Vector3}
         */
        function getPosition(){
            // example ((0->1) * ( 3 - (-3))) + (-3)
            // Gives span of  -3 -> 3
            var posX =  (Math.random() * (groundBB.maximum.x - groundBB.minimum.x)) + groundBB.minimum.x;
            var posY =  0.5;
            var posZ =  (Math.random() * (groundBB.maximum.z - groundBB.minimum.z)) + groundBB.minimum.z;

            return new BABYLON.Vector3(posX, posY, posZ);
        }

        /**
         * When the item has finished loading check that the object doesn't collide with anything and if it does recalculate position
         * @param a_item
         */
        function onsuccess(a_item) {
            setTimeout(function(){
                // For this example its only 1 mesh but proper way is to calculate the BB for all meshes.
                var mesh = a_item.meshes[0];
                var meshBB = mesh.getBoundingInfo();

                var bbSize = meshBB.maximum.subtract(meshBB.minimum).scale(0.5);
                var position = mesh.position;

                var intersects = true;
                var uniquePosition = false;

                if (uniquePosition){
                    while (intersects && intersectCount < 100) {
                        // Set it to false
                        intersects = false;
                        for (var i = 0; i < items.length; ++i) {
                            var item = items[i];
                            // Skip checking for self!
                            if (item !== a_item) {
                                // Check if the two bounding boxes intersects,  if they do then get a new position for chair.
                                if (meshBB.intersects(item.meshes[0].getBoundingInfo())) {
                                    intersects = true;
                                    break;
                                }
                            }
                        }

                        // If it intersects just recursively call onsuccess again after updating the position...
                        // Not the most elegant solution but it's quick solution for now.
                        if (intersects) {
                            position = getPosition();

                            var minimum = position.subtract(bbSize);
                            var maximum = position.add(bbSize);

                            // Points for min & max
                            DEBUG3D.drawPoint(scene, minimum, {
                                color: new BABYLON.Color3(0,0,0)
                            });
                            DEBUG3D.drawPoint(scene, maximum, {
                                color: new BABYLON.Color3(0,0,0)
                            });
                            DEBUG3D.drawPoint(scene, mesh.position, {
                                color: new BABYLON.Color3(1,0,0)
                            });
                            DEBUG3D.drawPoint(scene, position, {
                                color: new BABYLON.Color3(0,0,1)
                            });

                            meshBB = new BABYLON.BoundingInfo(minimum, maximum);
                            intersectCount++;
                            console.log("BB intersected: " + intersectCount);
                        } else {
                            mesh.visibility = 1;
                            // No need to update positions if there were no intersects
                            if (intersectCount > 0){
                                mesh.position = position;
                            }
                            setPhysicsImpostor(mesh, scene);
                        }
                    }
                } else {
                    mesh.visibility = 1;
                    setPhysicsImpostor(mesh, scene);
                }
            }, 40);
        }

        var groundBB = ground.getBoundingInfo();
        var loader = new BABYLON.AssetsManager(scene);
        // Turn off loading screen incase it takes a second to load the model & textures
        loader.useDefaultLoadingScreen = false;

        var intersectCount = 0;
        // random y-rotation
        var yaw = Math.random() * Math.PI * 2;

        var position = getPosition();
        var rotation = BABYLON.Quaternion.RotationYawPitchRoll(yaw, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            hide:true,
            physics: false,
            position: position,
            rotation:rotation,
            taskname: "chair",
            success: onsuccess
        }, loader);

        loader.load();
    }

    function createModels() {
        var loader = new BABYLON.AssetsManager(scene);

        var position = new BABYLON.Vector3(0, 0, 0);
        var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
        loadModel({
            filename: "Colo_Rug_Fab_LtBrown_001.obj",
            //filename: "StoneWall_LOW.obj",
            physics: false,
            position: position,
            rotation:rotation,
            taskname: "rug"
        }, loader);

        position = new BABYLON.Vector3(2, 1, 0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * -0.5, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            taskname: "chair"
        }, loader);

        position = new BABYLON.Vector3(-2, 1, 0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * 0.5, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            taskname: "chair"
        }, loader);

        position = new BABYLON.Vector3(0, 1, 2);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            taskname: "chair"
        }, loader);

        position = new BABYLON.Vector3(0, 1, -2);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            taskname: "chair"
        }, loader);


        position = new BABYLON.Vector3(0, 3, 0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
        loadModel({
            filename: "KidsPrin_CeFan_Wd_LtPurp_001.obj",
            physics: false,
            position: position,
            rotation:rotation,
            taskname: "bedfan"
        }, loader);

        position = new BABYLON.Vector3(0, 1, 0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
        loadModel({
            filename: "KidsJng_Bed_Wd_LtBrown_002.obj",
            physics: true,
            position: position,
            rotation:rotation,
            taskname: "bed"
        }, loader);

        loader.load();
    }

    function loadModel(a_options, a_loader) {
        var task = a_loader.addMeshTask(a_options.taskname, "", "assets/", a_options.filename);
        /**
         *
         * @param {BABYLON.MeshAssetTask} t
         */
        task.onSuccess = function (t) {
            /**
             * Create an item for the scene
             * @type {SceneItem}
             */
            var item = {
                name: t.name,
                meshes: t.loadedMeshes
            };

            items.push(item);
            // Set the models position
            for (var i = 0; i < item.meshes.length; ++i) {

                var mesh = item.meshes[i];

                mesh.position = a_options.position;
                mesh.rotationQuaternion = a_options.rotation;

                setTimeout(function(){
                    if (mesh.material){
                        console.log(mesh.material);
                        mesh.material.invertNormalMapX = false;
                        mesh.material.invertNormalMapY = false;
                    }
                    else{
                        console.log("no material");
                    }
                }, 100);

                if (a_options.physics){
                    setPhysicsImpostor(mesh, scene);
                }

                if (a_options.hide){
                    mesh.visibility = 0;
                }
            }

            if (a_options.success){
                a_options.success(item);
            }
        };
        
        return task;
    }

    function setPhysicsImpostor(a_mesh, a_scene){
        var physicsImpostor = new BABYLON.PhysicsImpostor(a_mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.8 }, a_scene);
        a_mesh.physicsImpostor = physicsImpostor;

        // On collision with the floor
        physicsImpostor.registerOnPhysicsCollide( ground.physicsImpostor, function() {
            setTimeout(function(){
                physicsImpostor.dispose();
            }, 1);
        });

        console.log(physicsImpostor);
    }
})();
