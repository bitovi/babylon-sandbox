import JSZip from 'jszip/dist/jszip';
import $ from 'jquery';

var total = 0, count = 0, started;
var firstAjax = true, firstTime = 0;

function checkTextureCached(url, engine){
  var texturesCache = engine.getLoadedTexturesCache();
  for (var i = 0; i < texturesCache.length; i++) {
    var texturesCacheEntry = texturesCache[i];

    if (texturesCacheEntry.url === url) {
      return texturesCacheEntry;
    }
  }
  return null;
}

function loadModels(BABYLON, vm){

  //total = 7;
  let position = new BABYLON.Vector3(0, 0, 0);
  let rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  loadModel(BABYLON, vm, {
    filename: "Colo_Rug_Fab_LtBrown_001.zip",
    position: position,
    rotation:rotation
  });

  position = new BABYLON.Vector3(2, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * -0.5, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "West_Chair_Leath_Brown_001.zip",
    position: position,
    rotation:rotation
  });

  position = new BABYLON.Vector3(-2, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * 0.5, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "West_Chair_Leath_Brown_001.zip",
    position: position,
    rotation:rotation
  });

  position = new BABYLON.Vector3(0, 0, 2);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "West_Chair_Leath_Brown_001.zip",
    position: position,
    rotation:rotation
  });

  position = new BABYLON.Vector3(0, 0, -2);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "West_Chair_Leath_Brown_001.zip",
    position: position,
    rotation:rotation
  });

  position = new BABYLON.Vector3(0, 3, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "KidsPrin_CeFan_Wd_LtPurp_001.zip",
    position: position,
    rotation:rotation
  });

  position = new BABYLON.Vector3(0, 0, 0);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  loadModel(BABYLON, vm, {
    filename: "KidsJng_Bed_Wd_LtBrown_002.zip",
    position: position,
    rotation:rotation
  });
}

function loadModel(BABYLON, vm, options){
  let items = vm.attr("items");
  total++;
  options.root = "https://cdn.testing.egowall.com/CDN_new/temp_test/";
  //options.root = vm.static3DAssetPath + "loadingzip/";
  //options.root = vm.static3DAssetPath + "loadingzipbase/";

  const url = options.root + options.filename;

  let modelStart = performance.now();

  logTime("loadModel called at: ", modelStart, started);
  $.ajax({
    url: url,
    type:"get",
    dataType : "binary",
    xhrFields : {
      responseType : "arraybuffer"
    },
    success:function(data){

      if (firstAjax){
        firstAjax = false;
        firstTime = performance.now();
      }

      let arrayBuffer = data;
      if (arrayBuffer) {

        let ajaxFinished = performance.now();
        logTime("ajax finished", ajaxFinished, modelStart);


        let jszip = new JSZip();
        // Load the zipfile from arraybuffer
        jszip.loadAsync(arrayBuffer).then(function (zip) {

          let unzipped = performance.now();

          let babylonFile;
          let textures = [];
          // Iterate over files to find the .babylon file and textures
          for (var key in zip.files) {
            if (key.endsWith(".babylon")) {
              babylonFile = zip.files[key];
            } else {
              textures.push(zip.files[key]);
            }
          }

          let scene = vm.attr("scene");
          let texturesInitialized = 0;

          function loadMesh() {

            let babylonFileStart = performance.now();
            logTime("model started unzipping", babylonFileStart, modelStart);

            babylonFile.async("string").then(function (text) {

              let babylonUnzipped = performance.now();
              logTime( "model unzipped", babylonUnzipped, modelStart );
              BABYLON.SceneLoader.ImportMesh("", "", "data:" + text, scene, function (meshes) {
                let babylonParsed = performance.now();
                let item = {
                  name: babylonFile.name,
                  meshes: meshes
                };
                items.push(item);
                // Set the models position
                for (let i = 0; i < item.meshes.length; ++i) {
                  let mesh = item.meshes[i];
                  mesh.e_item = item;

                  if (!mesh.parent) {
                    continue;
                  }

                  mesh.tag = 1;
                  mesh.label = options.label;

                  mesh.receiveShadows = true;
                  mesh.position = options.position;
                  mesh.rotationQuaternion = options.rotation;
                }

                logTime("model fully loaded:", babylonParsed, modelStart);

                if (options.success) {
                  options.success(item);
                }
                everythingLoaded(vm);
              });
              // Babylon async
            });
            // Load mesh
          }

          // Load textures before .babylon file so cache will trigger
          textures.forEach(function (texture) {
            let textureStart = performance.now();
            logTime("iterating textures", textureStart, modelStart);
            let engine = vm.attr("scene").getEngine();
            if (!checkTextureCached( "data:" + texture.name, engine )){
              texture.async("base64").then(function (data) {
                let textureUnzipped = performance.now();

                logTime("texture unzipped:", textureUnzipped, modelStart);
                // Create the texture
                //var tex = new BABYLON.Texture("data:" + texture.name, scene, undefined, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, null, null, data, true);
                //let tex = new BABYLON.Texture.CreateFromBase64String(data, texture.name, scene );
                let tex = new BABYLON.Texture.CreateFromBase64String("data:image/png;base64," + data, texture.name, scene );

                let textureParsed = performance.now();

                //tex.getInternalTexture().url = "data:" + texture.name;

                logTime("texture parsed:", textureParsed, modelStart);


                texturesInitialized++;
                if (texturesInitialized >= textures.length) {
                  loadMesh();
                }
                // Texture async
              }).catch(function (reason) {
                console.log(reason);
              });
            } else {
              console.log("texture was cached");
              texturesInitialized++;
              if (texturesInitialized >= textures.length) {
                loadMesh();
              }
            }
          });
          // JsZip async
        }).catch(function (reason) {
          console.log(reason);
        });
      // End if arraybuffer
      }
    // end success function
    }
  // End $.ajax
  })
}

function logTime(msg, finish, start){
  finish -= (firstTime - started);
  var time = (finish - start) * 0.001;
  console.log(msg, time);
}

function everythingLoaded(vm){
  count++;
  if (count >= total) {
    let finish = (performance.now() - started  - (firstTime - started)) * 0.001;
    console.log("Took " + finish + "s to finish");
    let scene = vm.attr("scene");
    let engine = scene.getEngine();
    engine.hideLoadingUI();
    console.log("First ajax: " + (firstTime - started) * 0.001);
    //engine.runRenderLoop();
  }
}

export default function(BABYLON, vm) {

  let engine = vm.attr("scene").getEngine();
  engine.displayLoadingUI();
  engine.stopRenderLoop(vm.renderLoop);

  started = performance.now();
  firstTime = started;
  console.log("started: " + started * 0.001)

  loadModels(BABYLON, vm);
}