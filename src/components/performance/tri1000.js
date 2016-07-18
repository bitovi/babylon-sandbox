function createBoxes(BABYLON, vm){

  var scene =  vm.attr("scene");
  for (let x = -5; x < 4; x++){
    // for (let y = -0; y < 1; ++y){
    for ( let z = -3; z < 3; z++  ){
      let color = new BABYLON.Color3( Math.random(), Math.random(), Math.random());
      let mesh = BABYLON.MeshBuilder.CreateSphere("sphere"+x+z.toString(), {segments: 100, diameter: 0.5}, scene);
      mesh.material = new BABYLON.StandardMaterial("shere"+x+z, scene);
      mesh.material.diffuseColor = color;
      mesh.material.specularColor = new BABYLON.Color3(0,0,0);
      mesh.position.x = x;
      mesh.position.y = 0;
      mesh.position.z = z;
    }
    // }
  }
}

export default function(BABYLON, vm){
  createBoxes(BABYLON, vm);
}
