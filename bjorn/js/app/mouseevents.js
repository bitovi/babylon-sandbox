/**
 * Created on 9.1.2017.
 */
"use strict";
/**
 *
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.Mesh} mesh
 * @param {BABYLON.Mesh} ground
 */
window.initMouseEvents = function ( scene, mesh, ground ) {

  let _isMouseDown = false;
  let _isMouseLookDown = false;

  function moveMesh( a_mousePos ) {
    const x = a_mousePos.x;
    const y = a_mousePos.y;

    const pickingResult = scene.pick( x, y, ( hitmesh ) => {
      return hitmesh === ground;
    } );

    if ( pickingResult.hit ) {
      mesh.position.x = pickingResult.pickedPoint.x;
      mesh.position.z = pickingResult.pickedPoint.z;
    }
  }

  /**
   * @param {MouseEvent} e
   */
  function onmousemove ( e ) {

    if ( _isMouseDown ) {
      window.magnetMouseMove( e, scene );
    }
    if ( _isMouseLookDown ) {
      window.showVisibleMagnetPoints( mesh );
    } else {
      window.magnetMouseOver( e, scene );
    }
  }

  /**
   * @param {MouseEvent} e
   */
  function onmousedown ( e ) {
    if ( e.which === 1 ) {
      _isMouseDown = true;
      window.magnetMouseDown( e, scene );
    } else if ( e.which === 2 ) {
      _isMouseLookDown = true;
    }



  }

  /**
   * @param {MouseEvent} e
   */
  function onmouseup ( e ) {
    if ( e.which === 1 ) {
      _isMouseDown = false;
      window.magnetMouseUp( e );
    } else if ( e.which === 2 ) {
      _isMouseLookDown = false;
    }

  }

  window.addEventListener( "mousemove", onmousemove );
  window.addEventListener( "mousedown", onmousedown );
  window.addEventListener( "mouseup", onmouseup );

};
