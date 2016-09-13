import Map from 'can/map/';
import 'can/map/define/';
import BABYLON from 'babylonjs/babylon.max';

const staticFurnitureFunctions = {

  loadTextures ( scene, arrayOfLoadedAssets ) {
    for ( let i = 0; i < arrayOfLoadedAssets.length; i++ ) {
      let unzippedAssets = arrayOfLoadedAssets[ i ].unzippedFiles;
      for ( let x = 0; x < unzippedAssets.length; x++ ) {
        let asset = unzippedAssets[ x ];
        if ( asset.type === "texture" ) {
          asset.instance = new BABYLON.Texture.CreateFromBase64String( "data:image/png;base64," + asset.data, asset.name, scene );
        }
      }
    }
    return arrayOfLoadedAssets;
  },

  loadModels ( scene, arrayOfLoadedAssets ) {
    var items = [];

    for ( let i = 0; i < arrayOfLoadedAssets.length; i++ ) {
      let assetInfo = arrayOfLoadedAssets[ i ];
      let unzippedAssets = assetInfo.unzippedFiles;
      let len = unzippedAssets.length;
      let babylonFileInfo = null;
      let collisionFileInfo = null;

      for ( let b = len - 1; b > -1; b-- ) {
        let fileInfo = unzippedAssets[ b ];
        if ( fileInfo.type === "babylon" ) {
          // is a babylon file that's been unpacked
          babylonFileInfo = fileInfo;
        } else if ( fileInfo.type === "collision" ) {
          collisionFileInfo = fileInfo;
        }
      }

      if ( babylonFileInfo ) {
        let item = new Furniture({ name: babylonFileInfo.name, ajaxInfo: assetInfo });

        BABYLON.SceneLoader.ImportMesh( "", "", "data:" + babylonFileInfo.data, scene, item.attachMeshes.bind( item ) );
        // TODO: if collisionFileInfo, item.attachCollisionMeshes.bind( item )

        items.push( item );
      }
    }

    return items; //arrayOfLoadedAssets;
  },

  setMeshLocationFromAjaxData ( rootMeshes, info ) {
    const pos = info.position || {};
    const rot = info.rotation || {};

    const posX = parseFloat( pos.x ) || 0;
    const posY = parseFloat( pos.y ) || 0;
    const posZ = parseFloat( pos.z ) || 0;

    const rotX = parseFloat( rot.x ) || 0;
    const rotY = parseFloat( rot.y ) || 0;
    const rotZ = parseFloat( rot.z ) || 0;
    const rotW = parseFloat( rot.w ) || 0;

    for ( let i = 0; i < rootMeshes.length; ++i ) {
      let rootMesh = rootMeshes[ i ];
      rootMesh.position.x = posX;
      rootMesh.position.y = posY;
      rootMesh.position.z = posZ;

      // If no rotationQuaternion exists then create an identity quaternion
      if ( !rootMesh.rotationQuaternion ) {
        rootMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
      }

      rootMesh.rotationQuaternion.x = rotX;
      rootMesh.rotationQuaternion.y = rotY;
      rootMesh.rotationQuaternion.z = rotZ;
      rootMesh.rotationQuaternion.w = rotW;

      rootMesh.rotationQuaternion.normalize();
    }
  },

  /**
   * Get the rootMesh for a mesh. Recursively go through all parents until root parent.
   * @param {BABYLON.Mesh} mesh
   * @returns {BABYLON.Mesh}
   */
  getRootMesh ( mesh ) {
    var parent = mesh.parent || mesh;
    while ( parent.parent ){
      parent = parent.parent;
    }
    return parent;
  },

  loadAllFromAJAXRoomsFurnitures ( scene, roomFurnitures ) {
    var furnPromises = [];
    var matPromises = [];

    for ( let i = 0; i < roomFurnitures.length; i++ ) {
      let furn = roomFurnitures[ i ];
      furn.assetID = furn.assetID || furn.ufurnID;

      furn.furnURL = furn.furnURL.replace( ".unity3d", "_LOD0.zip" );
      furnPromises.push( Asset.get( furn ) );

      furn.textureAsset = new can.Map({
        assetURL: furn.furnMatURL.replace( "-mat.unity3d", "_Tex0.zip" )
      });
      matPromises.push( Asset.get( furn.textureAsset ) );
    }

    var furnitures = Promise.all( furnPromises );

    var materials = Promise.all( matPromises ).then(
      Furniture.loadTextures.bind( Furniture, scene )
    );

    return materials.then( () => {
      return furnitures.then(
        Furniture.loadModels.bind( Furniture, scene )
      );
    });
  }
};

