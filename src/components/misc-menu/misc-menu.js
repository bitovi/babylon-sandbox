import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './misc-menu.less!';
import template from './misc-menu.stache!';

export const ViewModel = Map.extend({
  define: {
    message: {
      value: 'This is the misc-menu component'
    }
  }
});

export default Component.extend({
  tag: 'misc-menu',
  viewModel: ViewModel,
  template
});