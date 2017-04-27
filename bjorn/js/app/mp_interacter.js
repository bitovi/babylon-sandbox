!function() {

  let _lastHoveredMesh = null;
  let _pickedStartPoint = null;
  let _pickingPlane = null;
  let _meshStartPosition = new BABYLON.Vector3( 0, 0, 0 );

  let _tmpVector3 = new BABYLON.Vector3( 0, 0, 0);

  /**
   *
   * @param {MouseEvent} event
   * @param {BABYLON.Scene} scene
   */
  window.magnetMouseOver = function ( event, scene ) {

    if ( _pickingPlane !== null ) {
      return;
    }

    const x = event.clientX;
    const y = event.clientY;

    let newMesh = null;

    let pickingInfo = scene.pick( x, y , function( hitMesh ) {
      return hitMesh.__isMagnetPoint && hitMesh.isVisible;
    });

    if ( pickingInfo.hit ) {
      newMesh = pickingInfo.pickedMesh;
      if ( newMesh !== _lastHoveredMesh ) {
        newMesh.scaling.scaleInPlace( 1.5 );
      }
    }

    if ( newMesh !== _lastHoveredMesh && _lastHoveredMesh !== null ) {
      _lastHoveredMesh.scaling.scaleInPlace(1 / 1.5);
    }

    _lastHoveredMesh = newMesh;
  };

  window.magnetMouseDown = function ( event, scene ) {
    let lastHoveredMesh = _lastHoveredMesh;
    if ( lastHoveredMesh ) {
      const x = event.clientX;
      const y = event.clientY;

      let pickingInfo = scene.pick( x, y , function( hitMesh ) {
        return hitMesh === lastHoveredMesh;
      }, true);

      if ( pickingInfo.hit ) {
        const bb = lastHoveredMesh.getBoundingInfo().boundingBox;
        bb.minimumWorld.addToRef( bb.maximumWorld, _tmpVector3 );

        _tmpVector3.scaleInPlace( 0.5 );

        // Create plane
        _pickingPlane = createPlane( _tmpVector3, new BABYLON.Vector3( 0, 0, -1 ), scene );

        pickingInfo = scene.pick( x, y , function( hitMesh ) {
          return hitMesh === _pickingPlane;
        }, true);

        if ( pickingInfo.hit ) {
          // Get the start position of the item's container mesh
          _meshStartPosition.copyFrom( lastHoveredMesh.parent.position );
          _pickedStartPoint = pickingInfo.pickedPoint;
        }
      }
    }
  };

  window.magnetMouseUp = function ( event ) {
    if ( _pickingPlane ) {
      _pickingPlane.dispose();
      _pickingPlane = null;
    }

    _pickedStartPoint = null;
  };

  /**
   *
   * @param {MouseEvent} event
   * @param {BABYLON.Scene} scene
   */
  window.magnetMouseMove = function( event, scene ) {
    if ( _lastHoveredMesh === null || _pickedStartPoint === null || _pickingPlane === null ) {
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const pickingPlane = _pickingPlane;

    let pickingInfo = scene.pick( x, y , function( hitMesh ) {
      return hitMesh === pickingPlane;
    }, true);

    if ( pickingInfo.hit ) {
      let deltaPosition = _tmpVector3;
      pickingInfo.pickedPoint.subtractToRef( _pickedStartPoint, deltaPosition );

      deltaPosition.addInPlace( _meshStartPosition );

      _lastHoveredMesh.parent.position.copyFrom( deltaPosition );
    }

  };
}();

