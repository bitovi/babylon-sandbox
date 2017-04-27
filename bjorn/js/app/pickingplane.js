var _tmpRotationQuaternion = new BABYLON.Quaternion( 0, 0, 0, 1 );

/**
 *
 * @param {BABYLON.Vector3} position
 * @param {BABYLON.Vector3} normal The plane normal, also direction
 * @param {BABYLON.Scene} scene
 * @return {BABYLON.Mesh}
 */
var createPlane = function( position, normal, scene ) {
  const rotation = getPlaneRotation( normal );

  let planeMesh = BABYLON.MeshBuilder.CreatePlane( "pickingplane", {
    width:10000,
    height: 10000
  }, scene);

  planeMesh.rotationQuaternion = new BABYLON.Quaternion( rotation.x, rotation.y, rotation.z, rotation.w );
  planeMesh.position.copyFrom( position );
  // So the normal picking function doesnt find the pickingPlane but only UI mesh picking
  planeMesh.isPickable = false;
  planeMesh.receiveShadows = false;
  planeMesh.checkCollisions = false;
  planeMesh.isVisible = true;
  planeMesh.__pickingNormal = normal.clone();
  planeMesh.__isPickingPlane = true;
  planeMesh.visibility = 0.9;

  planeMesh.material = new BABYLON.StandardMaterial( "pickingmat", scene );
  planeMesh.material.backFaceCulling = false;
  planeMesh.material.emissiveColor = new BABYLON.Color3( Math.random() * 255, Math.random() * 255, Math.random() * 255 );

  // Put the planemesh at the top of scene.meshes instead of at the end
  let sceneMeshes = scene.meshes;
  let index = -1;
  // Start from end because mesh should be added last
  for ( let i = sceneMeshes.length - 1; i >= 0; --i ) {
    if ( planeMesh === sceneMeshes[ i ] ) {
      index = i;
      break;
    }
  }
  // If the mesh doesn't exist or at 0 no need to splice & insert!
  if ( index > 0 ) {
    // First remove
    sceneMeshes.splice( index, 1 );
    // Add to start of meshes!
    sceneMeshes.unshift( planeMesh );
  }

  planeMesh.freezeWorldMatrix();
  return planeMesh;
};

/**
 * Updates the planes position & direction
 * @param {BABYLON.Mesh} plane
 * @param options
 */
var updatePlane = function( plane, options ) {
  let changes = false;

  if ( options.position ) {
    plane.position.copyFrom( options.position );
    changes = true;
  }
  if ( options.normal ) {
    plane.rotationQuaternion.copyFrom( getPlaneRotation( options.normal ) );
    changes = true;
  }

  if ( changes ) {
    plane.freezeWorldMatrix();
  }
};

/**
 *
 * @param {BABYLON.Vector3} normal
 * @return {BABYLON.Quaternion}
 */
var getPlaneRotation = function( normal ) {
  lookAtRotationToRef( forwardVector3, normal, _tmpRotationQuaternion );
  return _tmpRotationQuaternion;
}