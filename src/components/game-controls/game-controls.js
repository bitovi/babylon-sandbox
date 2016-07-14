import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './game-controls.less!';
import template from './game-controls.stache!';
import { normalizedEventKey, normalizedWhichMouse } from '../../util/event-helpers';

/**
 * controlSet looks like this:
 * {
 *   "name": "control-set-name",
 *   "context": obj,
 *   "keydown": {
 *     "f": function () {...},
 *     "n": function () {...},
 *     "c": function () {...},
 *     "*": function () {...} //fires once if the keydown event isn't otherwise covered ( like if it was 'z' in this example )
 *   },
 *   "mousedown": {
 *     "Left": function () {...},
 *     "Middle": "aFunctionNameOnTheContextObj"
 *   },
 *   "mousemove": {
 *     "*": function () {...}, //fires once per move even if a held one is fired too
 *     "Control": function () {...}, // mousemove while control is held
 *     "Left": function () {...} // mousemove while Left mouse is held
 *   }
 * }
 * 
 * 
 * Functions will be called with context as the context and have passed in:
 *  $ev, normalizedKey/normalizedButton, held, deltaTime, controlsVM
 * 
 * From the functions, doing $ev.controlPropagationStopped = true will stop later matching control events from firing
 * 
 * if all other controls of that event type are to be blocked, you can pass in "*" as the normalizedKey/Button
 * then set $ev.controlPropagationStopped = true
 * 
 */

var heldInfo = {};
var heldKeys = [];
/* the keys of this obj are the normalizedProp, the value is:
    {
      ts: Date.now(), // timestap from when the down event happend
      initialMousePos: { x, y } // only when the key is "Left", "Middle", or "Right"
    }
*/
//TODO: if keydown or up === Shift, change held Object.keys where key.length === 1 toLowerCase() -- maybe? Investigate.
var mousemovePropagationStopped = {};
var heldPropagationStopped = {};
var mousemoveDuplicateExecution = [];
var heldDuplicateExecution = [];

var eventStacks = [ "keydown", "keypress", "keyup", "mousedown", "click", "mouseup", "mousemove", "held" ];
var stacks = {
  keydown: [],
  keypress: [],
  keyup: [],
  mousedown: [],
  click: [],
  mouseup: [],
  mousemove: [],
  held: []
};

var posRelativeToEl = null; // set to closest parent 'game-app' element on inserted
var curMousePos = {
  x: -1,
  y: -1
};
var mousemoveLastMousePos = {
  x: -1,
  y: -1
};
var heldLastMousePos = {
  x: -1,
  y: -1
};

