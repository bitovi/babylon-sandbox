import QUnit from 'steal-qunit';
import { ViewModel } from './mode-menu';

// ViewModel unit tests
QUnit.module('egospace/components/mode-menu');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the mode-menu component');
});
