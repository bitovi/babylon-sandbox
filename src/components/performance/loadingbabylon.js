/**
 * Created on 2016-07-18.
 */
"use strict";

var items = [];
var materialsReady = false;
var modelsReady = false;

function loadModels(BABYLON, vm, loader){
  //BABYLON.SceneLoader.loggingLevel = BABYLON.SceneLoader.DETAILED_LOGGING;

  var position = new BABYLON.Vector3(0, 0, 0);
  var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  loadModel(BABYLON, vm, {
    filename: "Colo_Rug_Fab_LtBrown_001.babylon",
    position: position,
    rotation:rotation
  }, loader);

  position = new BABYLON.Vector3(2, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * -0.5, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "West_Chair_Leath_Brown_001.babylon",
    position: position,
    rotation:rotation
  }, loader);

  position = new BABYLON.Vector3(-2, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * 0.5, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "West_Chair_Leath_Brown_001.babylon",
    position: position,
    rotation:rotation
  }, loader);

  position = new BABYLON.Vector3(0, 0, 2);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "West_Chair_Leath_Brown_001.babylon",
    position: position,
    rotation:rotation
  }, loader);

  position = new BABYLON.Vector3(0, 0, -2);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "West_Chair_Leath_Brown_001.babylon",
    position: position,
    rotation:rotation
  }, loader);

  position = new BABYLON.Vector3(0, 3, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "KidsPrin_CeFan_Wd_LtPurp_001.babylon",
    position: position,
    rotation:rotation
  }, loader);

  position = new BABYLON.Vector3(0, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "KidsJng_Bed_Wd_LtBrown_002.babylon",
    position: position,
    rotation:rotation
  }, loader);
}

function loadModel(BABYLON, vm, options, loader){
  //var items = vm.attr("items");

  options.root = "https://cdn.testing.egowall.com/CDN/temp_test/raw/";
  //options.root = vm.static3DAssetPath + "loadingbabylon/";

  var task = loader.addMeshTask(
    options.filename,
    "",
    options.root,
    options.filename
  );

  task.onSuccess = function (t) {
    try{
      var item = {
        name: t.name,
        meshes: t.loadedMeshes
      };
      items.push( item );
      // Set the models position
      for ( var i = 0; i < item.meshes.length; ++i ) {

        var mesh = item.meshes[i];
        mesh.e_item = item;

        if (!mesh.parent){
          continue;
        }

        mesh.tag = 1;
        mesh.label = options.label;

        mesh.receiveShadows = true;
        mesh.position = options.position;
        mesh.rotationQuaternion = options.rotation;
      }

      if ( options.success ) {
        options.success( item );
      }
    } catch(e){
      console.log(e);
    }
  };

  return task;
}

export default function(BABYLON, vm){
  var loader = vm.getAssetsManager();

  var start = performance.now() * 0.001;
  var now = "start: " + start;
  console.log(now);

  loader.onFinish = function(){
    //var now = "finished: " + ((performance.now() * 0.001) - start);
    let scene = vm.attr("scene");
    var materialCount = 0;
    var materialTotal = scene.materials.length;

    scene.materials.forEach(function(material){
      let intervalId = setInterval(function check(){
        if (material.isReady()){
          clearInterval(intervalId);
          materialCount++;

          if (materialCount >= materialTotal){
            var finished = performance.now() * 0.001;
           console.log("finished loading " + (finished - start));
          }
        }
      }, 50);
    });

    // for (var i = 0; i < items.length; ++i){
    //   console.log( items[i] );
    // }
  };

  loadModels(BABYLON, vm, loader);

  loader.load();
}
