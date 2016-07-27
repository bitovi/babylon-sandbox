function createBoxes(BABYLON, vm){

  var scene =  vm.attr("scene");

  let mesh = BABYLON.MeshBuilder.CreateBox("box", {size: 0.66}, scene);
  //window.mesh = mesh;


  for (let x = -10; x < 10; x++){
    for (let y = -3; y < 4; ++y){
      for ( let z = -10; z < 10; z++  ){
        // let faceColors = new Array(6);
        // let color = new BABYLON.Color4( Math.random(), Math.random(), Math.random(), 1 );
        // for (let i = 0; i < 6; ++i){
        //   faceColors[i] = color;
        // }

        let newInstance = mesh.createInstance("x" + x.toString() + "y" + y.toString() + "z" + z.toString());

        newInstance.position.x = x;
        newInstance.position.y = y;
        newInstance.position.z = z;

        newInstance.tag = 1;
        newInstance.label = x + " " + y + " " + z;

        newInstance.renderOutline = true;
      }
    }
  }
}

export default function(BABYLON, vm){
  createBoxes(BABYLON, vm);
}
