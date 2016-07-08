import QUnit from 'steal-qunit';
import { ViewModel } from './user-wheel';

// ViewModel unit tests
QUnit.module('egospace/components/user-wheel');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the user-wheel component');
});
