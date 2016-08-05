import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './location-menu.less!';
import template from './location-menu.stache!';

export const ViewModel = Map.extend({
  define: {
    message: {
      value: 'This is the location-menu component'
    }
  }
});

export default Component.extend({
  tag: 'location-menu',
  viewModel: ViewModel,
  template,
  events: {
    inserted () {
      var vm = this.viewModel;
      vm.attr( "homesPromise" ).then( ( hl ) => {
        vm.attr( "homeName", hl.attr( "homeName" ) );
      });
    }
  }
});