export const Furniture = Map.extend( staticFurnitureFunctions, {
  define: {
  },

  meshesLoaded: false,
  collisionMeshesLoaded: false,
  
  // The parent item of this item.
  parent: null,
  
  // Children items, what items should have same changes done as this item
  children: [],
  
  name: "",
  
  ajaxInfo: {},
  
  meshes: [],
  
  // RootMeshes to easily update all positions when moving an item
  rootMeshes: [],

  // The maximum values for the bounds ( bounding box )
  boundsMaximum: new BABYLON.Vector3( -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE ),
  
  // The minimum values for the bounds
  boundsMinimum: new BABYLON.Vector3( Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE ),
  
  // The center offset of item + children.
  // Is position + centerOffset = center
  centerOffset: BABYLON.Vector3.Zero(),

  // The size of the item + children
  // centerOffset.x + size.x * 0.5 = maximum x
  size: BABYLON.Vector3.Zero(),

  // The surface normal of the floor / furniture / something else that this item is attached to
  surfaceNormal: BABYLON.Vector3.Zero(),

  // The surface offset when moving the item across surfaces
  surfaceOffset: BABYLON.Vector3.Zero(),

  needSurfaceOffset: true,
  
  // The surface rotation of the item. The inverse is used to remove its rotation before applying the new rotation.
  // Is the inverse but when creating we can use identity still since identity has no impact or the inverse of an identity
  inverseSurfaceRotation: BABYLON.Quaternion.Identity(),

  // The base rotation of the item when moving it along surfaces.
  // Base rotation = rotation - current surfaceRotation
  baseRotation: BABYLON.Quaternion.Identity(),

  /**
   * Compares min & max and changes the input if lower/greater
   * @param {BABYLON.Vector3} minimum
   * @param {BABYLON.Vector3} maximum
   * @param {BABYLON.Vector3} compareMinimum The minimum to compare against
   * @param {BABYLON.Vector3} compareMaximum The maximum to compare against
   */
  compareMinMax ( minimum, maximum, compareMinimum, compareMaximum ) {
    if ( minimum.x > compareMinimum.x ) {
      minimum.x = compareMinimum.x;
    }
    if ( minimum.y > compareMinimum.y ) {
      minimum.y = compareMinimum.y;
    }
    if ( minimum.z > compareMinimum.z ) {
      minimum.z = compareMinimum.z;
    }
  
    if ( maximum.x < compareMaximum.x ) {
      maximum.x = compareMaximum.x;
    }
    if ( maximum.y < compareMaximum.y ) {
      maximum.y = compareMaximum.y;
    }
    if ( maximum.z < compareMaximum.z ) {
      maximum.z = compareMaximum.z;
    }
  },

  /**
   * Update what the center offset is to center an item's meshes
   * This is called onload and when setting a new parent / removing as child to re-calculate the center offset
   * @param {EgowallItem} item
   */
  updateCenterOffset () {
    // get the minimum & maximum
    var tmpMinimum = BABYLON.Tmp.Vector3[ 8 ].copyFrom( item.attr( "boundsMinimum" ) );
    var tmpMaximum = BABYLON.Tmp.Vector3[ 7 ].copyFrom( item.attr( "boundsMaximum" ) );
    var children = this.attr( "children" );
  
    // TODO: Loop over item's children and compare against their bounds min & max
    for ( let i = 0; i < children.length; ++i ) {
      // Do recursive stuff
      this.itemCompareChildBounds( children[ i ], tmpMinimum, tmpMaximum );
    }

    var itemSize = this.attr( "size" );
    itemSize.x = (tmpMaximum.x - tmpMinimum.x);
    itemSize.y = (tmpMaximum.y - tmpMinimum.y);
    itemSize.z = (tmpMaximum.z - tmpMinimum.z);
  
    // Get the center pos of the bounds
    const centerX = itemSize.x * 0.5 + tmpMinimum.x;
    const centerY = itemSize.y * 0.5 + tmpMinimum.y;
    const centerZ = itemSize.z * 0.5 + tmpMinimum.z;
  
    // Since position (pivot point) is always 0, 0, 0 this is the offset to place an object in the center when setting position
    // If center is at 0, 1, 0 then we need to remove 0, -1 , 0  to put pivot point at center
    // Otherwise if we use positive offset we push the object up in the world
    this.attr( "centerOffset" ).copyFromFloats( -centerX, -centerY, -centerZ );

    // Everytime the centerOffset is recalculated the surfaceOffset also has to be recalculated
    this.attr( "needSurfaceOffset", true );
  },
  
  /**
   * Comapres the bounds to input minimum & maximum
   * Then does the same for all children
   * @param {EgowallItem} item
   * @param {BABYLON.Vector3} minimum
   * @param {BABYLON.Vector3} maximum
   */
  itemCompareChildBounds ( item, minimum, maximum ) {
    let tmpMinimum = BABYLON.Tmp.Vector3[ 6 ].copyFrom( item.attr( "boundsMinimum" ) );
    let tmpMaximum = BABYLON.Tmp.Vector3[ 5 ].copyFrom( item.attr( "boundsMaximum" ) );
  
    const rootMesh = item.attr( "rootMeshes" )[ 0 ];
    let tmpPosition = BABYLON.Tmp.Vector3[ 4 ].copyFrom( rootMesh.position );
  
    this.multiplyVector3( rootMesh.rotationQuaternion, tmpPosition, tmpPosition ); //TODO: bring in function
  
    // Compare bounds
    this.compareMinMax( minimum, maximum, tmpMinimum, tmpMaximum );
  
    // Compare children bounds
    for ( let i = 0; i < item.children.length; ++i ) {
      // Do recursive stuff
      this.itemCompareChildBounds( item.children[ i ], minimum, maximum );
    }
  },

  attachMeshes ( meshes ) {
    var furnName = this.attr( "ajaxInfo.furnName" );
    var rootMeshes = {};

    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[ i ];

      let positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
      if ( !positions ) {
        continue;
      } else {
        // If the mesh isn't a mesh group then add it to meshes[]
        this.attr( "meshes" ).push( mesh );
      }

      mesh.name = furnName || mesh.name;

      mesh.receiveShadows = true;

      mesh.checkCollisions = true;
      mesh.receiveShadows = true;

      let parent = Furniture.getRootMesh( mesh );

      if ( !rootMeshes[ parent.id ] ) {
        rootMeshes[ parent.id ] = true;
        this.attr( "rootMeshes" ).push( parent );
      }
      const boundingBox = mesh.getBoundingInfo().boundingBox;
      this.compareMinMax(
        this.attr( "boundsMinimum" ),
        this.attr( "boundsMaximum" ),
        boundingBox.minimumWorld,
        boundingBox.maximumWorld
      );
    }

    this.updateCenterOffset();

    // Set the position for all rootMeshes and rotation
    Furniture.setMeshLocationFromAjaxData( this.attr( "rootMeshes" ), itemInfo );

    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[ i ];
      mesh.__itemRef = this;
      mesh.freezeWorldMatrix();
    }

    this.attr( "meshesLoaded", true );
  }
});






    // This adds the _cid which is our uniqueId for an EgowallItem
    this.attr("items").push( item );
    // Temporary, should be set from collisions.babylon
    this.collisionMeshes.push( mesh );
    this.addToObjDirLightShadowGenerator( mesh );