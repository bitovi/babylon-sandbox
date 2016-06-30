import F from 'funcunit';
import QUnit from 'steal-qunit';

F.attach(QUnit);

QUnit.module('egospace functional smoke test', {
  beforeEach() {
    F.open('../development.html');
  }
});

QUnit.test('egospace main page shows up', function() {
  F('title').text('egospace', 'Title is set');
});
