import JSZip from 'jszip/dist/jszip';

var total = 0, count = 0, start;

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
  options.root = vm.static3DAssetPath + "loadingzip/";

  const url = options.root + options.filename;

  let xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'arraybuffer';

  let modelStart = performance.now();

  logTime("loadModel called at: ", modelStart, start);

  xhr.onload = function(e) {
    if (this.status == 200) {
      // Set the arrayBuffer
      let arrayBuffer = xhr.response;
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
            logTime("model start unzipping", babylonFileStart, modelStart);

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

            texture.async("arraybuffer").then(function (data) {
              let textureUnzipped = performance.now();

              logTime("texture unzipped:", textureUnzipped, modelStart);
              // Create the texture
              var tex = new BABYLON.Texture("data:" + texture.name, scene, undefined, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, null, null, data, true);
              let textureParsed = performance.now();
              tex.getInternalTexture().url = tex.url.substr(5);

              logTime("texture unzipped:", textureParsed, modelStart);


              texturesInitialized++;
              if (texturesInitialized >= textures.length) {
                loadMesh();
              }
            // Texture async
            }).catch(function (reason) {
              console.log(reason);
            });
          });
        // JsZip async
        }).catch(function (reason) {
          console.log(reason);
        });
      // End if arraybuffer
      }
    // Xhr status 200
    }
  // Xhr onload
  };

  xhr.send();
}

function logTime(msg, finish, start){
  var time = (finish - start) * 0.001;
  console.log(msg, time);
}

function everythingLoaded(vm){
  count++;
  if (count >= total) {
    let finish = (performance.now() - start) * 0.001;
    console.log("Took " + finish + "s to finish");
    let scene = vm.attr("scene");
    let engine = scene.getEngine();
    engine.hideLoadingUI();
    //engine.runRenderLoop();
  }
}

export default function(BABYLON, vm) {

  let engine = vm.attr("scene").getEngine();
  engine.displayLoadingUI();
  engine.stopRenderLoop(vm.renderLoop);

  start = performance.now();
  console.log("started: " + start * 0.001)

  loadModels(BABYLON, vm);
}