import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './game-camera.less!';
import template from './game-camera.stache!';
import BABYLON from 'babylonjs/babylon.max';
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

  moveCamera ( newCoords, duration, lookAtTargetVector3 ) {
    let camera = this.attr( "camera" );
    // Clone the value or it'd be linked when doing changes
    const startPos = camera.position.clone();
    // How much the camera has to move for all 3 axises
    const distance = newCoords.subtract( startPos );

    let promise = new Promise(function(resolve, reject){
      const start = new Date();

      let animationFunction = function(){
        // Check if Promise is resolved
        // If not checking for that it would keep on running.


        // Ranges from 0 -> 1.0
        const progress = (new Date() - start) / duration;

        if (progress < 1){
          // Use + distance because it was newCoords.subtract
          camera.position.x = startPos.x + ( distance.x * progress);
          camera.position.y = startPos.y + ( distance.y * progress);
          camera.position.z = startPos.z + ( distance.z * progress);

          // Pans the camera, need an input parameter instead
          if ( lookAtTargetVector3 ) {
            camera.setTarget( lookAtTargetVector3 ); // new BABYLON.Vector3( 0, 0, 0 )
          }

          requestAnimationFrame(animationFunction);
        } else {
          camera.position = newCoords;
          resolve();
        }
      };

      requestAnimationFrame(animationFunction);

    });
    // move camera to position indicated gradually over duration ms
    //return promise that resolves when camera gets to newCoords
    return promise;
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

  //calls moveCamera
  //  distance between newCoords and camera * speed for 'duration' param
  //return promise that resolves when camera gets to newCoords
  moveCameraSpeed ( newCoords, speed, lookAtTargetVector3 ) {
    const distance = newCoords.subtract( this.attr( "camera" ).position ).length();
    // Get the duration in seconds
    // Example 15 / 10 = 1.5 seconds
    const duration = distance / speed;
    // Convert duration from seconds -> millisecond space.
    return this.moveCamera( newCoords, duration * 1000, lookAtTargetVector3 );
  },

  // 10 units / second
  movementSpeed: 10,
  // 2 radians / second
  rotationSpeed: 2,
  // The default height when toggling to/from flyMode.
  defaultHeight: 1.5,

  moveUp ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) || !this.attr( "flyMode" ) ) {
      return false;
    }

    var dist = this.attr( "movementSpeed" ) * deltaTime;

    this.attr( "camera" ).position.y += dist;
  },

  moveDown ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) || !this.attr( "flyMode" ) ) {
      return false;
    }

    var dist = this.attr( "movementSpeed" ) * deltaTime;

    var newPos = this.attr( "camera" ).position.y - dist;
    if ( newPos < 0.6 ) {
      newPos = 0.6;
    }

    this.attr( "camera" ).position.y = newPos;
  },

  moveForward ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) || controlsVM.heldDuplicateExecution( this.moveForward ) ) {
      return false;
    }

    var dist = this.attr( "movementSpeed" ) * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y;

    camera.position.x += Math.sin( rad ) * dist;
    camera.position.z += Math.cos( rad ) * dist;
  },

  rotateLeft ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }
    var camera = this.attr( "camera" );
    var pi = Math.PI;

    var rotdist = this.attr( "rotationSpeed" ) * deltaTime;
    var camy = camera.rotation.y;
    camy -= rotdist;

    if ( camy > pi ) {
      camy = camy - 2 * pi;
    } else if ( camy <= -pi ) {
      camy = camy + 2 * pi;
    }

    camera.rotation.y = camy;
  },

  strafeLeft ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) || controlsVM.heldDuplicateExecution( this.strafeLeft ) ) {
      return false;
    }

    var dist = this.attr( "movementSpeed" ) * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y - Math.PI / 2;

    camera.position.x += Math.sin( rad ) * dist;
    camera.position.z += Math.cos( rad ) * dist;
  },

  moveBackward ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) || controlsVM.heldDuplicateExecution( this.moveBackward ) ) {
      return false;
    }

    var dist = this.attr( "movementSpeed" ) * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y;

    camera.position.x -= Math.sin( rad ) * dist;
    camera.position.z -= Math.cos( rad ) * dist;
  },

  rotateRight ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }
    var camera = this.attr( "camera" );
    var pi = Math.PI;

    var rotdist = this.attr( "rotationSpeed" ) * deltaTime;
    var camy = camera.rotation.y;
    camy += rotdist;

    if ( camy > pi ) {
      camy = camy - 2 * pi;
    } else if ( camy <= -pi ) {
      camy = camy + 2 * pi;
    }

    camera.rotation.y = camy;
  },

  strafeRight ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) || controlsVM.heldDuplicateExecution( this.strafeRight ) ) {
      return false;
    }

    var dist = this.attr( "movementSpeed" ) * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y + Math.PI / 2;

    camera.position.x += Math.sin( rad ) * dist;
    camera.position.z += Math.cos( rad ) * dist;
  },

  rotateMouseDelta ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) ) {
      return false;
    }
    //var initialPos = controlsVM.getInitialMousePos( "Right" );
    var lastPos = controlsVM.mousemoveLastMousePos();
    var curPos = controlsVM.curMousePos();

    //TODO: get the game-app elment more safely ( on inserted this.element.closest )
    var gameApp = $( "game-app" )[ 0 ];
    var difHor = ( curPos.x - lastPos.x ) / gameApp.offsetWidth;
    var difVert = ( curPos.y - lastPos.y ) / gameApp.offsetHeight;

    var camera = this.attr( "camera" );
    const pi = Math.PI;

    var fov = pi;

    var horRotDist = fov * difHor;
    var camy = camera.rotation.y;
    camy += horRotDist;

    var vertRotDist = fov * difVert;
    var camx = camera.rotation.x;
    camx += vertRotDist;

    if ( camy > pi ) {
      camy = camy - 2 * pi;
    } else if ( camy <= -pi ) {
      camy = camy + 2 * pi;
    }

    // This is to prevent the camera from inverting by going beyond the camera's up vector.
    const maxUp = (pi * 0.5) - 0.01;
    const maxDown = (-pi * 0.5) + 0.01;
    if (camx >= maxUp ){
      camx = maxUp;
    } else if (camx <= maxDown) {
      camx = maxDown;
    }

    camera.rotation.y = camy;
    camera.rotation.x = camx;
  }
});

