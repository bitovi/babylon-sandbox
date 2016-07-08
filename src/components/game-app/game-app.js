import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './game-app.less!';
import template from './game-app.stache!';
import { childVM } from '../../util/util.js';

export const ViewModel = Map.extend({
  define: {
    modeVM: {
      get () {
        return childVM.call( this, "mode-menu" );
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
    "{document} mousedown": function () {
      //var vm = this.viewModel;
      //var mmVM = vm.attr( "modeVM" );
      //mmVM.attr( "flyMode", !mmVM.attr( "flyMode" ) );
    }
  }
});