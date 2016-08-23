import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './game-camera.less!';
import template from './game-camera.stache!';
import BABYLON from 'babylonjs/babylon.max';
import { getControls } from '../../util/util.js';
import $ from 'jquery';

function fixedDecimals ( x ) {
  return parseFloat( ( x || 0 ).toFixed( 4 ) );
};

export const ViewModel = Map.extend({
  define: {
    // 7.5 units / second
    movementSpeed: {
      value: 7.5
    },
    // 2 radians / second
    rotationSpeed: {
      value: 2
    },
    // The default height when toggling to/from flyMode.
    defaultHeight: {
      value: 1.5
    },
    maxStepUp: {
      value: 0.6
    },
    maxStepDown: {
      value: -5.5
    },

    collisionBodyCenterOffsetFromCam: {
      get () {
        var cameraHeadRadius = 0.25;
        var defaultHeight = this.attr( "defaultHeight" );
        var playerHeight = defaultHeight + cameraHeadRadius;
        return cameraHeadRadius - ( playerHeight / 2 );
      }
    },

    curGroundMesh: {
      set ( newVal, oldVal ) {
        if ( !this.meshIsValidForCollision( newVal, true ) ) {
          // do not let invalid collision meshes ( like terrain ) become the current ground/floor
          newVal.checkCollisions = false;
          return oldVal;
        }
        oldVal.checkCollisions = true;
        newVal.checkCollisions = false;
        return newVal;
      }
    }
  },

  meshIsValidForCollision ( mesh, floorIsValidCollision ) {
    var camera = this.attr( "camera" );
    var collisionBody = camera.collisionBody;
    var meshName = ( mesh.name || mesh.id || "" ).toLowerCase().replace( /[^a-z]/g, "" );
    var isValid = true;

    if ( mesh === collisionBody ) { // || !mesh.material
      isValid = false;
    } else if ( mesh.__itemRef && mesh.__itemRef.options && mesh.__itemRef.options.terrain ) {
      isValid = false;
    } else if ( meshName === "skybox" || meshName === "skydome" ) {
      isValid = false;
    } else if ( !floorIsValidCollision && ( meshName === "floor" || meshName === "ground" ) ) {
      isValid = false;
    }

    return isValid;
  },

  collisionBodyCollidingWith () {
    var camera = this.attr( "camera" );
    var collisionBody = camera.collisionBody;
    var scene = camera._scene;
    var allMeshes = scene.meshes;
    var collidingMeshes = [];

    for ( let i = 0; i < allMeshes.length; i++ ) {
      let mesh = allMeshes[ i ];
      let meshName = ( mesh.name || mehs.id || "" ).toLowerCase().replace( /[^a-z]/g, "" );

      if ( !this.meshIsValidForCollision( mesh ) ) {
        continue;
      }
      if ( collisionBody.intersectsMesh( mesh, false ) ) {
        if ( collisionBody.intersectsMesh( mesh, true ) ) {
          collidingMeshes.push( mesh );
        }
      }
    }

    return collidingMeshes;
  },

  placeCollisionBodyAtCamera () {
    var camera = this.attr( "camera" );
    var collisionBody = camera.collisionBody;
    collisionBody.position = camera.position.clone();
    collisionBody.position.y += this.attr( "collisionBodyCenterOffsetFromCam" );
  },

  placeCameraAtCollisionBody () {
    var camera = this.attr( "camera" );
    var collisionBody = camera.collisionBody;
    var pos = collisionBody.position.clone();
    pos.y -= this.attr( "collisionBodyCenterOffsetFromCam" );
    camera.position = pos;
  },

  newGroundYCamPos ( requestedPos, noFall ) {
    var camera = this.attr( "camera" );
    var scene = camera._scene;
    var collisionBody = camera.collisionBody;
    var cameraHeadRadius = 0.25;
    var defaultHeight = this.attr( "defaultHeight" );
    var vectorDown = new BABYLON.Vector3( 0, -1, 0 );
    var topOfNewPos = new BABYLON.Vector3( requestedPos.x, requestedPos.y + cameraHeadRadius, requestedPos.z );
    var rayTopDown = new BABYLON.Ray( topOfNewPos, vectorDown );
    var rayTopDownPickingInfo = scene.pickWithRay( rayTopDown, ( hitMesh ) => {
      return hitMesh !== collisionBody; //hit anything
    });

    var curY = collisionBody.position.y - this.attr( "collisionBodyCenterOffsetFromCam" );
    var pickedPoint = rayTopDownPickingInfo && rayTopDownPickingInfo.pickedPoint || {};
    var newY = fixedDecimals( pickedPoint.y );

    var stepDiff = fixedDecimals( newY - ( curY - defaultHeight ) );
    var maxStepUp = this.attr( "maxStepUp" );
    var maxStepDown = this.attr( "maxStepDown" );

    var newCamY = curY;
    if ( stepDiff >= 0 && stepDiff < maxStepUp ) {
      newCamY = newY + defaultHeight;
      this.attr( "curGroundMesh", rayTopDownPickingInfo.pickedMesh );
    } else if ( stepDiff < 0 && stepDiff > maxStepDown ) {
      if ( !noFall ) {
        newCamY = newY + defaultHeight;
        this.attr( "curGroundMesh", rayTopDownPickingInfo.pickedMesh );
      }
    }

    return newCamY;
  },

  projectMovement ( moveDistances, fixedYPos ) {
    var camera = this.attr( "camera" );
    var collisionBody = camera.collisionBody;

    this.placeCollisionBodyAtCamera();

    collisionBody.moveWithCollisions( moveDistances );
    collisionBody.position.y = fixedYPos + this.attr( "collisionBodyCenterOffsetFromCam" );
  },

  verifyNewPosition ( projectedCamPos ) {
    var camera = this.attr( "camera" );
    var collisionBody = camera.collisionBody;
    var scene = camera._scene;
    var direction = projectedCamPos.subtract( camera.position ).normalize();
    var distance = BABYLON.Vector3.Distance( camera.position, projectedCamPos ) + ( 1.25 / 2 );
    var rayToPoint = new BABYLON.Ray( camera.position, direction, distance );
    var rayPickingInfo = scene.pickWithRay( rayToPoint, ( hitMesh ) => {
      return hitMesh !== collisionBody; // hit anything else
    });

    if ( rayPickingInfo.hit ) {
      // there is an object directly ahead that moveWithCollisions passed through
      return false;
    }

    direction = new BABYLON.Vector3( 0, -1, 0 ); // straight down
    distance = this.attr( "defaultHeight" ) - 0.1; // give a little play room for the distance down
    rayToPoint = new BABYLON.Ray( projectedCamPos, direction, distance );
    rayPickingInfo = scene.pickWithRay( rayToPoint, ( hitMesh ) => {
      return hitMesh !== collisionBody; // hit anything else
    });

    if ( rayPickingInfo.hit ) {
      // there is an object under the new position within the height of the player
      return false;
    }

    return true;
  },

  validCameraPos ( newCameraPos, noFall ) {
    return newCameraPos;
    var camera = this.attr( "camera" );
    var collisionBody = camera.collisionBody;
    var distances = newCameraPos.subtract( camera.position );
    var fixedYPos = this.newGroundYCamPos( newCameraPos, noFall );
    distances.y = fixedYPos - camera.position.y;
    //console.log( fixedYPos, distances.y );
    this.projectMovement( distances, fixedYPos );

    var projectedCamPos = collisionBody.position.clone();
    projectedCamPos.y -= this.attr( "collisionBodyCenterOffsetFromCam" );

    if ( this.verifyNewPosition( projectedCamPos ) ) {
      this.placeCameraAtCollisionBody();
    }

    return camera.position;
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
    // if ( newPos < 0.6 ) {
    //   newPos = 0.6;
    // }

    this.attr( "camera" ).position.y = newPos;
  },

  moveForward ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) || controlsVM.heldDuplicateExecution( this.moveForward ) ) {
      return false;
    }

    var dist = this.attr( "movementSpeed" ) * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y;

    var x = camera.position.x + Math.sin( rad ) * dist;
    var y = camera.position.y;
    var z = camera.position.z + Math.cos( rad ) * dist;
    var newPos = new BABYLON.Vector3( x, y, z )

    camera.position.copyFrom( this.validCameraPos( newPos, this.attr( "flyMode" ) ) );
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

    var x = camera.position.x + Math.sin( rad ) * dist;
    var y = camera.position.y;
    var z = camera.position.z + Math.cos( rad ) * dist;
    var newPos = new BABYLON.Vector3( x, y, z )

    camera.position.copyFrom( this.validCameraPos( newPos, this.attr( "flyMode" ) ) );
  },

  moveBackward ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ( this.attr( "movementDisabled" ) || controlsVM.heldDuplicateExecution( this.moveBackward ) ) {
      return false;
    }

    var dist = this.attr( "movementSpeed" ) * deltaTime;

    var camera = this.attr( "camera" );
    var rad = camera.rotation.y;

    var x = camera.position.x - Math.sin( rad ) * dist;
    var y = camera.position.y;
    var z = camera.position.z - Math.cos( rad ) * dist;
    var newPos = new BABYLON.Vector3( x, y, z )

    camera.position.copyFrom( this.validCameraPos( newPos, this.attr( "flyMode" ) ) );
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

    var x = camera.position.x + Math.sin( rad ) * dist;
    var y = camera.position.y;
    var z = camera.position.z + Math.cos( rad ) * dist;
    var newPos = new BABYLON.Vector3( x, y, z )

    camera.position.copyFrom( this.validCameraPos( newPos, this.attr( "flyMode" ) ) );
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
      var vm = this.viewModel;
      controls[ "context" ] = vm;
      getControls().registerControls( controls.name, controls );

      var cam = vm.attr( "camera" );
      cam.minZ = 0.5;
      cam.fov = 1;
      cam.ellipsoid = new BABYLON.Vector3( 1, 1.5, 1 );
      // cam.checkCollisions = true;

      var defaultHeight = vm.attr( "defaultHeight" );
      var playerHeight = defaultHeight + 0.25;

      var collisionBody = BABYLON.Mesh.CreateCylinder( "cameraCollisionMesh", playerHeight, 1.25, 1.25, 6, 0, cam._scene );
      //collisionBody.isVisible = false;
      collisionBody.applyGravity = true;
      //collisionBody.checkCollisions = true;
      collisionBody.onCollide = function ( mesh, ev ) {
        //if ( mesh && mesh.name && mesh.name !== "Floor_001" )
        //console.log( mesh.name ); //, mesh, ev );
      };

      cam.collisionBody = collisionBody;

      vm.placeCollisionBodyAtCamera();
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
