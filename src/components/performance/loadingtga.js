/**
 * Created on 2016-07-18.
 */
"use strict";
function loadModels(BABYLON, vm, loader){
  var position = new BABYLON.Vector3(0, 0, 0);
  var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: "Colo_Rug_Fab_LtBrown_001.obj",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "rug"
  }, loader);

  position = new BABYLON.Vector3(2, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * -0.5, 0, 0);
  vm.testLoadModel({
    filename: "West_Chair_Leath_Brown_001.obj",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "chair"
  }, loader);

  position = new BABYLON.Vector3(-2, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * 0.5, 0, 0);
  vm.testLoadModel({
    filename: "West_Chair_Leath_Brown_001.obj",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "chair"
  }, loader);

  position = new BABYLON.Vector3(0, 0, 2);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
  vm.testLoadModel({
    filename: "West_Chair_Leath_Brown_001.obj",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "chair"
  }, loader);

  position = new BABYLON.Vector3(0, 0, -2);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: "West_Chair_Leath_Brown_001.obj",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "chair"
  }, loader);

  position = new BABYLON.Vector3(0, 3, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: "KidsPrin_CeFan_Wd_LtPurp_001.obj",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "bedfan"
  }, loader);

  position = new BABYLON.Vector3(0, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: "KidsJng_Bed_Wd_LtBrown_002.obj",
    physics: false,
    position: position,
    rotation:rotation,
    taskname: "bed"
  }, loader);
}

export default function(BABYLON, vm){
  var loader = vm.getAssetsManager();

  var start = performance.now() * 0.001;
  var now = "start: " + start;
  console.log(now);

  loader.onFinish = function(){
    var now = "finished: " + ((performance.now() * 0.001) - start);
    console.log(now);
  };

  loadModels(BABYLON, vm, loader);

  loader.load();
}
