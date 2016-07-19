import QUnit from 'steal-qunit';
import Constants from './constants';

QUnit.module('models/constants');

QUnit.test('getList', function(){
  stop();
  Constants.getList().then(function(items) {
    QUnit.equal(items.length, 2);
    QUnit.equal(items.attr('0.description'), 'First item');
    start();
  });
});
