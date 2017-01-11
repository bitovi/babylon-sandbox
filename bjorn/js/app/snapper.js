/**
 * Created on 10.1.2017.
 */
"use strict";
!function() {

  /*
  BoundingBox.vectors connection points
   0 => 2, 3, 4
   1 => 5, 6, 7
   2 => 0, 5, 7
   3 => 0, 5, 6
   4 => 0, 6, 7
   5 => 1, 2 ,3
   6 => 1, 3, 4
   7 => 1, 2, 4
   */
  /*
   WITHOUT Y axis
   BoundingBox.vectors connection points
   0 => 2, 4
   1 => 5, 6
   2 => 0, 7
   3 => 5, 6
   4 => 0, 7
   5 => 1, 3
   6 => 1, 3
   7 => 2, 4
   */

  var _intersectionBox;

  function createIntersectonBox ( item ) {

    if ( !_intersectionBox ) {
      let scene = item.getScene();

      _intersectionBox = BABYLON.MeshBuilder.CreateBox( "intersectionBox", { width: 1, depth: 1, height: 1 }, scene );
      _intersectionBox.material = new BABYLON.StandardMaterial( "intersectionMaterial", scene );

      _intersectionBox.material.diffuseColor = BABYLON.Color3.FromHexString("#000");
      _intersectionBox.material.specularColor = BABYLON.Color3.Black();
    }
  }

  function placeIntersectionBox( min, max, center ) {

    let xsize = max.x - min.x;
    let ysize = max.y - min.y;
    let zsize = max.z - min.z;

    if ( _intersectionBox ) {
      _intersectionBox.dispose();
    }

    _intersectionBox = BABYLON.MeshBuilder.CreateBox( "intersectionBox", {
      width: xsize,
      height: ysize,
      depth: zsize
    }, scene );
    _intersectionBox.material = new BABYLON.StandardMaterial( "intersectionMaterial", scene );

    _intersectionBox.material.diffuseColor = BABYLON.Color3.FromHexString("#000");
    _intersectionBox.material.specularColor = BABYLON.Color3.Black();

    _intersectionBox.position.copyFrom( center );
    // _intersectionBox.scaling.copyFromFloats( , max.y - min.y, max.z - min.z );
  }

  function getMinMax ( a, b ) {
    const itemBB = a.boundingBox;
    const collisionBB = b.boundingBox;

    const x5 = Math.max( itemBB.minimumWorld.x, collisionBB.minimumWorld.x );
    const y5 = Math.max( itemBB.minimumWorld.y, collisionBB.minimumWorld.y );
    const z5 = Math.max( itemBB.minimumWorld.z, collisionBB.minimumWorld.z );

    const x6 = Math.min( itemBB.maximumWorld.x, collisionBB.maximumWorld.x );
    const y6 = Math.min( itemBB.maximumWorld.y, collisionBB.maximumWorld.y );
    const z6 = Math.min( itemBB.maximumWorld.z, collisionBB.maximumWorld.z );

    let minIntersection = new BABYLON.Vector3( x5, y5, z5 );
    let maxIntersection = new BABYLON.Vector3( x6, y6, z6 );

    return {
      min: minIntersection,
      max: maxIntersection
    };
  }


  /**
   *
   * @param {BABYLON.BoundingInfo} a_itemBoundingInfo
   * @param {BABYLON.BoundingInfo} a_collisionBoundingInfo
   */
  function getCollidingPoints( a_itemBoundingInfo, a_collisionBoundingInfo ) {
    let intersection = getMinMax( a_itemBoundingInfo, a_collisionBoundingInfo );

    let minIntersection = intersection.min;
    let maxIntersection = intersection.max;

    let center = new BABYLON.Vector3(0,0, 0);
    center.x = minIntersection.x + ( maxIntersection.x - minIntersection.x ) * 0.5;
    center.y = minIntersection.y + ( maxIntersection.y - minIntersection.y ) * 0.5;
    center.z = minIntersection.z + ( maxIntersection.z - minIntersection.z ) * 0.5;

    placeIntersectionBox( minIntersection, maxIntersection, center );

    var result = {
      boundingbox: new BABYLON.BoundingBox( minIntersection, maxIntersection ),
      center: center,
      minpoints: [
        new BABYLON.Vector3( maxIntersection.x, minIntersection.y, minIntersection.z ),
        new BABYLON.Vector3( minIntersection.x, minIntersection.y, maxIntersection.z )
      ],
      minanchor: new BABYLON.Vector3( maxIntersection.x, minIntersection.y, maxIntersection.z ),
      maxpoints: [
        new BABYLON.Vector3( maxIntersection.x, maxIntersection.y, minIntersection.z ),
        new BABYLON.Vector3( minIntersection.x, maxIntersection.y, maxIntersection.z )
      ],
      maxanchor: new BABYLON.Vector3( minIntersection.x, maxIntersection.y, minIntersection.z )
    };

    return result;
  }

  /**
   *
   * @param {BABYLON.Mesh} a_item
   * @param a_collisionData
   */
  function getSurfaceNormal( a_item ) {
    let scene = a_item.getScene();

    _intersectionBox.computeWorldMatrix(true);

    let rayPosition = a_item.getAbsolutePosition().clone();
    rayPosition.y = _intersectionBox.position.y;

    let rayDirection = _intersectionBox.position.subtract( rayPosition );

    let rayLength = rayDirection.length() + 0.5;
    rayDirection.normalize();

    let ray = new BABYLON.Ray( rayPosition, rayDirection, rayLength );
    var world = _intersectionBox.getWorldMatrix();

    var pickWithRayInverseMatrix = BABYLON.Matrix.Identity();

    world.invertToRef( pickWithRayInverseMatrix );
    ray = BABYLON.Ray.Transform( ray, pickWithRayInverseMatrix );

    const pickingInfo = _intersectionBox.intersects( ray );

    const surfaceNormal = pickingInfo.getNormal(true);

    return surfaceNormal;
  }

  function snapItemSingle ( a_item, a_collisionMesh ) {

    let itemBoundingInfo = a_item.getBoundingInfo();
    let collisionBoundingInfo = a_collisionMesh.getBoundingInfo();

    let collisionPoints = getCollidingPoints( itemBoundingInfo, collisionBoundingInfo );
    return collisionPoints;
  }

  function snapItemMultiple( a_items, a_collisionMesh ) {

    let collisionBoundingInfo = a_collisionMesh.getBoundingInfo();

    let minIntersection = new BABYLON.Vector3( Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE );
    let maxIntersection = new BABYLON.Vector3( -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE );

    for ( let i = 0; i < a_items.length; ++i ) {
      let item = a_items[ i ];

      let itemBoundingInfo = item.getBoundingInfo();

      let intersection = getMinMax( itemBoundingInfo, collisionBoundingInfo );

      minIntersection.MinimizeInPlace( intersection.min );
      maxIntersection.MaximizeInPlace( intersection.max );
    }

    let center = new BABYLON.Vector3( 0, 0, 0 );
    center.x = minIntersection.x + ( maxIntersection.x - minIntersection.x ) * 0.5;
    center.y = minIntersection.y + ( maxIntersection.y - minIntersection.y ) * 0.5;
    center.z = minIntersection.z + ( maxIntersection.z - minIntersection.z ) * 0.5;

    placeIntersectionBox( minIntersection, maxIntersection, center );

    var result = {
      boundingbox: new BABYLON.BoundingBox( minIntersection, maxIntersection ),
      center: center,
      minpoints: [
        new BABYLON.Vector3( maxIntersection.x, minIntersection.y, minIntersection.z ),
        new BABYLON.Vector3( minIntersection.x, minIntersection.y, maxIntersection.z )
      ],
      minanchor: new BABYLON.Vector3( maxIntersection.x, minIntersection.y, maxIntersection.z ),
      maxpoints: [
        new BABYLON.Vector3( maxIntersection.x, maxIntersection.y, minIntersection.z ),
        new BABYLON.Vector3( minIntersection.x, maxIntersection.y, maxIntersection.z )
      ],
      maxanchor: new BABYLON.Vector3( minIntersection.x, maxIntersection.y, minIntersection.z )
    };

    return result;
  }

  /**
   *
   * @param {{item:BABYLON.Mesh, items:BABYLON.Mesh[], collision:BABYLON.Mesh}} a_collisionResult
   */
  window.snapItem = function ( a_collisionResult ) {

    let item;
    let collisionPoints;
    if ( a_collisionResult.item ) {
      item = a_collisionResult.item;
      collisionPoints = snapItemSingle( item, a_collisionResult.collision );
    } else {
      collisionPoints = snapItemMultiple( a_collisionResult.items, a_collisionResult.collision );
      // Get rootItem
      item = a_collisionResult.items[ 0 ].parent || a_collisionResult.items[ 0 ];
      while ( item.parent ) {
        item = item.parent;
      }
    }

    let surfaceNormal = getSurfaceNormal( item );

    let size = collisionPoints.boundingbox.extendSize.clone();
    size.scaleInPlace(2);
    size.multiplyInPlace( surfaceNormal );

    item.position.addInPlace( size );
    item.computeWorldMatrix(true);
  }
}();