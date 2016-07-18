/**
 * Created on 2016-07-18.
 */
"use strict";
function loadModels(BABYLON, vm, loader){

}

function loadModel(BABYLON, vm, options){
  var items = vm.items;

  options.root = vm.static3DAssetPath;

  var task = loader.addMeshTask(
    options.taskname || options.filename,
    "",
    options.root,
    options.filename
  );

  task.onSuccess = function (t) {
    var item = {
      name: t.name,
      meshes: t.loadedMeshes
    };
    items.push( item );
    // Set the models position
    for ( var i = 0; i < item.meshes.length; ++i ) {
      var mesh = item.meshes[i];
      mesh.e_item = item;

      var positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
      var normals = mesh.getVerticesData( BABYLON.VertexBuffer.NormalKind );

      BABYLON.VertexData.ComputeNormals( positions, mesh.getIndices(), normals );
      mesh.setVerticesData( BABYLON.VertexBuffer.NormalKind, normals );

      mesh.tag = 1;
      mesh.label = options.label;

      mesh.receiveShadows = true;
      mesh.position = options.position;
      mesh.rotationQuaternion = options.rotation;
    }

    if ( options.success ) {
      options.success( item );
    }
  };

  return task;
}

export default function(BABYLON, vm){
  var loader = vm.getAssetsManager();

  var startElement = document.createElement("p");
  var start = performance.now();
  startElement.innerHTML = "start: " + start * 0.001;;
  document.body.appendChild(startElement);

  loader.onFinish = function(){
    var startElement = document.createElement("p");
    startElement.innerHTML = "finished: " + performance.now() - start * 0.001;
    document.body.appendChild(startElement);
  };

  loadModels(BABYLON, vm, loader);

  loader.load();
}
