import QUnit from 'steal-qunit';
import { ViewModel } from './misc-menu';

// ViewModel unit tests
QUnit.module('egospace/components/misc-menu');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the misc-menu component');
});