export const ViewModel = Map.extend({
  // Returns the current mouse position releative to the game-app element ( posRelativeToEl )
  // if pageXYOnly is truthy, the x and y position returned will just be the pageX and pageY from the event
  curMousePos ( pageXYOnly ) {
    var pos = curMousePos;
    var returnPos = { x: pos.x, y: pos.y };
    if ( !pageXYOnly ) {
      let offsets = posRelativeToEl.offset();
      returnPos.x - offsets.left;
      returnPos.y - offsets.top;
    }
    return returnPos;
  },
  mousemoveLastMousePos ( pageXYOnly ) {
    var pos = mousemoveLastMousePos;
    var returnPos = { x: pos.x, y: pos.y };
    if ( !pageXYOnly ) {
      let offsets = posRelativeToEl.offset();
      returnPos.x - offsets.left;
      returnPos.y - offsets.top;
    }
    return returnPos;
  },
  heldLastMousePos ( pageXYOnly ) {
    var pos = heldLastMousePos;
    var returnPos = { x: pos.x, y: pos.y };
    if ( !pageXYOnly ) {
      let offsets = posRelativeToEl.offset();
      returnPos.x - offsets.left;
      returnPos.y - offsets.top;
    }
    return returnPos;
  },

  getInitialMousePos ( forNormalizedMouse = "Left", pageXYOnly ) {
    var returnPos = { x: -1, y: -1 };
    var heldMouseObj = heldInfo[ forNormalizedMouse ];
    if ( heldMouseObj ) {
      let pos = heldMouseObj.initialMousePos;
      returnPos = { x: pos.pageX, y: pos.pageY };
      if ( !pageXYOnly ) {
        let offsets = posRelativeToEl.offset();
        returnPos.x - offsets.left;
        returnPos.y - offsets.top;
      }
    }
    return returnPos;
  },

  registerControls ( controlSetName, controlSet ) {
    for ( let i = 0; i < eventStacks.length; i++ ) {
      let eventType = eventStacks[ i ];
      let newControls = controlSet[ eventType ];
      if ( newControls ) {
        let controlKeyList = Object.keys( newControls );
        //TODO: loop over controlKeyList and spread out keys like "w,ArrowUp"
        //TODO: allow that ^ to have a comma too like 'fly up' controls of , and space: ",, "
        //TODO: allow sequences: "seq:ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a"
        newControls._name = controlSetName;
        newControls._context = controlSet.context;
        // convert string function names into functions so we don't have to check during events
        for ( let x = 0; x < controlKeyList.length; x++ ) {
          let key = controlKeyList[ x ];
          let fn = newControls[ key ];
          if ( typeof fn === "string" ) {
            fn = newControls._context[ fn ];
          }
          if ( typeof fn === "function" ) {
            newControls[ key ] = fn;
          } else {
            delete newControls[ key ];
            console.log( "Control function not found:", controlSetName, key, fn );
          }
        }
        stacks[ eventType ].unshift( newControls );
      }
    }
  },

  removeControls ( controlSetName ) {
    // on a component removed
    for ( let i = 0; i < eventStacks.length; i++ ) {
      let eventStack = stacks[ eventStacks[ i ] ];
      for ( let x = 0; x < eventStack.length; x++ ) {
        if ( eventStack[ x ]._name === controlSetName ) {
          eventStack.splice( x, 1 );
          x--;
        }
      }
    }
  },

  handleEvent ( eventType, $ev, normalizedProp ) {
    var eventStack = stacks[ eventType ];
    var deltaTime = this.attr( "deltaTime" );

    for ( let i = 0; i < eventStack.length; i++ ) {
      let controls = eventStack[ i ];
      let fn = controls[ normalizedProp ] || controls[ "*" ];
      if ( fn ) {
        fn.call( controls._context, $ev, normalizedProp, heldInfo, deltaTime, this );
        if ( $ev.controlPropagationStopped ) {
          // don't handle other of the same eventType+normalizedProp in this stack
          break;
        }
      }
    }
  },
  handleMousemoveEvent ( $ev ) {
    var eventStack = stacks[ "mousemove" ];
    var deltaTime = this.attr( "deltaTime" );

    var numHeld = heldKeys.length;
    for ( let i = 0; i < eventStack.length; i++ ) {
      let controls = eventStack[ i ];

      for ( let x = 0; x < numHeld; x++ ) {
        let normalizedProp = heldKeys[ x ];
        if ( mousemovePropagationStopped[ normalizedProp ] ) {
          continue;
        }
        let fn = controls[ normalizedProp ];
        if ( fn ) {
          fn.call( controls._context, $ev, normalizedProp, heldInfo, deltaTime, this );
          mousemoveDuplicateExecution.push( fn );
          if ( $ev.controlPropagationStopped ) {
            // don't handle other mousemoves for this key/button
            mousemovePropagationStopped[ normalizedProp ] = true;
          }
        }
      }
      if ( controls[ "*" ] ) {
        let fn = controls[ "*" ];
        if ( fn ) {
          fn.call( controls._context, $ev, null, heldInfo, deltaTime, this );
          if ( $ev.controlPropagationStopped ) {
            // don't handle other mousemoves
            break;
          }
        }
      }
    }
    mousemovePropagationStopped = {};
    mousemoveDuplicateExecution = [];
  },
  handleHeldEvent ( $ev ) {
    var numHeld = heldKeys.length;
    if ( !numHeld ) {
      return;
    }
    var eventStack = stacks[ "held" ];
    var deltaTime = this.attr( "deltaTime" );

    for ( let i = 0; i < eventStack.length; i++ ) {
      let controls = eventStack[ i ];

      for ( let x = 0; x < numHeld; x++ ) {
        let normalizedProp = heldKeys[ x ];
        if ( heldPropagationStopped[ normalizedProp ] ) {
          continue;
        }
        let fn = controls[ normalizedProp ];
        if ( fn ) {
          fn.call( controls._context, $ev, normalizedProp, heldInfo, deltaTime, this );
          heldDuplicateExecution.push( fn );
          if ( $ev.controlPropagationStopped ) {
            // don't handle other helds for this key/button
            heldPropagationStopped[ normalizedProp ] = true;
          }
        }
      }
      if ( controls[ "*" ] ) {
        let fn = controls[ "*" ];
        if ( fn ) {
          fn.call( controls._context, $ev, null, heldInfo, deltaTime, this );
          if ( $ev.controlPropagationStopped ) {
            // don't handle other helds
            break;
          }
        }
      }
    }
    heldPropagationStopped = {};
    heldDuplicateExecution = [];
  },

  // returns true if the fn passed in has already executed during this instance of mousemove
  mousemoveDuplicateExecution ( fn ) {
    return mousemoveDuplicateExecution.indexOf( fn ) > -1;
  },

  // returns true if the fn passed in has already executed during this instance of held ( durring this frame render )
  heldDuplicateExecution ( fn ) {
    return heldDuplicateExecution.indexOf( fn ) > -1;
  }
});

