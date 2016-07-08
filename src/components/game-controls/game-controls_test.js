import QUnit from 'steal-qunit';
import { ViewModel } from './game-controls';

// ViewModel unit tests
QUnit.module('egospace/components/game-controls');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the game-controls component');
});
