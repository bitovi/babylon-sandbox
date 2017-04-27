!function() {

  let _positiveX = new BABYLON.Vector3( 1, 0, 0 );
  let _positiveY = new BABYLON.Vector3( 0, 1, 0 );
  let _positiveZ = new BABYLON.Vector3( 0, 0, 1 );

  let _negativeX = new BABYLON.Vector3( -1, 0, 0 );
  let _negativeY = new BABYLON.Vector3( 0, -1, 0 );
  let _negativeZ = new BABYLON.Vector3( 0, 0, -1 );

  let _tmpNormal = new BABYLON.Vector3( 0, 0, 0);
  let _tmpViewDirection = new BABYLON.Vector3( 0, 0, 0 );
  let _tmpMatrix = new BABYLON.Matrix.Identity();

  window.showVisibleMagnetPoints = function ( mesh ) {
    let magnetPoints = mesh.__magnetPoints;

    if ( !magnetPoints ) {
      console.log( "no magnetpoints" );
    }

    const mask = getFacesVisibleMask( mesh );

    for ( let i = 0; i < magnetPoints.length; ++i ) {
      let pointMesh = magnetPoints[ i ];

      let bitmask = pointMesh.__magnetMask & mask;

      if ( bitmask !== 0 ) {
        pointMesh.isVisible = true;
      } else {
        pointMesh.isVisible = false;
      }
    }
  }

  function getFacesVisibleMask( mesh ) {
    let viewDirection = _tmpViewDirection;
    mesh.position.subtractToRef( mesh.getScene().activeCamera.position, viewDirection );
    viewDirection.normalize();

    let rotationMatrix = _tmpMatrix;
    if ( mesh.rotationQuaternion.w !== 1 ) {
      mesh.rotationQuaternion.toRotationMatrix( rotationMatrix );
    } else {
      rotationMatrix = null;
    }

    let xResult = checkFace( _positiveX, _negativeX, viewDirection, rotationMatrix );
    let yResult = checkFace( _positiveY, _negativeY, viewDirection, rotationMatrix );
    let zResult = checkFace( _positiveZ, _negativeZ, viewDirection, rotationMatrix );

    let mask = 0;

    if ( xResult === 1 ) {
      mask += 0x100000;
    } else if ( xResult === -1 ) {
      mask += 0x010000;
    }

    if ( yResult === 1 ) {
      mask += 0x001000;
    } else if ( yResult === -1 ) {
      mask += 0x000100;
    }

    if ( zResult === 1 ) {
      mask += 0x000010;
    } else if ( zResult === -1 ) {
      mask += 0x000001;
    }

    return mask
  }

  function checkFace( positiveNormal, negativeNormal, viewDirection, rotationMatrix ) {
    const dotBreakpoint = -0.33;
    let tmpNormal = _tmpNormal;
    let rotateNormal = rotationMatrix !== null;

    if ( rotateNormal ) {
      BABYLON.Vector3.TransformCoordinatesToRef( positiveNormal, rotationMatrix, tmpNormal );
    } else {
      tmpNormal.copyFrom( positiveNormal );
    }

    let dot = BABYLON.Vector3.Dot( tmpNormal, viewDirection );

    if ( dot <= dotBreakpoint ) {
      return 1;
    }

    if ( rotateNormal ) {
      BABYLON.Vector3.TransformCoordinatesToRef( negativeNormal, rotationMatrix, tmpNormal );
    } else {
      tmpNormal.copyFrom( negativeNormal );
    }

    dot = BABYLON.Vector3.Dot( tmpNormal, viewDirection );

    if ( dot <= dotBreakpoint ) {
      return -1;
    }

    return 0;

  }
}();