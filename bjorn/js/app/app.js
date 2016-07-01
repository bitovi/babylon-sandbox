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

    // Now, call the createScene function that you just finished creating
    var scene = createScene();

    var loader = new BABYLON.AssetsManager(scene);
    // The rendered items in the scene
    var items = [];
    createModels(loader);

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });


    // This begins the creation of a function that we will 'call' just after it's built
    function createScene() {

        // Now create a basic Babylon Scene object 
        var scene = new BABYLON.Scene(engine);

        // Change the scene background color to green.
        scene.clearColor = new BABYLON.Color3(0, 1, 0);

        // This creates and positions a free camera
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, false);

        // This creates a light, aiming 0,1,0 - to the sky.
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

        // Dim the light a small amount
        light.intensity = .5;

        

        // Let's try our built-in 'ground' shape.  Params: name, width, depth, subdivisions, scene
        var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);
        
        // Leave this function
        return scene;
    };  // End of createScene function    

    function createModels(a_loader) {
        var position = new BABYLON.Vector3(0, 0, 0);
        var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
        loadModel("rug", "Colo_Rug_Fab_LtBrown_001.obj", position, rotation, a_loader, false);

        position = new BABYLON.Vector3(2,0,0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * -0.5, 0, 0);
        loadModel("chair", "West_Chair_Leath_Brown_001.obj", position, rotation, a_loader, false);

        position = new BABYLON.Vector3(-2,0,0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * 0.5, 0, 0);
        loadModel("chair", "West_Chair_Leath_Brown_001.obj", position, rotation, a_loader, false);

        position = new BABYLON.Vector3(0,0,2);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
        loadModel("chair", "West_Chair_Leath_Brown_001.obj", position, rotation, a_loader, false);

        position = new BABYLON.Vector3(0,0,-2);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
        loadModel("chair", "West_Chair_Leath_Brown_001.obj", position, rotation, a_loader, false);
        
        loader.load();
    };


    function loadModel(a_taskName, a_file, a_position, a_rotation, a_loader, a_load) {
        var task = a_loader.addMeshTask(a_taskName, "", "assets/", a_file);
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
                item.meshes[i].position = a_position;
                item.meshes[i].rotationQuaternion = a_rotation;
                console.log(item.meshes[i]);
            }
        };

        if (a_load){
            a_loader.load();
        }
        
        return task;
    }
})();