export const controls = {
  "name": "game-camera",
  "context": null,
  "click": {
    "Left" ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
      var camera = this.attr( "camera" );
      var scene = camera._scene;
      var curMousePos = controlsVM.curMousePos();

      var pickingInfo = scene.pick( curMousePos.x, curMousePos.y, ( hitMesh ) => {
        let pickFloor = hitMesh.__backgroundMeshInfo ? true : false;

        if ( pickFloor ) {
          let meshName = hitMesh.name || "";
          meshName = meshName.toLowerCase().replace( /[^a-z]/g, "" );
          pickFloor = ( meshName === "floor" || meshName === "ground" );
        }

        return pickFloor;
      });

      if ( pickingInfo && pickingInfo.pickedPoint ) {
        let speed = this.attr( "movementSpeed" );
        let point = pickingInfo.pickedPoint;
        point.y = this.attr( "defaultHeight" );
        this.moveCameraSpeed( point, speed, point );
      }
    }
  },
  "held": {
    "w": "moveForward",
    "a": "strafeLeft",
    "s": "moveBackward",
    "d": "strafeRight",
    "ArrowUp": "moveForward",
    "ArrowLeft": "rotateLeft",
    "ArrowDown": "moveBackward",
    "ArrowRight": "rotateRight",
    ",": "moveUp",
    ".": "moveDown"
  },
  "mousemove": {
    "Right": "rotateMouseDelta"
  }
};

export default Component.extend({
  tag: 'game-camera',
  viewModel: ViewModel,
  template,
  events: {
    "inserted": function () {
      controls[ "context" ] = this.viewModel;
      getControls().registerControls( controls.name, controls );
    },
    "removed": function () {
      getControls().removeControls( controls.name );
    },
    "{viewModel} flyMode": function ( zz1, zz2, newVal ) {
      var vm = this.viewModel;
      if ( newVal ) {
        vm.attr( "camera" ).position.y = vm.attr( "defaultHeight" ) + 0.5;
      } else {
        vm.attr( "camera" ).position.y = vm.attr( "defaultHeight" );
      }
    }
  }
});
