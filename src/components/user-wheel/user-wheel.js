import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './user-wheel.less!';
import template from './user-wheel.stache!';

export const ViewModel = Map.extend({
  define: {
    message: {
      value: 'This is the user-wheel component'
    }
  }
});

export default Component.extend({
  tag: 'user-wheel',
  viewModel: ViewModel,
  template
});