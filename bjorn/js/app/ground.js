/**
 * Created on 2016-07-10.
 */
(function(BABYLON){
    var scene;

    var resetBtn = document.getElementById("resetGround"),
        changeTextureBtn = document.getElementById("changeTexture"),
        changeColorBtn = document.getElementById("changeColor");

    var defaultTexture,
        defaultBump,
        defaultColor,
        hasChanged = false;

    resetBtn.addEventListener("click", resetGround);
    changeTextureBtn.addEventListener("click", changeTexture);
    changeColorBtn.addEventListener("click", changeColor);

    window.createGround = function(a_scene, createModels, loadModel){
        scene = a_scene;

        var loader = new BABYLON.AssetsManager(scene);

        var position = new BABYLON.Vector3(0, 0, 0);
        var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);

        var meshId = -1;

        loadModel({
            filename: "Patio_001_LOD0.obj",
            physics: false,
            position: position,
            root: "assets/LS_15/",
            rotation:rotation,
            rotateNormals: true,
            taskname: "ground",
            skipTag:true,
            success: function(a_item){

                for (var i = 0; i < a_item.meshes.length; ++i){
                    var mesh = a_item.meshes[i];
                    mesh.collisionsEnabled = true;
                    mesh.receiveShadows = true;

                    if (mesh.id === "Floor_001"){
                        meshId = i;
                        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.5 }, scene);
                        ground = mesh;
                        window.ground = ground;

                        excludeMeshForLight(mesh);
                    }


                }

                createModels();
            }
        }, loader);

        loader.load();
        /*
         // Let's try our built-in 'ground' shape.  Params: name, width, depth, subdivisions, scene
         ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);
         ground.collisionsEnabled = true;
         ground.receiveShadows = true;
         ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.5 }, scene);

         ground.material = new BABYLON.StandardMaterial("groundmat", scene);
         ground.material.diffuseTexture = new BABYLON.Texture("assets/Resources/slack-imgs.com.jpg", scene);
         ground.material.diffuseColor = new BABYLON.Color3(73/255, 71/255, 63/255);
         ground.material.specularColor = new BABYLON.Color3(0, 0, 0);
         */
        //window.ground = ground;
    }

    function changeTexture(){
        // randomization from 0 -> 4
        var textureId = parseInt(Math.random() * 4);
        // So there is sliiiiightly higher chance of getting 3 than 0, 1 , 2!
        if (textureId === 4) textureId = 3;

        var textureUrl = "assets/LS_15/Resources/";
        var bumpUrl;;

        switch ( textureId){
            case 0:
                textureUrl += "Concrete_005_Tex0_Diff.tga";
                break;
            case 1:
                textureUrl += "Grass_002_Tex0_Diff.tga";
                break;
            case 2:
                textureUrl += "Marble_001_Tex0_Diff.tga";
                break;
            case 3:
                bumpUrl = textureUrl + "Wood_006_Tex0_Nrml.tga";
                textureUrl += "Wood_006_Tex0_Diff.tga";
                break;
        }

        setDefaults();

        ground.material.diffuseTexture = new BABYLON.Texture(textureUrl, scene);
        if (bumpUrl){
            ground.material.bumpTexture = new BABYLON.Texture(bumpUrl, scene);
        }
    }

    function changeColor(){
        var colorId = parseInt(Math.random() * 5);
        // So there is sliiiiightly higher chance of getting 3 than 0, 1 , 2!
        if (colorId === 5) colorId = 4;
        var color;

        switch ( colorId ){
            case 0:
                color = new BABYLON.Color3(73/255, 71/255, 63/255);
                break;
            case 1:
                color = new BABYLON.Color3(149/255, 228/255, 147/255);
                break;
            case 2:
                color = new BABYLON.Color3(232/255, 74/255, 74/255);
                break;
            case 3:
                color = new BABYLON.Color3(104/255, 191/255, 193/255);
                break;
            case 4:
                color = new BABYLON.Color3(1, 1, 0.3);
                break;
        }

        setDefaults();

        ground.material.diffuseColor = color;
    }



    function resetGround(){
        if (hasChanged){
            ground.material.diffuseColor = defaultColor;
            ground.material.diffuseTexture = defaultTexture;
            ground.material.bumpTexture = defaultBump;
        }
    }

    function setDefaults(){
        if (!hasChanged){
            hasChanged = true;
            defaultColor = ground.material.diffuseColor;
            defaultTexture = ground.material.diffuseTexture;
            defaultBump = ground.material.bumpTexture;
        }
    }

})(BABYLON);