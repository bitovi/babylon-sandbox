/**
 * Created on 2.7.2016.
 */
"use strict";
(function(BABYLON){
    window.DEBUG3D = {
        drawBoundingBox:function ()
        {

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
            // Set default timeout
            if (a_options.timeout === undefined) a_options.timeout = 5000;
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
            }, a_options.timeout);
        }
    };
})(BABYLON);