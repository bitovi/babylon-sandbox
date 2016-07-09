/**
 * Created on 2016-07-07.
 */
(function(BABYLON){

    var scene;
    var hemisphericLight;
    var normalDirLight;
    var pointLight;
    // Some ambient light used when pointlight is active
    var hemisphericPointLight;
    var hasPointlight = false;
    var degrees = 0;
    var shadowGenerator;

    var hemisShadowGen;

    // Takes 5 seconds to do 1 spin
    var rps = (1 / 5) * Math.PI * 2;

    var toggleButton = document.getElementById("toggleLights");
    toggleButton.addEventListener("click", toggleLights);

    function toggleLights(){
        if (hasPointlight){
            scene.removeLight(pointLight);
            scene.removeLight(hemisphericPointLight);
            scene.addLight(hemisphericLight);
            scene.addLight(normalDirLight);
        } else {
            scene.addLight(pointLight);
            scene.addLight(hemisphericPointLight);
            scene.removeLight(hemisphericLight);
            scene.removeLight(normalDirLight);
        }

        hasPointlight = !hasPointlight;
    }

    window.addToShadowGenerator = function(a_mesh){
        shadowGenerator.getShadowMap().renderList.push(a_mesh);
        hemisShadowGen.getShadowMap().renderList.push(a_mesh);
    };

    window.initLights = function(a_scene){
        scene = a_scene;

        //This creates a light, aiming 0,1,0 - to the sky.
        hemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        hemisphericLight.groundColor = new BABYLON.Color3(1, 1, 1);
        hemisphericLight.intensity = 1;
        // hemisphericLight.excludedMeshes.push(ground);

        //scene.removeLight(hemisphericLight);

        normalDirLight = new BABYLON.DirectionalLight("dirlight1", new BABYLON.Vector3(0, -1, 0), scene);

        hemisShadowGen = new BABYLON.ShadowGenerator(1024, normalDirLight);
        hemisShadowGen.setDarkness(0.5);
        hemisShadowGen.usePoissonSampling = true;
        hemisShadowGen.bias *= 0.2;

        pointLight = new BABYLON.PointLight("pointlight", new BABYLON.Vector3(0, 3, 0), scene);

        hemisphericPointLight = new BABYLON.HemisphericLight("hemispoint", new BABYLON.Vector3(0, 1, 0), scene);
        hemisphericPointLight.intensity = 0.2;

        // Shadows
        shadowGenerator = new BABYLON.ShadowGenerator(1024, pointLight);
        shadowGenerator.usePoissonSampling = true;
        shadowGenerator.setDarkness(0.5);

        scene.removeLight(pointLight);
        scene.removeLight(hemisphericPointLight);
    }

    window.updateLights = function(a_deltaTime){
        var radian = 3.5;
        if (hasPointlight){
            degrees += (a_deltaTime / 1000) * rps;
            if (degrees > Math.PI * 2){
                degrees -= Math.PI * 2;
            }

            pointLight.position.x = radian * Math.cos(degrees);
            pointLight.position.z = radian * Math.sin(degrees);            
        }
    }

})(BABYLON);
