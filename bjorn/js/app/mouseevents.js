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

      // Calculate collisions
      let collisionResults = window.getCollisionResults();
      if ( collisionResults.length > 0 ) {
        // console.log( collisionResults );
        for ( let i = 0; i < collisionResults.length; ++i ) {
          // Snap!
          window.snapItem( collisionResults[ i ] );
        }
      }
    }
  }

  /**
   * @param {MouseEvent} e
   */
  function onmousemove ( e ) {
    if ( _isMouseDown && e.which === 1 ) {
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
    _isMouseDown = true;
  }

  /**
   * @param {MouseEvent} e
   */
  function onmouseup ( e ) {
    _isMouseDown = false;
  }

  window.addEventListener( "mousemove", onmousemove );
  window.addEventListener( "mousedown", onmousedown );
  window.addEventListener( "mouseup", onmouseup );

};
