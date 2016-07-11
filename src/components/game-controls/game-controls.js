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
 *   "mousemove": { //$ev.controlPropagationStopped only works on "*"
 *     "*": function () {...}, //fires once per move even if a held one is fired too
 *     "Control": function () {...}, // mousemove while control is held
 *     "Left": function () {...} // mousemove while Left mouse is held
 *   }
 * }
 * 
 * 
 * Functions will be called with context as the context and have passed in: $ev, normalizedKey/normalizedButton, held, deltaTime
 * 
 * From the functions, doing $ev.controlPropagationStopped = true will stop later matching control events from firing
 * 
 * if all other controls of that event type are to be blocked, you can pass in "*" as the normalizedKey/Button
 * then set $ev.controlPropagationStopped = true
 * 
 */

var held = {};
var heldKeys = [];
/* the keys of this obj are the normalizedProp, the value is:
    {
      ts: Date.now(), // timestap from when the down event happend
      initialMousePos: { x, y } // only when the key is "Left", "Middle", or "Right"
    }
*/
//TODO: if keydown or up === Shift, change held Object.keys where key.length === 1 toLowerCase() -- maybe? Investigate.

export const ViewModel = Map.extend({
  define: {
    controlSetStack: {
      value: []
    },
    controlSets: {
      value: {}
    }
  },

  eventStacks: [ "keydown", "keypress", "keyup", "mousedown", "click", "mouseup", "mousemove", "held" ],
  keydown: [],
  keypress: [],
  keyup: [],
  mousedown: [],
  click: [],
  mouseup: [],
  mousemove: [],
  held: [],

  mouseMoveLastPos: {
    x: -1,
    y: -1
  },
  mouseMoveCurPos: {
    x: -1,
    y: -1
  },
  getLastMousePos ( relativeTo ) {
    //where relativeTo is an elment ( game-app or $game-app.find( 'canvas' ), usually )
    var pos = this.attr( "mouseMoveLastPos" );
    var returnPos = { x: pos.x, y: pos.y };
    //TODO: subtract $( relativeTo ).offset() values ^
    return returnPos;
  },
  getCurMousePos ( relativeTo ) {
    //where relativeTo is an elment ( game-app or $game-app.find( 'canvas' ), usually )
    var pos = this.attr( "mouseMoveCurPos" );
    var returnPos = { x: pos.x, y: pos.y };
    //TODO: subtract $( relativeTo ).offset() values ^
    return returnPos;
  },
  getInitialMousePos ( relativeTo, forNormalizedMouse ) {
    forNormalizedMouse = forNormalizedMouse || "Left";
    //where relativeTo is an elment ( game-app or $game-app.find( 'canvas' ), usually )
    var returnPos = { x: -1, y: -1 };
    var heldMouseObj = held[ forNormalizedMouse ];
    if ( heldMouseObj ) {
      let pos = heldMouseObj.initialMousePos;
      returnPos = { x: pos.x, y: pos.y };
      //TODO: subtract $( relativeTo ).offset() values ^
    }
    return returnPos;
  },
  registerControls ( controlSetName, controlSet ) {
    var eventStacks = this.attr( "eventStacks" );
    for ( let i = 0; i < eventStacks.length; i++ ) {
      let eventType = eventStacks[ i ];
      let newControls = controlSet[ eventType ];
      if ( newControls ) {
        newControls._name = controlSetName;
        newControls._context = controlSet.context;
        this.attr( eventType ).unshift( newControls );
      }
    }
  },
  removeControls ( controlSetName ) {
    // on a component removed
    var eventStacks = this.attr( "eventStacks" );
    for ( let i = 0; i < eventStacks.length; i++ ) {
      let eventStack = this.attr( eventStacks[ i ] );
      for ( let x = 0; x < eventStack.length; x++ ) {
        if ( eventStack[ x ]._name === controlSetName ) {
          eventStack.splice( x, 1 );
          x--;
        }
      }
    }
  },
  handleEvent ( eventType, $ev, normalizedProp ) {
    var eventStack = this.attr( eventType );
    var deltaTime = this.attr( "deltaTime" );

    for ( let i = 0; i < eventStack.length; i++ ) {
      let controls = eventStack[ i ];
      let fn = controls[ normalizedProp ] || controls[ "*" ];
      if ( typeof fn === "string" ) {
        fn = controls._context[ fn ];
      }
      if ( fn ) {
        fn.call( controls._context, $ev, normalizedProp, held, deltaTime );
      }
      if ( $ev.controlPropagationStopped ) {
        // don't handle other of the same eventType+normalizedProp in this stack
        break;
      }
    }
  },
  handleMousemoveEvent ( $ev ) {
    var eventStack = this.attr( "mousemove" );
    var deltaTime = this.attr( "deltaTime" );

    var numHeld = heldKeys.length;
    for ( let i = 0; i < eventStack.length; i++ ) {
      let controls = eventStack[ i ];

      for ( let x = 0; x < numHeld; x++ ) {
        let normalizedProp = heldKeys[ x ];
        let fn = controls[ normalizedProp ];
        if ( typeof fn === "string" ) {
          fn = controls._context[ fn ];
        }
        if ( fn ) {
          fn.call( controls._context, $ev, normalizedProp, held, deltaTime );
          $ev.controlPropagationStopped = false;
        }
      }
      if ( controls[ "*" ] ) {
        let fn = controls[ "*" ];
        if ( typeof fn === "string" ) {
          fn = controls._context[ fn ];
        }
        if ( fn ) {
          fn.call( controls._context, $ev, null, held, deltaTime );
        }
        if ( $ev.controlPropagationStopped ) {
          // don't handle other mousemoves in this stack
          break;
        }
      }
    }
  },
  handleHeldEvent ( $ev ) {
    var numHeld = heldKeys.length;
    if ( !numHeld ) {
      return;
    }
    var eventStack = this.attr( "held" );
    var deltaTime = this.attr( "deltaTime" );

    for ( let i = 0; i < eventStack.length; i++ ) {
      let controls = eventStack[ i ];

      for ( let x = 0; x < numHeld; x++ ) {
        let normalizedProp = heldKeys[ x ];
        let fn = controls[ normalizedProp ];

        if ( typeof fn === "string" ) {
          fn = controls._context[ fn ];
        }
        if ( fn ) {
          fn.call( controls._context, $ev, normalizedProp, held, deltaTime );
          $ev.controlPropagationStopped = false;
        }
      }
      if ( controls[ "*" ] ) {
        let fn = controls[ "*" ];
        if ( typeof fn === "string" ) {
          fn = controls._context[ fn ];
        }
        if ( fn ) {
          fn.call( controls._context, $ev, null, held, deltaTime );
        }
        if ( $ev.controlPropagationStopped ) {
          // don't handle other helds in this stack
          break;
        }
      }
    }
  }
});

