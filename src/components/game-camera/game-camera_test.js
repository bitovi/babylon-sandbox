import QUnit from 'steal-qunit';
import { ViewModel } from './game-camera';

// ViewModel unit tests
QUnit.module('egospace/components/game-camera');

QUnit.test('Has message', function(){
  var vm = new ViewModel();
  QUnit.equal(vm.attr('message'), 'This is the game-camera component');
});
