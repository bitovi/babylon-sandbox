import fixture from 'can-fixture';

const store = fixture.store([{
  furnID: 0,
  description: 'First item'
}, {
  furnID: 1,
  description: 'Second item'
}]);

fixture({
  'GET https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles': store.findAll,
  'GET https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles/{furnID}': store.findOne,
  'POST https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles': store.create,
  'PUT https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles/{furnID}': store.update,
  'DELETE https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles/{furnID}': store.destroy
});

export default store;
