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
      const mousePos = {
        x: e.clientX,
        y: e.clientY
      };
      // move mesh
      moveMesh(  mousePos );
    }
  }

  /**
   * @param {MouseEvent} e
   */
  function onmousedown ( e ) {
    if ( e.which === 1 ) {
      _isMouseDown = true;
    }

  }

  /**
   * @param {MouseEvent} e
   */
  function onmouseup ( e ) {
    if ( e.which === 1 ) {
      _isMouseDown = false;
    }

  }

  window.addEventListener( "mousemove", onmousemove );
  window.addEventListener( "mousedown", onmousedown );
  window.addEventListener( "mouseup", onmouseup );

};
