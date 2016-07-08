import QUnit from 'steal-qunit';
import { ViewModel } from './location-menu';

// ViewModel unit tests
QUnit.module('egospace/components/location-menu');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the location-menu component');
});
