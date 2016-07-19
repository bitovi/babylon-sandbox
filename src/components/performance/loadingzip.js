import JSZip from 'jszip';

function loadModels(BABYLON, vm, loader){
  console.log(JSZip);
}

function loadModel(BABYLON, vm, options){
  let items = vm.attr("items");

  options.root = vm.static3DAssetPath + "loadingzip";

  let url = options.root + options.filename;

  let xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e) {
    if (this.status == 200) {

    }
  };

  xhr.send();

  // task.onSuccess = function (t) {
  //   var item = {
  //     name: t.name,
  //     meshes: t.loadedMeshes
  //   };
  //   items.push( item );
  //   // Set the models position
  //   for ( var i = 0; i < item.meshes.length; ++i ) {
  //     var mesh = item.meshes[i];
  //     mesh.e_item = item;
  //
  //     var positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
  //     var normals = mesh.getVerticesData( BABYLON.VertexBuffer.NormalKind );
  //
  //     BABYLON.VertexData.ComputeNormals( positions, mesh.getIndices(), normals );
  //     mesh.setVerticesData( BABYLON.VertexBuffer.NormalKind, normals );
  //
  //     mesh.tag = 1;
  //     mesh.label = options.label;
  //
  //     mesh.receiveShadows = true;
  //     mesh.position = options.position;
  //     mesh.rotationQuaternion = options.rotation;
  //   }
  //
  //   if ( options.success ) {
  //     options.success( item );
  //   }
  // };
  //
  // return task;
}

export default function(BABYLON, vm){
  loadModels(BABYLON, vm, loader);
}
