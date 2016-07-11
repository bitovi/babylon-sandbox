import QUnit from 'steal-qunit';
import { ViewModel } from './info-tooltip';

// ViewModel unit tests
QUnit.module('egospace/components/info-tooltip');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the info-tooltip component');
});
