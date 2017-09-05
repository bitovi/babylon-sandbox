!function() {

  let _lastHoveredMesh = null;
  let _lastFocusedMesh = null;
  let _lastFocusedPoint = null;
  let _pickedStartPoint = null;
  let _pickingPlane = null;
  let _meshStartPosition = new BABYLON.Vector3( 0, 0, 0 );

  let _tmpNormal = new BABYLON.Vector3( 0, 0, 0 );
  let _tmpVector3 = new BABYLON.Vector3( 0, 0, 0);
  let _tmpMinimum = new BABYLON.Vector3( 0, 0, 0 );
  let _tmpMaximum = new BABYLON.Vector3( 0, 0, 0 );

  let _visibleMagnetMeshes = [];

  /**
   *
   * @param {MouseEvent} event
   * @param {BABYLON.Scene} scene
   */
  window.magnetMouseOver = function ( event, scene ) {

    if ( _pickingPlane !== null ) {
      selectedMove( event, scene );
    } else {
      unselectedMove( event, scene );
    }
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

        // TODO: 3.0 use centerWorld
        const bb = lastHoveredMesh.getBoundingInfo().boundingBox;
        bb.minimumWorld.addToRef( bb.maximumWorld, _tmpVector3 );
        _tmpVector3.scaleInPlace( 0.5 );

        let hoveredItem = lastHoveredMesh.parent;

        createMagnetExtends( hoveredItem );
        createPickingPlane( hoveredItem.position, scene.activeCamera.position, _tmpVector3 );

        pickingInfo = scene.pick( x, y , function( hitMesh ) {
          return hitMesh === _pickingPlane;
        }, true);

        if ( pickingInfo.hit ) {
          hideUnselectedMagnetPoints();

          // Get the start position of the hoveredItem's container mesh
          _meshStartPosition.copyFrom( hoveredItem.position );
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

    for ( let i = 0; i < _visibleMagnetMeshes.length; ++i ) {
      hideMagnetPoints( _visibleMagnetMeshes[ i ] );
    }

    _visibleMagnetMeshes = [];

    unsetFocusedMesh();
  };

  /**
   *
   * @param {MouseEvent} event
   * @param {BABYLON.Scene} scene
   */
  window.magnetMouseMove = function( event, scene, collisionMeshes ) {
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
       let item = _lastHoveredMesh.parent;

      pickingInfo.pickedPoint.subtractToRef( _pickedStartPoint, deltaPosition );
      deltaPosition.addInPlace( _meshStartPosition );

      item.position.copyFrom( deltaPosition );
      item.computeWorldMatrix(true);
      _lastHoveredMesh.computeWorldMatrix(true);

      const bb = _lastHoveredMesh.getBoundingInfo().boundingBox;
      bb.minimumWorld.addToRef( bb.maximumWorld, _tmpVector3 );
      _tmpVector3.scaleInPlace( 0.5 );

      const magnetBounds = item.__magnetBounds;
      let minimumWorld = _tmpMinimum;
      let maximumWorld = _tmpMaximum;

      magnetBounds.minimum.addToRef( _tmpVector3, minimumWorld );
      magnetBounds.maximum.addToRef( _tmpVector3, maximumWorld );

      const selectedPosition =_lastHoveredMesh.getAbsolutePosition();

      let closestPoint = null;

      // Loop over collisionMeshes
      for ( let i = 0; i < collisionMeshes.length; ++i ) {
        const collisionMesh = collisionMeshes[ i ];

        const collisionBoundingBox = collisionMesh.getBoundingInfo().boundingBox;
        const collisionMinimum = collisionBoundingBox.minimumWorld;
        const collisionMaximum = collisionBoundingBox.maximumWorld;

        let isColliding = true;
        const forceShow = _lastFocusedMesh === collisionMesh;

        if ( !forceShow ) {
          if ( ( maximumWorld.x < collisionMinimum.x || minimumWorld.x > collisionMaximum.x )
          || ( maximumWorld.y < collisionMinimum.y || minimumWorld.y > collisionMaximum.y )
          || ( maximumWorld.z < collisionMinimum.z || minimumWorld.z > collisionMaximum.z )
          ) {
            isColliding = false;
          }
        }

        if ( isColliding ) {
          if ( !collisionMesh.__magnetPoints ) {
            generateMagnetPoints( collisionMesh );
          }

          if ( _visibleMagnetMeshes.indexOf( collisionMesh ) === -1 ) {
            _visibleMagnetMeshes.push( collisionMesh );
          }

          // Checkproximity
          let closestSnappedPoint = checkProximity( selectedPosition, collisionMesh.__magnetPoints, collisionMesh.getWorldMatrix(), forceShow );

          if ( closestSnappedPoint && closestSnappedPoint.point !== null ) {
            if ( !closestPoint ) {
              closestPoint = closestSnappedPoint;
            } else {
              if ( closestSnappedPoint.length < closestPoint.length ) {
                closestPoint = closestSnappedPoint;
              }
            }
          }
        } else {
          hideMagnetPoints( collisionMesh );

          let index = _visibleMagnetMeshes.indexOf( collisionMesh );
          if ( index !== -1 ) {
            _visibleMagnetMeshes.splice( index, 1 );
          }

        }
      }

      if ( _lastFocusedPoint ) {
        closestPoint = {
          point: _lastFocusedPoint
        };
      }

      if ( closestPoint ) {

        let deltaPosition = BABYLON.Tmp.Vector3[ 8 ];
        // How to go from magnetPoint -> itemPosition
        item.position.subtractToRef( selectedPosition, deltaPosition );

        const closestPosition = closestPoint.point.getAbsolutePosition();
        item.position.copyFrom( closestPosition );
        item.position.addInPlace( deltaPosition );
      }
    }
  };

  function unselectedMove ( event, scene ) {
    const x = event.clientX;
    const y = event.clientY;

    let newMesh = null;

    const pickingInfo = scene.pick( x, y , function( hitMesh ) {
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
  }

  function selectedMove ( event, scene ) {
    const x = event.clientX;
    const y = event.clientY;

    const hoveredMesh = _lastHoveredMesh;
    const hoveredItem = hoveredMesh.parent;

    unsetFocusedMesh();

    const pickingInfo = scene.pick( x, y, function( hitMesh ) {
      if ( hitMesh.__isMagnetPoint ) {
        if ( hitMesh.parent !== hoveredItem ) {
          return true;
        }
      } else if ( hitMesh.__magnetPoints && hitMesh !== hoveredItem  )  {
        return true;
      }
      return false;
    });

    if ( pickingInfo.hit ) {
      const pickedMesh = pickingInfo.pickedMesh;
      if ( pickedMesh.__isMagnetPoint ) {
        if ( !_lastFocusedPoint ) {
          _lastFocusedPoint = pickedMesh;
          _lastFocusedMesh = pickedMesh.parent;
        }
      } else {
        if ( !_lastFocusedMesh ) {
          _lastFocusedMesh = pickedMesh;
        }
      }
    }
  }

  function hideUnselectedMagnetPoints() {
    let hoveredPoint = _lastHoveredMesh;

    let allPoints = hoveredPoint.parent.__magnetPoints;

    for ( let i = 0; i < allPoints.length; ++i ) {
      let point = allPoints[ i ];
      if ( point !== hoveredPoint && point.isVisible ) {
        point.isVisible = false;
      }
    }
  }

  function checkProximity( selectedPointPosition, otherPoints, otherWorldMatrix, forceShow ) {

    let invertedMatrix = BABYLON.Tmp.Matrix[ 0 ];
    otherWorldMatrix.invertToRef( invertedMatrix );

    let selectedLocalPoint = _tmpVector3;
    BABYLON.Vector3.TransformCoordinatesToRef( selectedPointPosition, invertedMatrix, selectedLocalPoint );

    let delta = BABYLON.Tmp.Vector3[ 8 ];

    let closestPoint = null;
    let closestDistance = Number.MAX_VALUE;

    for ( let i = 0; i < otherPoints.length; ++i ) {
      let otherPoint = otherPoints[ i ];

      otherPoint.position.subtractToRef( selectedLocalPoint, delta );

      const length = delta.length();

      if ( length <= 1 ) {

        if ( length <= 0.4 && length < closestDistance ) {
          closestPoint = otherPoint;
          closestDistance = length;
        }

        otherPoint.isVisible = true;
      } else {
        otherPoint.isVisible = forceShow ? true : false;
      }
    }

    if ( closestPoint ) {
      return {
        point: closestPoint,
        length: closestDistance
      };
    }

    return null;
  }

  /**
   *
   * @param {BABYLON.Mesh} mesh
   */
  function createMagnetExtends( mesh ) {
    let minimum, maximum;

    if ( !mesh.__magnetBounds ) {
      const size = 0.5;
      minimum = new BABYLON.Vector3( -size, -size, -size );
      maximum = new BABYLON.Vector3( size, size, size );

      mesh.__magnetBounds = {
        minimum: minimum,
        maximum: maximum
      };
    }
  }

  function createPickingPlane( itemPosition, cameraPosition, planePosition ) {
    let normal = _tmpNormal;
    // Calculate plane normal from item -> camera
    let cameraDirection = BABYLON.Tmp.Vector3[ 8 ];
    itemPosition.subtractToRef( cameraPosition, cameraDirection );

    cameraDirection.normalize();

    if ( cameraDirection.y < -0.33 ) {
      normal.copyFromFloats( 0, -1, 0 );
    } else if ( cameraDirection.y > 0.33 ) {
      normal.copyFromFloats( 0, 1, 0 );
    } else {
      const xAbs = Math.abs( cameraDirection.x );
      const zAbs = Math.abs( cameraDirection.z );

      if ( xAbs >= zAbs ) {
        normal.copyFromFloats( 1, 0, 0 );
      } else {
        normal.copyFromFloats( 0, 0, 1 );
      }
    }
    // Create plane
    _pickingPlane = createPlane( planePosition, normal, scene );
  }

  function unsetFocusedMesh() {
    _lastFocusedPoint = null;
    _lastFocusedMesh = null;
  }
}();

