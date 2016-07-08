import QUnit from 'steal-qunit';
import { ViewModel } from './game-app';

// ViewModel unit tests
QUnit.module('egospace/components/game-app');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the game-app component');
});
