/**
 * Created on 2.7.2016.
 */
"use strict";
(function(){

    var _isDebugMaterial = false;
    var DEBUG3D = {
        /**
         * Draw a bounding box for a size
         */
        drawBoundingBox:function (scene, a_boundingBox, a_options)
        {
            // Create the options if it doesn't exist
            if (!a_options) a_options = {};
            // Set the default size
            if (a_options.size === undefined) a_options.size = 0.1;
            // Set default time
            if (a_options.time === undefined) a_options.time = 5000;
            // And the default red color
            if (!a_options.color) a_options.color = new BABYLON.Color3(1, 0, 0);

            DEBUG3D.drawPoint(scene, a_boundingBox.minimum, a_options);
            DEBUG3D.drawPoint(scene, a_boundingBox.maximum, a_options);
        },
        /**
         *
         * @param a_scene
         * @param {BABYLON.Vector3} a_position
         * @param a_options
         */
        drawPoint: function(a_scene, a_position, a_options) {
            // Create the options if it doesn't exist
            if (!a_options) a_options = {};
            // Set the default size
            if (a_options.size === undefined) a_options.size = 0.1;
            // Set default time
            if (a_options.time === undefined) a_options.time = 5000;
            // And the default red color
            if (!a_options.color) a_options.color = new BABYLON.Color3(1, 0, 0);

            var sphere = BABYLON.Mesh.CreateSphere("debugpoint", 4, a_options.size, a_scene);
            // Clone the position so it's not tied to a reference from example a mesh
            sphere.position = a_position.clone();
            // Set the color of the point
            var material = new BABYLON.StandardMaterial("debugpointmat", a_scene);
            material.emissiveColor = a_options.color;
            material.diffuseColor = a_options.color;
            // No specular color or it has light reflections... :)
            material.specularColor = new BABYLON.Color3(0, 0, 0);

            sphere.material = material;

            setTimeout(function () {
                sphere.dispose();
            }, a_options.time);
        },

        /**
         * Get the debug material directly
         * @param a_scene
         * @returns {BABYLON.ShaderMaterial}
         */
        getDebugMaterial: function(a_scene){
            var material = new BABYLON.ShaderMaterial("debugmaterial", a_scene, "/shaders/debug",
                {
                    attributes: ["position", "uv", "normal"],
                    uniforms: ["worldViewProjection", "world"]
                });

            return material;
        },
        /**
         * Enable the debug shader for various shader debugging things
         * @param a_scene
         */
        toggleDebugMaterial: function(a_scene){
            var meshes = a_scene.meshes.filter(function(a_mesh){
                if (a_mesh.material && (a_mesh.material.name === "skyBox" || a_mesh.material.name === "groundmat") ){
                    return false;
                }
                else{
                    return true;
                }
            });

            for (var i = 0; i < meshes.length; ++i){
                var mesh = meshes[i];
                if (_isDebugMaterial){
                    // Check that debugMaterial has been set (incase a mesh was added after setting debug material)
                    if (mesh.__debugMaterial){
                        mesh.material = mesh.__originalMaterial;
                        // Clean up
                        mesh.__debugMaterial = false;
                        mesh.__originalMaterial = undefined;
                    }
                } else {
                    mesh.__originalMaterial = mesh.material;
                    mesh.__debugMaterial = true;
                    mesh.material = DEBUG3D.getDebugMaterial(a_scene);
                }
            }

            _isDebugMaterial = !_isDebugMaterial;
        }
    };

    window.DEBUG3D = DEBUG3D;
})();