/**
 * Created on 2016-07-18.
 */
"use strict";
function loadModels(BABYLON, vm){
  var position = new BABYLON.Vector3(0, 0, 0);
  var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testloadModelZip({
    filename: "Colo_Rug_Fab_LtBrown_001.zip",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "rug"
  });

  position = new BABYLON.Vector3(2, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * -0.5, 0, 0);
  vm.testloadModelZip({
    filename: "West_Chair_Leath_Brown_001.zip",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "chair"
  });

  position = new BABYLON.Vector3(-2, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * 0.5, 0, 0);
  vm.testloadModelZip({
    filename: "West_Chair_Leath_Brown_001.zip",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "chair"
  });

  position = new BABYLON.Vector3(0, 0, 2);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
  vm.testloadModelZip({
    filename: "West_Chair_Leath_Brown_001.zip",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "chair"
  });

  position = new BABYLON.Vector3(0, 0, -2);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testloadModelZip({
    filename: "West_Chair_Leath_Brown_001.zip",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "chair"
  });

  position = new BABYLON.Vector3(0, 3, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testloadModelZip({
    filename: "KidsPrin_CeFan_Wd_LtPurp_001.zip",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "bedfan"
  });

  position = new BABYLON.Vector3(0, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testloadModelZip({
    filename: "KidsJng_Bed_Wd_LtBrown_002.zip",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "bed"
  });
}

export default function(BABYLON, vm){
  loadModels(BABYLON, vm);
}
