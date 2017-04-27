
!function() {

  let _magnetMesh;
  let _instanceId = 0;
  /**
   *
   * @param {BABYLON.Mesh} mesh
   */
  window.generateMagnetPoints = function ( mesh ) {
    if ( mesh.__magnetPoints ) {
      return;
    }

    let scene = mesh.getScene();

    const bb = mesh.getBoundingInfo().boundingBox;
    const bbMinimum = bb.minimum;
    const bbMaximum = bb.maximum;

    const sizeOffset = 0;

    const minX = bbMinimum.x;
    const minZ = bbMinimum.z;
    const maxX = bbMaximum.x;
    const maxZ = bbMaximum.z;

    const positiveY = 0x001000;
    const negativeY = 0x000100;

    let bottomPoints = generateMagnetPointsPlane( bbMinimum.y, minX, minZ, maxX, maxZ, false, negativeY );
    let centerPoints = generateMagnetPointsPlane( ( bbMinimum.y + bbMaximum.y ) * 0.5, minX, minZ, maxX, maxZ, true, 0x000000 );
    let topPoints = generateMagnetPointsPlane( bbMaximum.y, minX, minZ, maxX, maxZ, false, positiveY );
    // Combine array!
    let combinedPoints = [ ...bottomPoints.list, ...centerPoints.list, ...topPoints.list ];

    let instances = [];

    for ( let i = 0; i < combinedPoints.length; ++i ) {
      let point = combinedPoints[ i ];

      let meshInstance = getMagnetMeshInstance( scene );
      meshInstance.__magnetMask = point.mask;
      meshInstance.__isMagnetPoint = true;
      meshInstance.position.copyFrom( point.point );
      meshInstance.parent = mesh;

      instances.push( meshInstance );
    }

    mesh.__magnetPoints = instances;
  };

  function generateMagnetPointsPlane( y, minX, minZ, maxX, maxZ, skipCenter, yBits ) {
    const middleX = ( minX + maxX ) * 0.5;
    const middleZ = ( minZ + maxZ ) * 0.5;

    let points = {};
    // +Z           +XZ
    // TL --- TM --- TR
    // |              |
    // ML     MM     MR
    // |              |
    // BL --- BM --- BR
    // -XZ           +X

    const positiveX = 0x100000;
    const negativeX = 0x010000;
    const positiveZ = 0x000010;
    const negativeZ = 0x000001;

    points.bottomLeft = {
      point: new BABYLON.Vector3( minX, y, minZ ),
      mask: ( negativeX + yBits + negativeZ )
    };
    points.bottomMiddle = {
      point: new BABYLON.Vector3( middleX, y, minZ ),
      mask: ( yBits + negativeZ )
    };
    points.bottomRight = {
      point: new BABYLON.Vector3( maxX, y, minZ ),
      mask: ( positiveX + yBits + negativeZ )
    };

    points.middleLeft = {
      point: new BABYLON.Vector3( minX, y, middleZ ),
      mask: ( negativeX + yBits )
    };
    if ( !skipCenter ) {
      points.middleMiddle = {
        point: new BABYLON.Vector3( middleX, y, middleZ ),
        mask: yBits
      };
    }
    points.middleRight = {
      point: new BABYLON.Vector3( maxX, y, middleZ ),
      mask: ( positiveX + yBits )
    };

    points.topLeft = {
      point: new BABYLON.Vector3( minX, y, maxZ ),
      mask: ( negativeX + yBits + positiveZ )
    };
    points.topMiddle = {
      point: new BABYLON.Vector3( middleX, y, maxZ ),
      mask: ( yBits + positiveZ )
    };
    points.topRight = {
      point: new BABYLON.Vector3( maxX, y, maxZ ),
      mask: ( positiveX + yBits + positiveZ )
    };

    points.list = [ points.bottomLeft, points.bottomMiddle, points.bottomRight,
                    points.middleLeft, points.middleRight,
                    points.topLeft, points.topMiddle, points.topRight
                  ];
    if ( !skipCenter ) {
      points.list.push( points.middleMiddle );
    }

    return points;
  }

  /**
   *
   * @param scene
   * @return {InstancedMesh}
   */
  function getMagnetMeshInstance( scene ) {
    if ( _magnetMesh ) {
      return _magnetMesh.createInstance( "mp" + _instanceId++ );
    }

    let magnetMesh = BABYLON.MeshBuilder.CreateBox( "magnetpoint", {
      size: 0.1
    }, scene );

    magnetMesh.material = new BABYLON.StandardMaterial( "magnetmat", scene );
    magnetMesh.material.diffuseColor = BABYLON.Color3.Yellow();

    _magnetMesh = magnetMesh;
    _magnetMesh.isVisible = false;

    return _magnetMesh.createInstance( "mp" + _instanceId++);
  }
}();