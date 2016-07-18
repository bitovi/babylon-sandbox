function createBoxes(BABYLON, vm){

  var scene =  vm.attr("scene");
  for (let x = -5; x < 5; x++){
    for (let y = -5; y < 5; ++y){
      for ( let z = -5; z < 5; z++  ){
        let faceColors = new Array(6);
        let color = new BABYLON.Color4( Math.random(), Math.random(), Math.random(), 1 );
        for (let i = 0; i < 6; ++i){
          faceColors[i] = color;
        }
        let mesh = BABYLON.MeshBuilder.CreateBox("box"+x+z.toString(), {size: 0.66, faceColors: faceColors}, scene);
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;

      }
    }
  }
}

export default function(BABYLON, vm){
  createBoxes(BABYLON, vm);
}
