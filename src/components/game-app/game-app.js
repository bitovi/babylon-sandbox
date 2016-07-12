import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './game-app.less!';
import template from './game-app.stache!';
import { childVM } from '../../util/util.js';
import $ from 'jquery';
import { isServer } from '../../util/environment';

export const ViewModel = Map.extend({
  define: {
    isServer: {
      value: isServer
    },
    modeVM: {
      get () {
        return childVM.call( this, "mode-menu" );
      }
    },
    gameCanvasVM: {
      get () {
        return childVM.call( this, "babylon-canvas" );
      }
    },
    cameraLookMode: {
      value: false
    }
  }
});

export default Component.extend({
  tag: 'game-app',
  viewModel: ViewModel,
  template,
  events: {
    inserted () {
      this.viewModel.attr( "$el", this.element );
    },
    "{document} contextmenu": function ( $doc, $ev ) {
      var $target = $( $ev.target );
      if ( $target.is( "game-app" ) || $target.closest( "game-app" ).length ) {
        $ev.preventDefault();
        $ev.stopPropagation();
        return false;
      }
    },
    "{viewModel.modeVM} mapVisibleMode": function () {
      var vm = this.viewModel;
      var gcVM = vm.attr( "gameCanvasVM" );
      gcVM.testToggleLights();
    }
  }
});