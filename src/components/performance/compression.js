
function initTestChairModels(loader, vm, BABYLON){
  let rotateNormals = true;
  let ypos = 0;
  let zpos = 0;
  let xspace = 0.9;
  let xpos = -xspace;

  let filename = "West_Chair_Leath_Brown_001.obj";

  let position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  let rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: "Original .tga<br> Filesize: 100%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair"
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png <br> Filesize: 33%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair1",
    textures:{
      diffuse:"compression/chair/diff.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png advcomp <br> Filesize: 32%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair1",
    textures:{
      diffuse:"compression/chair/diffa.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png advcomp pngquant <br> Filesize: 17%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair1",
    textures:{
      diffuse:"compression/chair/diffaq.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png pngquant quality 90-95 <br> Filesize: 17%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair1",
    textures:{
      diffuse:"compression/chair/diffq90-95.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png pngquant quality 80-90 <br> Filesize: 17%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair1",
    textures:{
      diffuse:"compression/chair/diffq80-90.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png pngquant quality 65-80 <br> Filesize: 17%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair1",
    textures:{
      diffuse:"compression/chair/diffq65-80.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png posterize <br> Filesize: 14.81%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair2",
    textures:{
      diffuse:"compression/chair/diffp.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png posterize advcomp<br> Filesize: 10.83%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair3",
    textures:{
      diffuse:"compression/chair/diffp2.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos+= xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png posterize advcomp pngquant<br> Filesize: 5%",
    position: position,
    rotation:rotation,
    rotateNormals: rotateNormals,
    taskname: "chair4",
    textures:{
      diffuse:"compression/chair/diffq2.png"
    }
  }, loader);
}

function initTestFanModels(loader, vm, BABYLON){
  let rotateNormals = true;

  let ypos = 1.25;
  let zpos = 2.5;
  let xspace = 1.4;
  let xpos = -xspace;
  let filename = "KidsPrin_CeFan_Wd_LtPurp_001.obj";

  let position = new BABYLON.Vector3(xpos += xspace, ypos, zpos);
  let rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".tga Original<br> Filesize: 100%",
    position: position,
    rotation: rotation,
    rotateNormals: rotateNormals,
    taskname: "fan"
  }, loader)

  position = new BABYLON.Vector3(xpos += xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png<br> Filesize: 32.62%",
    position: position,
    rotation: rotation,
    rotateNormals: rotateNormals,
    taskname: "fan",
    textures:{
      diffuse:"compression/fan/fandiff.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos += xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png pngquant<br> Filesize: 9.45%",
    position: position,
    rotation: rotation,
    rotateNormals: rotateNormals,
    taskname: "fan",
    textures:{
      diffuse:"compression/fan/fandiffq.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos += xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png pngquant advcomp<br> Filesize: 8.76%",
    position: position,
    rotation: rotation,
    rotateNormals: rotateNormals,
    taskname: "fan",
    textures:{
      diffuse:"compression/fan/fandiffqa.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos += xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png posterize<br> Filesize: 12.3%",
    position: position,
    rotation: rotation,
    rotateNormals: rotateNormals,
    taskname: "fan",
    textures:{
      diffuse:"compression/fan/fandiffp.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos += xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png posterize advcomp<br> Filesize: 10.83%",
    position: position,
    rotation: rotation,
    rotateNormals: rotateNormals,
    taskname: "fan",
    textures:{
      diffuse:"compression/fan/fandiffpa.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos += xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png posterize pngquant<br> Filesize: 5.92%",
    position: position,
    rotation: rotation,
    rotateNormals: rotateNormals,
    taskname: "fan",
    textures:{
      diffuse:"compression/fan/fandiffpq.png"
    }
  }, loader);

  position = new BABYLON.Vector3(xpos += xspace, ypos, zpos);
  rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);
  vm.testLoadModel({
    filename: filename,
    physics: false,
    label: ".png posterize pngquant advcomp<br> Filesize: 5.44%",
    position: position,
    rotation: rotation,
    rotateNormals: rotateNormals,
    taskname: "fan",
    textures:{
      diffuse:"compression/fan/fandiffpqa.png"
    }
  }, loader);
}

export default function(BABYLON, scene, vm){
  var loader = vm.getAssetsManager();

  initTestChairModels(loader, vm, BABYLON);
  initTestFanModels(loader, vm, BABYLON);

  loader.load();
}