export default Component.extend({
  tag: 'game-controls',
  viewModel: ViewModel,
  template,
  events: {
    "inserted": function () {
      posRelativeToEl = this.element.closest( "game-app" );
    },
    "{document} keydown": function ( $doc, $ev ) {
      var norm = normalizedEventKey( $ev );
      var vm = this.viewModel;
      if ( heldInfo[ norm ] ) {
        //only fire it on the initial 'down' event
        return;
      }
      heldInfo[ norm ] = {
        ts: Date.now()
      };
      heldKeys = Object.keys( heldInfo );
      vm.handleEvent( "keydown", $ev, norm );
    },
    "{document} keypress": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "keypress", $ev, normalizedEventKey( $ev ) );
    },
    "{document} keyup": function ( $doc, $ev ) {
      var norm = normalizedEventKey( $ev );
      var vm = this.viewModel;
      delete heldInfo[ norm ];
      heldKeys = Object.keys( heldInfo );
      vm.handleEvent( "keyup", $ev, norm );
    },
    "{document} mousedown": function ( $doc, $ev ) {
      var norm = normalizedWhichMouse( $ev );
      var vm = this.viewModel;
      if ( heldInfo[ norm ] ) {
        //only fire it on the initial 'down' event
        return;
      }
      var touches = $ev.originalEvent.touches;
      var pageX = $ev.pageX || touches && touches[ 0 ] && touches[ 0 ].pageX || 0;
      var pageY = $ev.pageY || touches && touches[ 0 ] && touches[ 0 ].pageY || 0;
      heldInfo[ norm ] = {
        ts: Date.now(),
        initialMousePos: { pageX, pageY }
      };
      heldKeys = Object.keys( heldInfo );
      vm.handleEvent( "mousedown", $ev, norm );
    },
    "{document} click": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "click", $ev, normalizedWhichMouse( $ev ) );
    },
    "{document} mouseup": function ( $doc, $ev ) {
      var norm = normalizedWhichMouse( $ev );
      var vm = this.viewModel;
      delete heldInfo[ norm ];
      heldKeys = Object.keys( heldInfo );
      vm.handleEvent( "mouseup", $ev, norm );
    },
    "{document} mousemove": function ( $doc, $ev ) {
      var vm = this.viewModel;

      var touches = $ev.originalEvent.touches;
      var pageX = $ev.pageX || touches && touches[ 0 ] && touches[ 0 ].pageX || 0;
      var pageY = $ev.pageY || touches && touches[ 0 ] && touches[ 0 ].pageY || 0;

      mousemoveLastMousePos.x = curMousePos.x;
      mousemoveLastMousePos.y = curMousePos.y;

      curMousePos.x = pageX;
      curMousePos.y = pageY;

      vm.handleMousemoveEvent( $ev );
    },
    "{viewModel} renderCount": function ( ev_vm, $ev ) {
      //Trigger 'held' events
      var vm = this.viewModel;
      vm.handleHeldEvent( $ev );

      // after the held event runs, record what the mouse pos was
      heldLastMousePos.x = curMousePos.x;
      heldLastMousePos.y = curMousePos.y;
    }
  }
});
