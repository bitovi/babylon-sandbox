import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './mode-menu.less!';
import template from './mode-menu.stache!';
import { isServer } from '../../util/environment';
import { getControls } from '../../util/util.js';
import $ from 'jquery';

export const ViewModel = Map.extend({
  define: {
    modeUIDisabled: {
      value: false
    },
    flyMode: {
      value: false
    },
    navMode: {
      value: false
    },
    customizeMode: {
      value: false
    },
    mapVisibleMode: {
      value: false
    }
  },
  toggleFlyMode () {
    var cur = this.attr( "flyMode" );
    this.attr( "flyMode", !cur );
  },
  toggleNavMode () {
    var cur = this.attr( "navMode" );
    this.attr( "navMode", !cur );
  },
  toggleCustomizeMode () {
    var cur = this.attr( "customizeMode" );
    this.attr( "customizeMode", !cur );
  },
  toggleMapVisibleMode () {
    var cur = this.attr( "mapVisibleMode" );
    this.attr( "mapVisibleMode", !cur );
  }
});

export const controls = {
  "name": "mode-menu",
  "context": null,
  "keydown": {
    "f": "toggleFlyMode",
    "n": "toggleNavMode",
    "c": "toggleCustomizeMode"
  },
  "mousedown": {
    "Left": function ( $ev, normalizedKey, held, deltaTime ) {
      var $target = $( $ev.target );
      var actionHappened = false;

      if ( $target.is( ".flyMode" ) ) {
        this.toggleFlyMode();
        actionHappened = true;
      } else if ( $target.is( ".navMode" ) ) {
        this.toggleNavMode();
        actionHappened = true;
      } else if ( $target.is( ".customizeMode" ) ) {
        this.toggleCustomizeMode();
        actionHappened = true;
      } else if ( $target.is( ".mapVisibleMode" ) ) {
        this.toggleMapVisibleMode();
        actionHappened = true;
      }

      if ( actionHappened ) {
        // Left mousedown won't check any further on the control stack
        $ev.controlPropagationStopped = true;
      }
    }
  }
};

export default Component.extend({
  tag: 'mode-menu',
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