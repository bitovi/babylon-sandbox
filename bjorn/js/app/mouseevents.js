/**
 * Created on 9.1.2017.
 */
"use strict";
window.initMouseEvents = function ( scene, mesh ) {

  let _isMouseDown = false;

  /**
   * @param {MouseEvent} e
   */
  function onmousemove ( e ) {
    if ( _isMouseDown ) {
      // move mesh

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