export default Component.extend({
  tag: 'game-controls',
  viewModel: ViewModel,
  template,
  events: {
    "{document} keydown": function ( $doc, $ev ) {
      var norm = normalizedEventKey( $ev );
      var vm = this.viewModel;
      if ( held[ norm ] ) {
        //only fire it on the initial 'down' event
        return;
      }
      held[ norm ] = {
        ts: Date.now()
      };
      heldKeys = Object.keys( held );
      vm.handleEvent( "keydown", $ev, norm );
    },
    "{document} keypress": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "keypress", $ev, normalizedEventKey( $ev ) );
    },
    "{document} keyup": function ( $doc, $ev ) {
      var norm = normalizedEventKey( $ev );
      var vm = this.viewModel;
      delete held[ norm ];
      heldKeys = Object.keys( held );
      vm.handleEvent( "keyup", $ev, norm );
    },
    "{document} mousedown": function ( $doc, $ev ) {
      var norm = normalizedWhichMouse( $ev );
      var vm = this.viewModel;
      if ( held[ norm ] ) {
        //only fire it on the initial 'down' event
        return;
      }
      var touches = $ev.originalEvent.touches;
      var pageX = $ev.pageX || touches && touches[ 0 ] && touches[ 0 ].pageX || 0;
      var pageY = $ev.pageY || touches && touches[ 0 ] && touches[ 0 ].pageY || 0;
      held[ norm ] = {
        ts: Date.now(),
        initialMousePos: { x: pageX, y: pageY }
      };
      heldKeys = Object.keys( held );
      vm.handleEvent( "mousedown", $ev, norm );
    },
    "{document} click": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "click", $ev, normalizedWhichMouse( $ev ) );
    },
    "{document} mouseup": function ( $doc, $ev ) {
      var norm = normalizedWhichMouse( $ev );
      var vm = this.viewModel;
      delete held[ norm ];
      heldKeys = Object.keys( held );
      vm.handleEvent( "mouseup", $ev, norm );
    },
    "{document} mousemove": function ( $doc, $ev ) {
      var vm = this.viewModel;

      var touches = $ev.originalEvent.touches;
      var pageX = $ev.pageX || touches && touches[ 0 ] && touches[ 0 ].pageX || 0;
      var pageY = $ev.pageY || touches && touches[ 0 ] && touches[ 0 ].pageY || 0;

      var last = vm.attr( "mouseMoveCurPos" );
      var lastX = last.attr( "x" );
      var lastY = last.attr( "y" );

      vm.attr( "mouseMoveLastPos" ).attr({
        "x": lastX,
        "y": lastY
      });
      vm.attr( "mouseMoveCurPos" ).attr({
        "x": pageX,
        "y": pageY
      });

      vm.handleMousemoveEvent( $ev );
    },
    "{viewModel} renderCount": function ( ev_vm, $ev ) {
      //Trigger 'held' events
      var vm = this.viewModel;
      vm.handleHeldEvent( $ev );
    }
  }
});