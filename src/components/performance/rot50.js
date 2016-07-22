/**
 * Created on 2016-07-22.
 */
"use strict";
function loadModels(BABYLON, vm){
  const filename = "KidsPrin_CeFan_Wd_LtPurp_001.zip";
  //const filename = "West_Chair_Leath_Brown_001.zip";
  const space =1.4;
  for (let x = -5; x < 5; ++x){
    for (let z = -5; z < 5; ++z){
      let position = new BABYLON.Vector3(space * x, 1, space * z);
      let rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
      vm.testloadModelZip({
        filename: filename,
        physics: false,
        position: position,
        rotation:rotation,
        taskname: "bedfan"
      });
    }
  }
}

export default function(BABYLON, vm){
  loadModels(BABYLON, vm);

  let scene = vm.attr("scene");
  let engine = scene.getEngine();

  const rpm = (Math.PI * 2) / 5;

  engine.runRenderLoop(function(){
    let meshes = scene.meshes;
    let deltaTime = engine.getDeltaTime() * 0.001;

    for (let i = 0; i < meshes.length; ++i){
      let mesh = meshes[i];

      let quat = new BABYLON.Quaternion.RotationYawPitchRoll(  rpm * deltaTime, 0, 0 );

      if (!mesh.rotationQuaternion){
        mesh.rotationQuaternion = quat;
      }
      else{
        if (mesh.tag){
          mesh.rotationQuaternion = mesh.rotationQuaternion.multiply(quat);
        }

      }
    }
  });
}