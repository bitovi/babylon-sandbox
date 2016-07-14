import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './mode-menu.less!';
import template from './mode-menu.stache!';
import { getControls, getTooltip } from '../../util/util.js';
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

var tooltips = {
  "flyMode": {
    title: "Fly Mode. Use , and . keys to fly up/down"
  },
  "navMode": {
    title: "Navigation Mode"
  },
  "customizeMode": {
    title: "Customization Mode"
  },
  "mapVisibleMode": {
    title: "Map"
  }
};

export default Component.extend({
  tag: 'mode-menu',
  viewModel: ViewModel,
  template,
  events: {
    ".flyMode,.navMode,.customizeMode,.mapVisibleMode mouseenter": function ( $el, $ev ) {
      var mode = $ev.target.className.replace( /^.*?([^ ]+Mode)\b.*$/, "$1" );
      var ttinfo = tooltips[ mode ];
      if ( !mode || !ttinfo ) {
        return;
      }
      var tt = getTooltip();
      var $target = $( $ev.target );
      var offset = $target.offset();
      var x = offset.left + $ev.target.offsetWidth - 20;
      var y = offset.top + $ev.target.offsetHeight + 3;
      tt.set( "mode-menu", ttinfo.title );
      tt.position( x, y );
    },
    ".flyMode,.navMode,.customizeMode,.mapVisibleMode mouseleave": function ( $el, $ev ) {
      getTooltip().clear( "mode-menu" );
    },
    "inserted": function () {
      controls[ "context" ] = this.viewModel;
      getControls().registerControls( controls.name, controls );
    },
    "removed": function () {
      getControls().removeControls( controls.name );
    }
  }
});