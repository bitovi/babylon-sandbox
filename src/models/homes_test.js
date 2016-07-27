import QUnit from 'steal-qunit';
import Homes from './homes';

QUnit.module('models/homes');

QUnit.test('getList', function(){
  stop();
  Homes.getList().then(function(items) {
    QUnit.equal(items.length, 2);
    QUnit.equal(items.attr('0.description'), 'First item');
    start();
  });
});
