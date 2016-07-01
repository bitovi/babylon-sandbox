/**
 * @typedef {Object} SceneItem
 * @property {string} name
 * @property {BABYLON.Mesh[]} meshes
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

    function addItem(){

        var groundBB = ground.getBoundingInfo();
        var loader = new BABYLON.AssetsManager(scene);

        var yaw = Math.random() * Math.PI * 2;
        // example ((0->1) * ( 3 - (-3))) + (-3)
        // Gives span of  -3 -> 3
        var posX =  (Math.random() * (groundBB.maximum.x - groundBB.minimum.x)) + groundBB.minimum.x;
        var posY =  3
        var posZ =  (Math.random() * (groundBB.maximum.z - groundBB.minimum.z)) + groundBB.minimum.z;

        var position = new BABYLON.Vector3(posX, posY, posZ);
        var rotation = BABYLON.Quaternion.RotationYawPitchRoll(yaw, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            taskname: "chair",
            success: function(a_item){
                // For this example its only 1 mesh but proper way is to calculate the BB for all meshes.
                var mesh = a_item.meshes[0];
                var meshBB = mesh.getBoundingInfo();
            }
        }, loader);

        loader.load();
    }
    // This begins the creation of a function that we will 'call' just after it's built
    function createScene() {

        // Now create a basic Babylon Scene object 
        var scene = new BABYLON.Scene(engine);
        // Change the scene background color to green.
        scene.clearColor = new BABYLON.Color3(0, 1, 0);

        // Gravity & physics stuff
        //ar physicsPlugin = BABYLON.CannonJSPlugin();
        var gravityVector = new BABYLON.Vector3(0, -9.81, 0);
        scene.enablePhysics(gravityVector);

        scene.collisionsEnabled = true;
        scene.workerCollisions = true;

        // This creates and positions a free camera
        //var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
        var cameraAlpha = 3 * Math.PI / 2;
        var cameraBeta =  Math.PI / 3;
        var camera = new BABYLON.ArcRotateCamera("Camera", cameraAlpha, cameraBeta, 10, BABYLON.Vector3.Zero(), scene);
        console.log(camera);
        camera.lowerRadiusLimit = 3;
        camera.upperRadiusLimit = 15;

        // This targets the camera to scene origin
        //camera.setTarget(BABYLON.Vector3.Zer());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, false);

        // This creates a light, aiming 0,1,0 - to the sky.
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

        // Dim the light a small amount
        light.intensity = 1.5;

        // Let's try our built-in 'ground' shape.  Params: name, width, depth, subdivisions, scene
        ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);
        ground.collisionsEnabled = true;
        
        // Leave this function
        return scene;
    };  // End of createScene function    

    function createModels() {
        var loader = new BABYLON.AssetsManager(scene);

        var position = new BABYLON.Vector3(0, 0, 0);
        var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
        loadModel({
            filename: "Colo_Rug_Fab_LtBrown_001.obj",
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
    };


    function loadModel(a_input, a_loader) {
        var task = a_loader.addMeshTask(a_input.taskname, "", "assets/", a_input.filename);
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

                mesh.position = a_input.position;
                mesh.rotationQuaternion = a_input.rotation;

                if (a_input.physics){
                    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.5 }, scene);
                    setTimeout(function(){
                        //mesh.physicsImpostor.sleep();
                    }, 500);
                }
                //mesh.showBoundingBox = true;
            }

            if (a_input.success){
                a_input.success(item);
            }
        };
        
        return task;
    }
})();
