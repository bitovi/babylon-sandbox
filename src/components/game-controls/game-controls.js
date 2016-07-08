import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './game-controls.less!';
import template from './game-controls.stache!';
import { normalizedEventKey, normalizedWhichMouse } from '../../util/event-helpers';

/**
 * controlSet looks like this:
 * {
 *   "context": obj,
 *   "keydown": {
 *     "f": function () {...},
 *     "n": function () {...},
 *     "c": function () {...},
 *     "*": function () {...}
 *   },
 *   "mousedown": {
 *     "Left": function () {...}
 *   }
 * }
 * 
 * 
 * Functions will be called with context as the context and have passed in: $ev, normalizedKey/normalizedButton
 * 
 * From the functions, doing $ev.controlPropagationStopped = true will stop later matching control events from firing
 * 
 * if all other controls of that event type are to be blocked, you can pass in "*" as the normalizedKey/Button
 * then set $ev.controlPropagationStopped = true
 * 
 */

export const ViewModel = Map.extend({
  define: {
    controlSetStack: {
      value: []
    },
    controlSets: {
      value: {}
    }
  },
  registerControls ( controlSetName, controlSet ) {
    // on a component inserted
    this.attr( "controlSetStack" ).unshift( controlSetName );
    this.attr( "controlSets" ).attr( controlSetName, controlSet );
  },
  removeControls ( controlSetName ) {
    // on a component removed
    var controlSetStack = this.attr( "controlSetStack" );
    var x = controlSetStack.indexOf( controlSetName );
    if ( x > -1 ) {
      controlSetStack.splice( x, 1 );
      this.attr( "controlSets" ).removeAttr( controlSetName );
    }
  },
  handleEvent ( eventType, $ev, normalizedProp ) {
    var controlSetStack = this.attr( "controlSetStack" );
    var controlSets = this.attr( "controlSets" );
    for ( let i = 0; i < controlSetStack.length; i++ ) {
      let controlSet = controlSets.attr( controlSetStack[ i ] );
      if ( controlSet && controlSet[ eventType ] ) {
        let fn = controlSet[ eventType ][ normalizedProp ] || controlSet[ eventType ][ "*" ];
        if ( typeof fn === "string" ) {
          fn = controlSet.context[ fn ];
        }
        if ( fn ) {
          fn.call( controlSet.context, $ev, normalizedProp );
        }
        if ( $ev.controlPropagationStopped ) {
          // don't handle other of the same eventType+normalizedProp in this stack
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
      this.viewModel.handleEvent( "keydown", $ev, normalizedEventKey( $ev ) );
    },
    "{document} keypress": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "keypress", $ev, normalizedEventKey( $ev ) );
    },
    "{document} keyup": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "keyup", $ev, normalizedEventKey( $ev ) );
    },
    "{document} mousedown": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "mousedown", $ev, normalizedWhichMouse( $ev ) );
    },
    "{document} click": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "click", $ev, normalizedWhichMouse( $ev ) );
    },
    "{document} mouseup": function ( $doc, $ev ) {
      this.viewModel.handleEvent( "mouseup", $ev, normalizedWhichMouse( $ev ) );
    }
  }
});