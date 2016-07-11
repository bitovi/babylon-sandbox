import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './game-camera.less!';
import template from './game-camera.stache!';
import Babylon from 'babylonjs/babylon.max';
import { isServer } from '../../util/environment';
import { getControls } from '../../util/util.js';
import $ from 'jquery';

export const ViewModel = Map.extend({
  define: {
    message: {
      value: 'This is the game-camera component'
    }
  },
  validCameraPos ( newCoords ) {
    //TODO: collsion/bounds check here

    return true;
  },
  moveCamera ( newCoords, duration ) {
    var camera = this.attr( "camera" );
    // move camera to position indicated gradually over duration ms
    //return promise that resolves when camera gets to newCoords
  },
  pointCamera ( newDirection, duration ) {
    //return promise that resolves when camera points to newDirection
  },
  getDirectionVector( pos1, pos2 ) {
    //
  },
  objCameraPoints ( obj ) {
    //return array of coordinates corresponding to each horizontal side of the object
    //  where the coords are the position the camera should be for that side
    //  figure out given:
    //    obj center point
    //    current rotation
    //    direction vector away from the center towards each side
    //    position the x & z coords a TBD fixed distance beyond the edge of a side along its direction vector
  },
  closestValidOfPoints ( arryOfPoints ) {
    //filter the set of coordinates in the passed-in array to only valid ones
    //  using validCameraPos
    //return which of those points is closest || null
  },
  getCameraPosForObj ( obj ) {
    var coordsArray = this.objCameraPoints( obj );
    var newCoords = this.closestValidOfPoints( coordsArray );
    return newCoords || null;
  },
  moveCameraSpeed ( newCoords, speed ) {
    //calls moveCamera
    //  distance between newCoords and camera * speed for 'duration' param
    //return promise that resolves when camera gets to newCoords
  },

  moveForward ( $ev, normalizedKey, held, deltaTime ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }

    var speed = 0.005;
    var dist = speed * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y;

    camera.position.x += Math.sin( rad ) * dist;
    camera.position.z += Math.cos( rad ) * dist;
  },
  rotateLeft ( $ev, normalizedKey, held, deltaTime ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }
    var camera = this.attr( "camera" );
    var pi = Math.PI;

    var rotSpeed = 0.001;
    var rotdist = rotSpeed * deltaTime;
    var camy = camera.rotation.y;
    camy -= rotdist;

    if ( camy > pi ) {
      camy = camy - 2 * pi;
    } else if ( camy <= -pi ) {
      camy = camy + 2 * pi;
    }

    camera.rotation.y = camy;
  },
  strafeLeft ( $ev, normalizedKey, held, deltaTime ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }

    var speed = 0.005;
    var dist = speed * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y - Math.PI / 2;

    camera.position.x += Math.sin( rad ) * dist;
    camera.position.z += Math.cos( rad ) * dist;
  },
  moveBackward ( $ev, normalizedKey, held, deltaTime ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }

    var speed = 0.005;
    var dist = speed * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y;

    camera.position.x -= Math.sin( rad ) * dist;
    camera.position.z -= Math.cos( rad ) * dist;
  },
  rotateRight ( $ev, normalizedKey, held, deltaTime ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }
    var camera = this.attr( "camera" );
    var pi = Math.PI;

    var rotSpeed = 0.001;
    var rotdist = rotSpeed * deltaTime;
    var camy = camera.rotation.y;
    camy += rotdist;

    if ( camy > pi ) {
      camy = camy - 2 * pi;
    } else if ( camy <= -pi ) {
      camy = camy + 2 * pi;
    }

    camera.rotation.y = camy;
  },
  strafeRight ( $ev, normalizedKey, held, deltaTime ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }

    var speed = 0.005;
    var dist = speed * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y + Math.PI / 2;

    camera.position.x += Math.sin( rad ) * dist;
    camera.position.z += Math.cos( rad ) * dist;
  }
});

export const controls = {
  "name": "game-camera",
  "context": null,
  "held": {
    "w": "moveForward",
    "a": "strafeLeft",
    "s": "moveBackward",
    "d": "strafeRight",
    "ArrowUp": "moveForward",
    "ArrowLeft": "rotateLeft",
    "ArrowDown": "moveBackward",
    "ArrowRight": "rotateRight"
  },
  "mousedown": {
    "Right": function ( $ev, normalizedKey, held ) {
      //console.log( "Right mousedown event", this, arguments );
      //$ev.controlPropagationStopped = true;
    }
  }
};

export default Component.extend({
  tag: 'game-camera',
  viewModel: ViewModel,
  template,
  events: {
    "inserted": function () {
      if ( isServer ) {
        return;
      }
      controls[ "context" ] = this.viewModel;
      getControls().registerControls( controls.name, controls );
    },
    "removed": function () {
      if ( isServer ) {
        return;
      }
      getControls().removeControls( controls.name );
    }
  }
});
