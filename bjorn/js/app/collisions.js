/**
 * Created on 10.1.2017.
 */
"use strict";
!function() {

  var _scene;
  /**
   *
   * @type {BABYLON.Mesh[]}
   * @private
   */
  var _collisions;
  /**
   *
   * @type {BABYLON.Mesh}
   * @private
   */
  var _item;

  var _collisionMaterial;

  var _intersectionBox;

  /**
   *
   * @param a_scene
   * @param {BABYLON.Mesh[]} a_collisions
   * @param {BABYLON.Mesh} a_item
   */
  window.initCollisions = function( a_scene, a_collisions, a_item ) {
    _scene = a_scene;
    _collisions = a_collisions;
    _item = a_item;

    const colorValue = "#D0GD0G";

    _collisionMaterial = new BABYLON.StandardMaterial( "colliding", a_scene );
    _collisionMaterial.diffuseColor = BABYLON.Color3.FromHexString( colorValue );
    _collisionMaterial.alpha = 0.7;

  }

  window.getCollisionResults = function() {
    let collisionResults = [];

    _item.__originalPosition = _item.position.clone();

    if ( _item._children && _item._children.length ) {
      return getCollisionResultsMultiple( [ _item, ..._item.getChildMeshes() ] );
    }

    _item.computeWorldMatrix(true);

    for ( let i = 0; i < _collisions.length; ++i ){
      let collisionMesh = _collisions[i];

      if ( _item.intersectsMesh( collisionMesh, true ) ) {

        if ( !collisionMesh.__oldMat ) {
          collisionMesh.__oldMat = collisionMesh.material;
          collisionMesh.material = _collisionMaterial;
        }

        collisionResults.push( { item: _item, collision:  collisionMesh } );
      } else {
        if ( collisionMesh.__oldMat ) {
          collisionMesh.material = collisionMesh.__oldMat;
          delete collisionMesh.__oldMat;
        }
      }
    }

    return collisionResults;
  }

  function getCollisionResultsMultiple( a_children ) {
    let collisionResults = [];

    let hasCollided = {};

    for ( let i = 0; i < a_children.length; ++i ) {
      let child = a_children[ i ];

      child.computeWorldMatrix(true);

      for ( let j = 0; j < _collisions.length; ++j ) {
        let collisionMesh = _collisions[ j ];

        if ( child.intersectsMesh( collisionMesh, true ) ) {

          if ( !collisionMesh.__oldMat ) {
            collisionMesh.__oldMat = collisionMesh.material;
            collisionMesh.material = _collisionMaterial;
          }

          hasCollided[ collisionMesh.uniqueId ] = true;

          let exists = false;
          let rootCollision = collisionMesh.parent || collisionMesh;
          while ( rootCollision.parent ) {
            rootCollision = rootCollision.parent;
          }

          collisionResults.forEach( function( result ) {
            if ( result.parent === rootCollision ) {
              exists = true;
              result.collisions.push( collisionMesh );
              result.items.push( child );
            }
          });

          if ( !exists ) {
            collisionResults.push( { items: [ child ], collisions: [ collisionMesh ], parent:rootCollision } );
          }
        } else {
          if ( collisionMesh.__oldMat && !hasCollided[ collisionMesh.uniqueId ]  ) {
            collisionMesh.material = collisionMesh.__oldMat;
            delete collisionMesh.__oldMat;
          }
        }
      }
    }

    return collisionResults;
  }


}();