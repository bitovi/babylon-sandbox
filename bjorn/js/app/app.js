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

    var pickingPlane;
    // Need to be global currently so it's not selected by picking
    var skybox;
    var camera;
    // Now, call the createScene function that you just finished creating
    var scene;
    var selectedMesh = null;
    // The rendered items in the scene
    var items = [];
    var mouseClicked = false;
    // Start pos X, Y for mouse
    var mouseX, mouseY,
        lastMouseX, lastMouseY;

    createScene();
    createSky();
    //createModels();

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();

        window.updateLights(engine.deltaTime);
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });

    window.addEventListener("mousemove", function(e){
        if (mouseClicked){
            var deltaX = e.screenX - lastMouseX;
            var deltaY = e.screenY - lastMouseY;

            lastMouseX = e.screenX;
            lastMouseY = e.screenY;

            moveSelectedItem(deltaX, deltaY);
        } else {
            pickingItem();
        }
    });

    window.addEventListener("mousedown", function(e){
        if (selectedMesh){
            mouseX = lastMouseX = e.screenX;
            mouseY = lastMouseY = e.screenY;
            mouseClicked = true;
            camera.inputs.remove(camera.inputs.attached.mouse);
        }
    });

    window.addEventListener("mouseup", function(){
        if (mouseClicked){
            mouseClicked = false;
            camera.inputs.addMouse();
        }
    });

    document.getElementById("createobj").addEventListener("click", addItem);

    // This begins the creation of a function that we will 'call' just after it's built
    function createScene() {

        // Now create a basic Babylon Scene object 
        scene = new BABYLON.Scene(engine);

        // Change the scene background color to green.
        scene.clearColor = new BABYLON.Color3(0, 1, 0);

        // Gravity & physics stuff
        var physicsPlugin = new BABYLON.CannonJSPlugin();
        var gravityVector = new BABYLON.Vector3(0, -9.81, 0);

        scene.enablePhysics(gravityVector, physicsPlugin);

        scene.collisionsEnabled = true;
        scene.workerCollisions = true;

        // This creates and positions a free camera
        camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
        camera.speed *= 0.25;
        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        // This attaches the camera to the canvas
        camera.attachControl(canvas, false);



        // Z axis is above/below
        // var dirLight = new BABYLON.DirectionalLight("dirlight1", new BABYLON.Vector3(1, 0, 0), scene);
        BABYLON.StandardMaterial.AmbientTextureEnabled = false;

        window.createGround(scene, createModels, loadModel);

        BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
        scene.debugLayer.show();

        window.initLights(scene);

        window.scene = scene;
        //scene.ambientColor = new BABYLON.Color3(1,1,1);
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

            posX /= 5;
            posZ /= 5;

            return new BABYLON.Vector3(posX, posY, posZ);
        }

        /**
         * When the item has finished loading check that the object doesn't collide with anything and if it does recalculate position
         * @param a_item
         */
        function onsuccess(a_item) {

            var checkmaterial = function(){
                var material = a_item.meshes[0].material;
                if (material){

                    var colorVector = new BABYLON.Vector3
                        (Math.random() / 3,
                        Math.random() / 3,
                        Math.random() / 3);

                    colorVector.normalize();

                    material.diffuseColor = new BABYLON.Color3(colorVector.x, colorVector.y, colorVector.z);
                    console.log(material.diffuseColor);
                } else {
                    setTimeout(checkmaterial, 50);
                }
            };

            checkmaterial();


            setTimeout(function(){
                // For this example its only 1 mesh but proper way is to calculate the BB for all meshes.
                var mesh = a_item.meshes[0];
                var meshBB = mesh.getBoundingInfo();

                var bbSize = meshBB.maximum.subtract(meshBB.minimum).scale(0.5);
                var position = mesh.position;

                var intersects = true;
                var uniquePosition = true;

                if (uniquePosition){
                    while (intersects && intersectCount < 100) {
                        // Set it to false
                        intersects = false;
                        for (var i = 0; i < items.length; ++i) {
                            var item = items[i];
                            // Skip checking for self!
                            if (item !== a_item && item.name !== "ground") {
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

                            meshBB = new BABYLON.BoundingInfo(minimum, maximum);
                            intersectCount++;

                        } else {
                            if (intersectCount > 0){
                                mesh.position = position;
                                console.log("BB intersected: " + intersectCount);
                            }
                            showMesh(mesh);
                        }
                    }
                } else {
                    showMesh(mesh);
                }
            }, 40);
        }

        /**
         * Show the mesh, add outline and set physics impostor
         * @param a_mesh
         */
        function showMesh(a_mesh){
            a_mesh.visibility = 1;
            // Remove the outline of old newly added object
            setMeshOutline(a_mesh);

            setPhysicsImpostor(a_mesh, scene);
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
            rotateNormals:true,
            taskname: "chair",
            success: onsuccess
        }, loader);

        loader.load();
    }

    function createModels() {

        var loader = new BABYLON.AssetsManager(scene);

        var rotateNormals = true;

        var position = new BABYLON.Vector3(0, 0, 0);
        var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
        loadModel({
            filename: "Colo_Rug_Fab_LtBrown_001.obj",
            physics: false,
            position: position,
            rotation:rotation,
            rotateNormals:rotateNormals,
            taskname: "rug"
        }, loader);

        position = new BABYLON.Vector3(2, 1, 0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * -0.5, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            rotateNormals:rotateNormals,
            taskname: "chair"
        }, loader);

        position = new BABYLON.Vector3(-2, 1, 0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * 0.5, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            rotateNormals:rotateNormals,
            taskname: "chair"
        }, loader);

        position = new BABYLON.Vector3(0, 1, 2);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            rotateNormals:rotateNormals,
            taskname: "chair"
        }, loader);

        position = new BABYLON.Vector3(0, 1, -2);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
        loadModel({
            filename: "West_Chair_Leath_Brown_001.obj",
            physics: true,
            position: position,
            rotation:rotation,
            rotateNormals:rotateNormals,
            taskname: "chair"
        }, loader);


        position = new BABYLON.Vector3(0, 3, 0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
        loadModel({
            filename: "KidsPrin_CeFan_Wd_LtPurp_001.obj",
            physics: false,
            position: position,
            rotation:rotation,
            rotateNormals:false,
            taskname: "bedfan"
        }, loader);

        position = new BABYLON.Vector3(0, 1, 0);
        rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
        loadModel({
            filename: "KidsJng_Bed_Wd_LtBrown_002.obj",
            physics: true,
            position: position,
            rotation:rotation,
            rotateNormals:rotateNormals,
            taskname: "bed"
        }, loader);


        loader.load();
    }

    function createSky(){
        // https://www.eternalcoding.com/?p=263
        skybox = BABYLON.Mesh.CreateBox("skyBox", 1000, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skybox/ely_lakes/lakes", scene); //["_px.tga", "_py.tga", "_pz.tga", "_nx.tga", "_ny.tga", "_nz.tga"]);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
    }

    function loadModel(a_options, a_loader) {

        a_options.root = a_options.root || "assets/";

        var task = a_loader.addMeshTask(a_options.taskname, "", a_options.root, a_options.filename);
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
                mesh.e_item = item;

                if (item.meshes.length > 1){
                    mesh.e_siblings = [];

                    for (var j = 0; j < item.meshes.length; ++j){
                        if (j != i){
                            mesh.e_siblings.push(item.meshes[j]);
                        }
                    }
                }

                if (a_options.rotateNormals){
                    rotateNormals(mesh);
                }

                if (!a_options.skipTag){
                    mesh.tag = 1;
                }

                mesh.receiveShadows = true;
                mesh.position = a_options.position;
                mesh.rotationQuaternion = a_options.rotation;

                window.addToShadowGenerator(mesh);

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

    function moveSelectedItem(){

        if (!pickingPlane){
            pickingPlane = new BABYLON.Mesh.CreatePlane("pickingplane", 1000, scene);
            pickingPlane.rotation.x += Math.PI * 0.5;
            pickingPlane.visibility = 0;
        }

        var pickingInfo = scene.pick( scene.pointerX, scene.pointerY, function(a_hitMesh){
            return a_hitMesh === pickingPlane;
        });

        if (pickingInfo.hit){
            selectedMesh.position.x = pickingInfo.pickedPoint.x;
            selectedMesh.position.z = pickingInfo.pickedPoint.z;

            // DEBUG3D.drawPoint(scene, pickingInfo.pickedPoint);
        }

        var intersects = false;

        var selectedBBInfo = selectedMesh.getBoundingInfo();

        for ( var i = 0; i< items.length; ++i){
            var item = items[i];

            if (selectedMesh.e_item === item){
                continue;
            }

            for (var j = 0; j < item.meshes.length; ++j){
                var mesh = item.meshes[j];

                // If no tag then go next mesh
                if (!mesh.tag){
                    continue;
                }

                // Need a better way to check a group of meshes but for now just set intersects as false again
                if (mesh === selectedMesh){
                    intersects = false;
                    break;
                }

                var meshBBInfo = mesh.getBoundingInfo();

                if (selectedBBInfo.intersects( meshBBInfo, false)){
                    intersects = true;
                    break;
                }
            }

            if (intersects){
                break;
            }
        }

        if (intersects){
            // rgb( 1, 0, 0)
            selectedMesh.outlineColor = new BABYLON.Color3(1, 0, 0);
            if (selectedMesh.e_siblings){
                for ( var i = 0; i < selectedMesh.e_siblings.length; ++i){
                    selectedMesh.e_siblings[i].outlineColor = new BABYLON.Color3(1, 0, 0);
                }
            }
        } else {
            // rgb( 86, 170, 206)
            selectedMesh.outlineColor = new BABYLON.Color3(0.3359375, 0.6640625, 0.8046875);
            if (selectedMesh.e_siblings){
                for ( var i = 0; i < selectedMesh.e_siblings.length; ++i){
                    selectedMesh.e_siblings[i].outlineColor = new BABYLON.Color3(0.3359375, 0.6640625, 0.8046875);
                }
            }
        }
    }

    /**
     * Multiply quat quaternion with vector3
     * @param {Array} quat
     * @param {Array} vec3
     * @param {Array?} vec3Dest
     * @returns {*}
     */
    function multiplyVector3(quat, vec3, vec3Dest) {
        vec3Dest || (vec3Dest = vec3);
        var d = vec3[0],
            e = vec3[1],
            g = vec3[2],
            b = quat[0],
            f = quat[1],
            h = quat[2],
            a = quat[3],
            i = a * d + f * g - h * e,
            j = a * e + h * d - b * g,
            k = a * g + b * e - f * d,
            d = -b * d - f * e - h * g;
        vec3Dest[0] = i * a + d * -b + j * -h - k * -f;
        vec3Dest[1] = j * a + d * -f + k * -b - i * -h;
        vec3Dest[2] = k * a + d * -h + i * -f - j * -b;
        return vec3Dest;
    };

    /**
     * Pick an item by at mouse X & Y coordinates (or touch)
     */
    function pickingItem(){
        // Return pickingInfo for first object hit except ground
        var pickingInfo = scene.pick( scene.pointerX, scene.pointerY, function(a_hitMesh){
            return a_hitMesh.tag === 1;
        });

        // If the info hit a mesh that isn't the ground then outline it
        if (pickingInfo.hit) {
            var mesh = pickingInfo.pickedMesh;

            if (selectedMesh !== mesh){
                setMeshOutline(mesh);
            }
        // Else remove outline
        } else {
            if (selectedMesh){
                selectedMesh.renderOutline = false;
                if (selectedMesh.e_siblings){
                    for ( var i = 0; i < selectedMesh.e_siblings.length; ++i){
                        selectedMesh.e_siblings[i].renderOutline = false;
                    }
                }
                selectedMesh = null;
            }
        }
    }

    function rotateNormals( a_mesh ){
        var normals = a_mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);

        var rotationQuat = BABYLON.Quaternion.RotationYawPitchRoll(0,  Math.PI * 1.5, 0);

        for (var i = 0; i < normals.length; i+= 3){
            var normalVector = [ normals[i], normals[i + 1], normals[i + 2] ];

            // From glMatrix 0.95
            multiplyVector3( [ rotationQuat.x, rotationQuat.y, rotationQuat.z, rotationQuat.w ],
                normalVector);

            normals[i] = normalVector[0];
            normals[i+1] = normalVector[1];
            normals[i + 2] = normalVector[2];
        }

        a_mesh.setVerticesData( BABYLON.VertexBuffer.NormalKind, normals );
    }

    function setMeshOutline(a_mesh, a_skipSinblings){
        if (!a_skipSinblings){
            if (selectedMesh){
                selectedMesh.renderOutline = false;
                if (selectedMesh.e_siblings){
                    for ( var i = 0; i < selectedMesh.e_siblings.length; ++i){
                        selectedMesh.e_siblings[i].renderOutline = false;
                    }
                }
            }

            if (a_mesh.e_siblings){
                for ( var i = 0; i < a_mesh.e_siblings.length; ++i){
                    setMeshOutline(a_mesh.e_siblings[i], true);
                }
            }
            selectedMesh = a_mesh;
        }

        a_mesh.renderOutline = true;
        // rgb( 86, 170, 206)
        a_mesh.outlineColor = new BABYLON.Color3(0.3359375, 0.6640625, 0.8046875);
        a_mesh.outlineWidth = 0.025;
    }

    function setPhysicsImpostor(a_mesh, a_scene){
        var physicsImpostor = new BABYLON.PhysicsImpostor(a_mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.8 }, a_scene);
        a_mesh.physicsImpostor = physicsImpostor;

        // On collision with the floor
        physicsImpostor.registerOnPhysicsCollide( ground.physicsImpostor, function ( physImpos, collidedWithPhysImpos ) {
            setTimeout(function(){
                physicsImpostor.dispose();
                if ( collidedWithPhysImpos.object.id === "ground1" ) {
                    physImpos.object.position.y = 0;
                }
            }, 1);
        });
    }


})();
