import QUnit from 'steal-qunit';
import { ViewModel } from './demo';

// ViewModel unit tests
QUnit.module('egospace/components/demo');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the egospace-demo component');
});
