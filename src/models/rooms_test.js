import QUnit from 'steal-qunit';
import Rooms from './rooms';

QUnit.module('models/rooms');

QUnit.test('getList', function(){
  stop();
  Rooms.getList().then(function(items) {
    QUnit.equal(items.length, 2);
    QUnit.equal(items.attr('0.description'), 'First item');
    start();
  });
});
