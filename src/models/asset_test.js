import QUnit from 'steal-qunit';
import Asset from './asset';

QUnit.module('models/asset');

QUnit.test('getList', function(){
  stop();
  Asset.getList().then(function(items) {
    QUnit.equal(items.length, 2);
    QUnit.equal(items.attr('0.description'), 'First item');
    start();
  });
});
