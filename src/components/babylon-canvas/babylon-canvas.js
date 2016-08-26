import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './babylon-canvas.less!';
import template from './babylon-canvas.stache!';
import _find from 'lodash/find.js';

import 'cannon';
import BABYLON from 'babylonjs/babylon.max';
// import '../../static/3d/js/babylon.objFileLoader.js';

import { getControls, getTooltip, anyTruthy } from '../../util/util.js';

import Constants from '../../models/constants.js';
import Homes from '../../models/homes.js';
import Rooms from '../../models/rooms.js';
import Asset from '../../models/asset.js';

/**
 * @typedef {{
 * _cid: undefined|String,
 * activeGravity: undefined|Boolean,
 * baseRotation:undefined|BABYLON.Quaternion,
 * children: EgowallItem[],
 * lastSurfaceNormal: undefined|BABYLON.Vector3,
 * meshes: BABYLON.Mesh[],
 * name: string,
 * options: *,
 * parent: EgowallItem|null,
 * parentInitialRotation: undefined|BABYLON.Quaternion,
 * rootMeshes: BABYLON.Mesh[]
 * }} EgowallItem
 */
/**
 * @typedef {{ hit: BABYLON.Mesh, furniture: BABYLON.Mesh }} CollisionResult
 */
/**
 * @typedef {{x:Number, y:Number}} Vector2
 */

export const ViewModel = Map.extend({
  define: {
    items: {
      value: [],
      get ( last ) {
        return last || [];
      }
    },
    deltaTime: {
      value: 0
    },
    renderCount: {
      value: 0
    },
    homeLoadFinished: {
      set ( newVal ) {
        if ( newVal ) {
          this.freezeShadowCalculations();
          // Fixes unity's lightmap displacement
          // Need to do this here because ambientTexture.getBaseSize()  is 0 if done too early.
          this.bgUpdateLightmapsOffset();

          // Do a setTimeour because applyTerrainMaterials doesn't work correctly if freezing materials before all the changes has gone through.
          setTimeout( () => {
            this.freezeMaterials();
          }, 1);
        }
        return newVal;
      }
    }
  },
  /**
   * The skydome material to animate in the renderloop
   */
  skydomeMaterial: null,
  // A temporary array to gather all the terrain meshes for the applyTerrainLightmap function
  terrainMeshes: [],
  // Meshes to do collision checks against
  collisionMeshes: [],
  // If the shadowmap needs to be updated, for example when a furniture is moved or rotated.
  updateShadowmap: true,
  // This creates and positions a free camera
  initCamera () {
    var scene = this.attr( "scene" );
    var camera = new BABYLON.TargetCamera( "camera1", new BABYLON.Vector3( -3, 1.5, -4 ), scene );
    this.attr( "camera", camera );

    camera.setTarget( new BABYLON.Vector3( 0, 1.25, 0 ) );
    camera.attachControl( this.attr( "canvas" ), false );

    return camera;
  },

  hoveredMesh: null,

  getPickingFn ( mesh, customizeMode ) {
    var pickingFn = null;
    var isBGMesh = customizeMode && ( mesh.__backgroundMeshInfo ? true : false );
    var isFurnItem = !customizeMode && this.isMeshFurnitureItem( mesh );
    var isEgoObj = !customizeMode && this.isMeshEgoObj( mesh );
    
    if ( isBGMesh ) {
      pickingFn = "pickingBG";
    } else if ( isFurnItem ) {
      pickingFn = "pickingItem";
    } else if ( isEgoObj ) {
      pickingFn = "pickingEgoObj";
    }

    return pickingFn;
  },

  pickingEvent ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    if ($ev.target.nodeName.toLowerCase() === "canvas") {
      if (this.selectedItem){
        this.selectedItemMovePicking( controlsVM.curMousePos() );
      }
      // If selectedItem is set
      else {
        var curMousePos = controlsVM.curMousePos();
        var customizeMode = this.attr( "customizeMode" );
        let hoveredMesh = this.attr( "hoveredMesh" );

        let pickingInfo = this.getPickingFromMouse( curMousePos, ( hitMesh ) => {
          return this.getPickingFn( hitMesh, customizeMode ) ? true : false;
        });

        if ( pickingInfo.hit ) {
          let pickingFn = this.getPickingFn( pickingInfo.pickedMesh, customizeMode );
          this[ pickingFn ]( hoveredMesh, pickingInfo, curMousePos );
        } else {
          this.unsetHoveredMesh();
        }
      }
    } else {
      // If outside canvas and selectedItem is false then unset the hoveredMesh
      if (!this.selectedItem){
        this.unsetHoveredMesh();
      }
    }
  },

  /**
   * Unset the hovered mesh if mouseover the canvas or no picking result
   */
  unsetHoveredMesh(){
    let hoveredMesh = this.attr( "hoveredMesh" );
    if ( hoveredMesh ) {
      this.clearMeshOutline( hoveredMesh );
      getTooltip().clear( "meshHover" );
      this.attr( "hoveredMesh", null );
    }
  },
  /**
   * Get a picking result from mouse coordinates for the meshes that fulfill the predicate
   * @param {Vector2} mousePos
   * @param {Function} predicate
   * @returns {PickingInfo|*}
   */
  getPickingFromMouse( mousePos, predicate ){
    // If mouse is not on the canvas then don't even bother picking
    const scene = this.attr( "scene" );
    return scene.pick( mousePos.x, mousePos.y, predicate);
  },

  pickingBG ( hoveredMesh, pickingInfo, curMousePos ) {
    var mesh = pickingInfo.pickedMesh;
    var title = "Click to customize.<br>Press and hold right mouse to look around.";
    var message = mesh.name + " (" + mesh.__backgroundMeshInfo.meshID + ")";

    if ( hoveredMesh !== mesh ) {
      this.setMeshOutline( mesh );
    }

    getTooltip().set( "meshHover", title, null, message, curMousePos.x, curMousePos.y );
  },

  pickingItem ( hoveredMesh, pickingInfo, curMousePos ) {
    var mesh = pickingInfo.pickedMesh;
    var name = mesh.name;

    if ( hoveredMesh !== mesh ) {
      this.setMeshOutline( mesh );
    }

    getTooltip().set( "meshHover", name, "fa-archive", "Click to Manage", curMousePos.x, curMousePos.y );
  },

  pickingEgoObj ( hoveredMesh, pickingInfo, curMousePos ) {
    var mesh = pickingInfo.pickedMesh;
    var itemInfo = this.getItemOptionsFromMesh( mesh );
    var name = itemInfo.egoName || mesh.name;

    if ( hoveredMesh !== mesh ) {
      this.setMeshOutline( mesh );
    }

    getTooltip().set( "meshHover", name, "fa-picture-o", "Click to Manage", curMousePos.x, curMousePos.y );
  },

  clearMeshOutline ( mesh ) {
    var groupedMeshes = this.getGroupedMeshesFromMesh( mesh );

    for ( let i = 0; i < groupedMeshes.length; ++i ) {
      groupedMeshes[ i ].renderOutline = false;
    }
  },

  setMeshOutline ( mesh ) {
    let hoveredMesh = this.attr( "hoveredMesh" );

    if ( hoveredMesh ){
      this.clearMeshOutline( hoveredMesh );
    }

    var groupedMeshes = this.getGroupedMeshesFromMesh( mesh );

    for ( let i = 0; i < groupedMeshes.length; ++i ) {
      let curMesh = groupedMeshes[ i ];
      curMesh.renderOutline = true;
      curMesh.outlineColor = new BABYLON.Color3( 0.3359375, 0.6640625, 0.8046875 ); // rgb( 86, 170, 206 )
      curMesh.outlineWidth = 0.025;
    }

    this.attr( "hoveredMesh", mesh );
  },

  getTagValue ( mesh, tag ) {
    var tags = Object.keys( mesh._tags || {} );
    var lookFor = tag.toLowerCase() + "_";
    var value = "";

    for ( let i = 0; i < tags.length; i++ ) {
      let curTag = tags[ i ];
      if ( curTag.toLowerCase().indexOf( lookFor ) === 0 ) {
        value = curTag.replace( new RegExp( "^" + lookFor, "i" ), "" );
        break;
      }
    }

    return value;
  },

  addToObjDirLightShadowGenerator ( mesh ) {
    this.attr( "objDirLightShadowGen" ).getShadowMap().renderList.push( mesh );
  },

  // Note: If more materials are needed to be unfrozen then a list / flag should be used
  /**
   * Freeze all materials except the skydome material
   */
  freezeMaterials(){
    let materials = this.attr("scene").materials;
    const skydomeMaterial = this.attr("skydomeMaterial");

    for (let i = 0; i < materials.length; ++i){
      let material = materials[i];
      if (material !== skydomeMaterial){
        material.freeze();
      }
    }
  },

  freezeShadowCalculations () {
    this.attr( "objDirLightShadowGen" ).getShadowMap().refreshRate = 0;
    this.updateShadowmap = false;
  },

  unfreezeShadowCalculations () {
    let shadowmap =  this.attr( "objDirLightShadowGen" ).getShadowMap();

    // Only do this once
    if (shadowmap.refreshRate === 0){
      shadowmap.refreshRate = 1;

      // After the shadowmap as updated then freeze it again
      let onAfterRender = () => {
        shadowmap.onAfterRenderObservable.remove( observer );
        // Now freeze the shadows again
        this.freezeShadowCalculations();
      };
      // Get the observer reference so it can be removed after the render
      let observer = shadowmap.onAfterRenderObservable.add( onAfterRender );
    }
  },

  initLights () {
    var scene = this.attr( "scene" );

    //This creates a light, aiming 0,1,0 - to the sky.
    var hemisphericLight = new BABYLON.HemisphericLight( "light1", new BABYLON.Vector3( 0, 1, 0 ), scene );
    hemisphericLight.groundColor = new BABYLON.Color3( 1, 1, 1 );
    hemisphericLight.intensity = 0.85;

    var mainObjectDirLight = new BABYLON.DirectionalLight( "dirlight1", new BABYLON.Vector3( 0, -1, 0 ), scene );

    var objDirLightShadowGen = new BABYLON.ShadowGenerator( 1024, mainObjectDirLight );
    objDirLightShadowGen.setDarkness( 0 );
    objDirLightShadowGen.bias *= 0.05;

    this.attr({
      hemisphericLight,
      mainObjectDirLight,
      objDirLightShadowGen
    });
  },

  initScene () {
    var scene = this.attr( "scene" );
    scene.clearColor = new BABYLON.Color3( 1, 1, 1 );

    // Gravity & physics stuff
    var physicsPlugin = new BABYLON.CannonJSPlugin();
    var gravityVector = new BABYLON.Vector3( 0, -9.81, 0 );

    scene.enablePhysics( gravityVector, physicsPlugin );
    scene.gravity = gravityVector;
    scene.collisionsEnabled = true;
    scene.workerCollisions = false;

    var camera = this.initCamera();
  },

  roomInfo ( uroomID ) {
    var homeLoad = this.attr( "homeLoad" );
    var roomStatus = homeLoad.roomStatus;
    var roomBundles = homeLoad.roomBundles;
    var info = {};
    var goodIf2 = 0;

    for ( let i = 0; i < roomStatus.length; i++ ) {
      if ( roomStatus[ i ].uroomID === uroomID ) {
        info.roomStatus = roomStatus[ i ];
        goodIf2++;
        break;
      }
    }

    if ( !goodIf2 ) {
      return null;
    }

    for ( let i = 0; i < roomBundles.length; i++ ) {
      if ( roomBundles[ i ].roomID === info.roomStatus.roomID ) {
        info.roomBundle = roomBundles[ i ];
        goodIf2++;
        break;
      }
    }

    if ( goodIf2 !== 2 ) {
      return null;
    }

    return info;
  },

  roomAssetURL ( uroomID ) {
    var roomInfo = this.roomInfo( uroomID );

    return roomInfo ? roomInfo.roomBundle.roomAssetURL : "";
  },

  loadTextures ( arrayOfLoadedAssets ) {
    var scene = this.attr( "scene" );
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

  getItemFromMesh ( mesh ) {
    return mesh && mesh.__itemRef || {};
  },

  getItemOptionsFromMesh ( mesh ) {
    var item = this.getItemFromMesh( mesh );
    return item && item.options || {};
  },

  getGroupedMeshesFromMesh ( mesh ) {
    var item = this.getItemFromMesh( mesh );
    return item && item.meshes || [ mesh ];
  },

  /**
   * Get the rootMesh for a mesh. Recursively go through all parents until root parent.
   * @param a_mesh
   * @returns {*}
   */
  getRootMesh(a_mesh ){
    let parent = a_mesh.parent || a_mesh;
    while (parent.parent){
      parent = parent.parent;
    }
    return parent;
  },

  /**
   * Get the root item from a group of items.
   * So if you do getRootItem( item ) and it has a parent you'll get the parent item instead of input item.
   * @param a_item
   * @returns EgowallItem
   */
  getRootItem ( a_item ){
    const rootMesh = this.getRootMesh(a_item.rootMeshes[0]);
    return rootMesh.__itemRef;
  },

  isMeshFurnitureItem ( mesh ) {
    var itemOptions = this.getItemOptionsFromMesh( mesh );
    return itemOptions && itemOptions.furnArg && anyTruthy( itemOptions.furnArg );
  },

  isMeshEgoObj ( mesh ) {
    var itemOptions = this.getItemOptionsFromMesh( mesh );
    return itemOptions && ( itemOptions.egoID ? true : false );
  },

  setMeshLocationFromAjaxData ( rootMeshes, info, isPainting ) {
    const pos = info.position || {};
    const rot = info.rotation || {};

    const posX = parseFloat( pos.x ) || 0;
    const posY = parseFloat( pos.y ) || 0;
    const posZ = parseFloat( pos.z ) || 0;

    const rotX = parseFloat( rot.x ) || 0;
    const rotY = parseFloat( rot.y ) || 0;
    const rotZ = parseFloat( rot.z ) || 0;
    const rotW = parseFloat( rot.w ) || 0;

    for (let i = 0; i < rootMeshes.length; ++i){
      let rootMesh = rootMeshes[i];
      rootMesh.position.x = posX;
      rootMesh.position.y = posY;
      rootMesh.position.z = posZ;

      // If no rotationQuaternion exists then create an identity quaternion
      if (!rootMesh.rotationQuaternion){
        rootMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
      }

      rootMesh.rotationQuaternion.x = rotX;
      rootMesh.rotationQuaternion.y = rotY;
      rootMesh.rotationQuaternion.z = rotZ;
      rootMesh.rotationQuaternion.w = rotW;

      // To currently show the paintings before they get the rotation from the walls
      if (isPainting){
        // rootMesh.rotation.y = Math.PI;
        // rootMesh.rotation.x = Math.PI / -2;
        rootMesh.rotationQuaternion.multiplyInPlace( BABYLON.Quaternion.RotationYawPitchRoll(0, Math.PI * 1.5, Math.PI ) );
      }
    }
  },

  setEgoObjectDetails ( mesh, itemInfo ) {
    // var itemInfo = this.getItemOptionsFromMesh( mesh );

    var meshName = mesh.material && mesh.material.name || "";

    if ( meshName === "ImagePlane" ) {
      let mat = mesh.material.subMaterials[ 0 ];
      mesh.material = mat.clone(); 
      mesh.material.diffuseTexture = new BABYLON.Texture( itemInfo.egoAlbumURL, this.attr( "scene" ) );
      // Make the imageplane a bit backlit. Numbers need tweaking for desired backlitness
      mesh.material.emissiveColor = new BABYLON.Color3( 0.2, 0.2, 0.2 );
    } else if ( meshName == "ImageBacker" ) {
      let mat = mesh.material.subMaterials[ 0 ];
      mat.diffuseTexture = null;
      mat.diffuseColor = new BABYLON.Color3( 1, 1, 1 );
    }
  },

  meshesLoaded ( itemInfo, babylonName, meshes ) {
    var item = {
      // Children items, what items should have same changes done as this item
      children: [],
      name: babylonName,
      options: itemInfo,
      meshes: [],
      // RootMeshes to easily update all positions when moving an item
      rootMeshes: [],
      // The parent item of this item.
      parent:null
    };

    // rootMeshes hashmap to check if already added
    let rootMeshes = {};
    const isTerrain = itemInfo.terrain;


    // This adds the _cid which is our uniqueId for an EgowallItem
    this.attr("items").push( item );
    // Update the item reference since canjs created a new object?
    item = this.attr("items")[ this.attr("items").length -1 ];

    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[ i ];

      let positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
      if ( !positions ) {
        continue;
      // If the mesh isn't a mesh group then add it to meshes[]
      } else {
        item.meshes.push( mesh );
      }

      mesh.name = itemInfo.furnName || mesh.name;

      mesh.receiveShadows = true;

      if ( !isTerrain ) {
        // Check if painting
        if ( itemInfo.egoID ){
          this.setEgoObjectDetails( mesh, itemInfo );
        }

        mesh.checkCollisions = true;
        mesh.receiveShadows = true;
        // Temporary, should be set from collisions.babylon
        this.collisionMeshes.push( mesh);
        this.addToObjDirLightShadowGenerator( mesh );

        let parent = this.getRootMesh( mesh );
        // Check if rootMesh has already been added
        if (!rootMeshes[ parent.id ]){
          rootMeshes[ parent.id ] = true;
          item.rootMeshes.push( parent );
        }
      }
      // Turn off collision & receiveShadows for terrain
      else{
        mesh.checkCollisions = false;
        mesh.receiveShadows = false;
        // Add the mesh to terrainMeshes to later in applyTerrainLightmap() foreach to setup the lightmap materials
        this.attr("terrainMeshes").push(mesh);
      }

      if ( parseInt( itemInfo.furnPhysics, 10 ) ) {
        //vm.testSetPhysicsImpostor( mesh );
      }
    }

    // Check if rootMeshes.length > 0 which it is unless it's terrain
    if (item.rootMeshes.length > 0){
      // For paintings get itemInfo.roomInfo
      // For furniture just itemInfo is fine
      const info = itemInfo.egoID ? itemInfo.roomInfo : itemInfo;
      // Set the position for all rootMeshes and rotation
      this.setMeshLocationFromAjaxData( item.rootMeshes, info, !!itemInfo.egoID );
    }

    // Need to do this after the meshes loop because for the paintings it doesn't work inside the loop.
    for ( let i = 0; i < meshes.length; ++i ) {
      // Add itemRef to all meshes except terrain.
      // Could do this in mainloop too but the mainloop stops for these meshes   if ( !positions )
      if (!isTerrain){
        meshes[i].__itemRef = item;
      }
      meshes[i].freezeWorldMatrix();
    }
  },

  loadModels ( arrayOfLoadedAssets ) {
    var scene = this.attr( "scene" );

    for ( let i = 0; i < arrayOfLoadedAssets.length; i++ ) {
      let assetInfo = arrayOfLoadedAssets[ i ];
      let unzippedAssets = assetInfo.unzippedFiles;
      let len = unzippedAssets.length;
      let babylon = len && unzippedAssets[ len - 1 ];
      if ( babylon && babylon.type === "babylon" ) {
        // is a babylon file that's been unpacked
        let meshesLoadedBound = this.meshesLoaded.bind( this, assetInfo, babylon.name );
        BABYLON.SceneLoader.ImportMesh( "", "", "data:" + babylon.data, scene, meshesLoadedBound );
      }
    }

    return arrayOfLoadedAssets;
  },

  loadFurnitures ( roomFurnitures ) {
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
      this.loadTextures.bind( this )
    );

    return materials.then(()=>{
      return furnitures.then(
        this.loadModels.bind( this )
      );
    });
  },

  loadEgoObjects ( egoObjects ) {
    var egoPromises = [];
    var matPromises = [];

    for ( let i = 0; i < egoObjects.length; i++ ) {
      let egoObj = egoObjects[ i ];
      egoObj.assetID = egoObj.assetID || egoObj.egoID;

      egoObj.assetURL = egoObj.roomInfo.frameURL.replace( ".unity3d", "_LOD0.zip" );
      egoPromises.push( Asset.get( egoObj ) );

      egoObj.textureAsset = new can.Map({
        assetURL: egoObj.roomInfo.frameURL.replace( ".unity3d", "_Tex0.zip" )
      });
      matPromises.push( Asset.get( egoObj.textureAsset ) );
    }

    var egoObjectProms = Promise.all( egoPromises );

    var materials = Promise.all( matPromises ).then(
      this.loadTextures.bind( this )
    );

    return materials.then(()=>{
      return egoObjectProms.then(
        this.loadModels.bind( this )
      );
    });
  },

  loadTerrain ( terrainURL ) {

    var terrain = new can.Map({
      terrain: true,
      assetID: -222,
      assetURL: terrainURL
    });
    var terrainProm = Asset.get( terrain );

    // Promise.all here just because loadTextures expects array of loaded assets
    return Promise.all( [ terrainProm ] ).then(
      this.loadTextures.bind( this )
    ).then(
      this.loadModels.bind( this )
    );
  },

  roomLoad ( uroomID ) {
    var vm = this;

    // furniture & placement info
    var roomsPromise = Rooms.get({
      requestType: "roomLoad",
      format: "json",
      uroomID: uroomID
    });

    vm.attr( "roomsPromise", roomsPromise );

    return roomsPromise.then( ( roomLoad ) => {
      var furnProm = vm.loadFurnitures( roomLoad.furnitures );
      var egoProm = null;

      if ( roomLoad.egoObjects && roomLoad.egoObjects.length ) {
        // TODO: figure out why on earth the coords/rotations for these are rotated +/- 90deg about z axis of the whole scene
        egoProm = vm.loadEgoObjects( roomLoad.egoObjects );
      }

      var proms = [ furnProm ];
      if ( egoProm ) {
        proms.push( egoProm );
      }
      return Promise.all( proms );
    });
  },

  //TODO: this may not be a thing we need if dependencies are properly defined somewhere we haven't located 
  alwaysLoadTheseMaterialConstants ( cacheUrls, neededMaterialsPromises ) {
    var ids = [ "87", "17" ];
    var materialConstants = this.attr( "materialConstants" );

    for ( let i = 0; i < ids.length; i++ ) {
      let materialID = { materialID: ids[ i ] };
      let matConst = _find( materialConstants, materialID );
      // TODO: replacement here is not finalized
      let materialURL = matConst.materialURL.replace( ".unity3d", "_Tex1.zip" );

      if ( !cacheUrls[ materialURL ] ) {
        cacheUrls[ materialURL ] = true;
        matConst.attr({
          "assetID": materialURL,
          "assetURL": materialURL
        });

        neededMaterialsPromises.push( Asset.get( matConst ) );
      }
    }
  },

  loadAllNeededMaterialConstants ( meshes ) {
    var materialConstants = this.attr( "materialConstants" );
    /**
     *  meshes = [
     *    {
     *      "meshID": "1",
     *      "materialID": "43"
     *    }
     *  ];
     *
     *  materialConstants = [
     *    {
     *      "categoryID": "1",
     *      "materialID": "2",
     *      "materialName": "Arches",
     *      "internalName": "ArchWay_001",
     *      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/ArchWay_001.unity3d",
     *      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/ArchWay_001.png",
     *      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/ArchWay_001.png"
     *    }
     *  ];
     *
     */

    var neededMaterialsPromises = [];
    var cacheUrls = {};

    for ( let i = 0; i < meshes.length; i++ ) {
      let materialID = { materialID: meshes[ i ].materialID };
      let matConst = _find( materialConstants, materialID );
      // TODO: replacement here is not finalized
      let materialURL = matConst.materialURL.replace( ".unity3d", "_Tex1.zip" );

      if ( !cacheUrls[ materialURL ] ) {
        cacheUrls[ materialURL ] = true;
        matConst.attr({
          "assetID": materialURL,
          "assetURL": materialURL
        });

        neededMaterialsPromises.push( Asset.get( matConst ) );
      }
    }
    this.alwaysLoadTheseMaterialConstants( cacheUrls, neededMaterialsPromises );

    return Promise.all( neededMaterialsPromises ).then( ( loadedOnes ) => {
      //replace the 'loadedOnes' with their materialConstants[] counterpart
      //TODO: figure out why these instances aren't automatically joined
      for ( let i = 0; i < loadedOnes.length; i++ ) {
        let materialID = loadedOnes[ i ].materialID;
        let sourceMat = _find( materialConstants, { materialID } );
        loadedOnes[ i ] = sourceMat;
      }
      return loadedOnes;
    }).then(
      this.loadTextures.bind( this )
    );
  },

  createMaterial ( materialName, unzippedTextures ) {
    var scene = this.attr( "scene" );
    var material = new BABYLON.StandardMaterial( materialName, scene );

    for ( let i = 0; i < unzippedTextures.length; i++ ) {
      let info = unzippedTextures[ i ];
      if ( info.type !== "texture" ) {
        continue;
      }
      if ( /_Diff\.png/i.test( info.name ) ) {
        material.diffuseTexture = info.instance;
      } else { // if ( /_Nrml\.png/i.test( info.name ) ) {
        material.bumpTexture = info.instance;
      }
    }

    material.specularColor = new BABYLON.Color3( 0, 0, 0 );

    return material;
  },

  // TODO: we probably shouldn't need this - gotta figure out where the info comes from
  testHardcodedMaterials ( mesh ) {
    var materialConstants = this.attr( "materialConstants" );
    var name = mesh.name.replace( /[^a-z]/gi, "" ).toLowerCase();
    var parentName = mesh.parent && mesh.parent.name || "";

    if ( name === "glassin" || name === "glassout" ) {
      mesh.visibility = 0;
      mesh.__backgroundMeshInfo.materialID = "";

    } else if ( name === "windowframe" || parentName === "doorframe" ) {
      // Tile - Concrete
      let matConst = _find( materialConstants, { materialID: "87" } );
      mesh.material = matConst.instance.clone();
      mesh.material.diffuseColor = new BABYLON.Color3( 0.1, 0.1, 0.1 );
      mesh.__backgroundMeshInfo.materialID = "87";

    } else if ( parentName === "balconylod" ) {
      // Concrete_006 ( 17 )
      let matConst = _find( materialConstants, { materialID: "17" } );
      mesh.material = matConst.instance.clone();
      mesh.__backgroundMeshInfo.materialID = "17";

    }
  },

  bgMeshSetMaterial ( mesh, roomInfo ) {
    var materialConstants = this.attr( "materialConstants" );

    var meshID = this.getTagValue( mesh, "meshID" );
    var parentBabylonName = ( mesh.parent && mesh.parent.name || "" ).toLowerCase();

    var rs = roomInfo.roomStatus || {};
    var key = ( rs.roomTypeName || "" ).replace( /[^a-z]/gi, "" ).toLowerCase();

    mesh.__backgroundMeshInfo = {
      meshID: meshID,
      parentBabylonName: parentBabylonName,
      ajaxInfo: {},
      materialID: ""
    };

    if ( mesh.material ) {
      mesh.material.dispose();
    }

    this.attr( "bgMeshes" ).push( mesh );

    if ( key && parentBabylonName && parentBabylonName.indexOf( key ) > -1 ) {
      //This mesh is in of the room
      let ajaxInfo = _find( rs.meshes || [], { meshID: meshID } ) || {};
      let materialID = ajaxInfo.materialID || "";
      let matConst = _find( materialConstants, { materialID } );

      mesh.__backgroundMeshInfo.ajaxInfo = ajaxInfo;
      mesh.__backgroundMeshInfo.materialID = materialID;

      mesh.material = matConst.instance.clone();

    } else {
      this.testHardcodedMaterials( mesh );
    }

    if ( mesh.material ) {
      // Check if lightmap tag exists for the mesh
      const lightmapId = this.getTagValue( mesh, "lightmap" );
      if(lightmapId !== ""){
        // Try and get the lightmap for that id and then set it
        const lightmap = this.attr( "lightmaps" )[ lightmapId ];
        if ( lightmap ){
          mesh.material.ambientTexture = lightmap;
        }
      }

      // Check if the diffuseColor should be something else than white (1, 1, 1)
      if (mesh.__backgroundMeshInfo.ajaxInfo.color ) {
        let ajaxColor = mesh.__backgroundMeshInfo.ajaxInfo.color;
        let r = parseFloat(ajaxColor.r);
        let g = parseFloat(ajaxColor.g);
        let b = parseFloat(ajaxColor.b);
        let a = parseFloat(ajaxColor.a);
        mesh.material.diffuseColor = new BABYLON.Color4(r, g, b, a);
      }
    }

    // TODO: make our own .mtl info and bundle it with the textures to set uv scales
    if ( false && mesh.material ) {
      const uScale = 0.19995;
      const vScale = 0.225;

      if ( mesh.material.diffuseTexture ) {
        mesh.material.diffuseTexture.uScale = uScale;
        mesh.material.diffuseTexture.vScale = vScale;
      }

      if ( mesh.material.bumpTexture ) {
        mesh.material.bumpTexture.uScale = uScale;
        mesh.material.bumpTexture.vScale = vScale;
      }
    }
  },

  /**
   * The function fixes the UV offset that unity has added in its lightmap.exr file.
   * Unity uses a displacement of 0.5 pixels and I tried 0.5 pixels first but it still had tiny hard surface
   * The magic number for this was 0.75 pixel displacement to fix the livingspace's corners
   */
  bgUpdateLightmapsOffset(){
    let bgMeshes = this.attr("bgMeshes");

    for (let i = 0; i < bgMeshes.length; ++i){
       let material = bgMeshes[i].material;
      if (material && material.ambientTexture){
        // Move the texture 0.75 of a pixel to properly position them.
        // This fixes the wrong corners for the livingspace lightmap
        const size = material.ambientTexture.getBaseSize();
        material.ambientTexture.uOffset = -0.75 / (size.width);
        material.ambientTexture.vOffset = -0.75 / (size.height);
      }
    }
  },

  bgMeshLoaded ( itemInfo, babylonName, meshes ) {
    var uroomID = this.attr( "uroomID" );
    var roomInfo = this.roomInfo( uroomID );

    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[ i ];
      mesh.checkCollisions = true;
      mesh.receiveShadows = true;

      this.collisionMeshes.push( mesh );

      this.bgMeshSetMaterial ( mesh, roomInfo );
    }
  },

  renderBackgroundMesh ( data ) {
    var scene = this.attr( "scene" );
    var arrayOfLoadedMaterials = data[ 0 ];
    var roomMeshSetDef = data[ 1 ];
    var unzippedMeshFiles = roomMeshSetDef.unzippedFiles;

    this.attr( "bgMeshes", [] );

    for ( let i = 0; i < arrayOfLoadedMaterials.length; i++ ) {
      let curMaterial = arrayOfLoadedMaterials[ i ];
      let mat = this.createMaterial( curMaterial.internalName, curMaterial.unzippedFiles );
      curMaterial.attr( "instance", mat );
      //curMaterial.removeAttr( "unzippedFiles" );
    }

    for ( let i = 0; i < unzippedMeshFiles.length; i++ ) {
      let assetInfo = unzippedMeshFiles[ i ];
      if ( assetInfo && assetInfo.type === "babylon" ) {
        // is a babylon file that's been unpacked
        let bgMeshLoadedBound = this.bgMeshLoaded.bind( this, assetInfo, assetInfo.name );
        BABYLON.SceneLoader.ImportMesh( "", "", "data:" + assetInfo.data, scene, bgMeshLoadedBound );
      }
    }
  },

  /**
   * Applies the lightmap material to terrain meshes that uses a lightmap
   * Also sets the attr skydomeMaterial so it can be animated
   */
  applyTerrainMaterials () {
    let meshes = this.attr("terrainMeshes");
    const lightmaps = this.attr("lightmaps");

    let materialGroups = {};

    for (let i = 0; i < meshes.length; ++i){
      let mesh = meshes[i];

      // 1. Check if material exists
      // 2. Check the tags
      // 3. Check if the texture for that lightmap tag exists
      // 4. Check materialId + lightmapId already exists ( If parentId is null then use meshId )
      //    4a. If exists then add mesh to meshes
      //    4b. If not then create new group
      if (mesh.material){
        const lightmapId = this.getTagValue( mesh, "lightmap" );

        if (lightmapId != ""){
          // Check if the lightmap exists as a file
          if (lightmaps[ lightmapId ]){
            // Creates a key like "xxxx-xxxx-xxxx-xxxxxxterrainfloor (GUID + lmId)
            const key = mesh.material.id + lightmapId;
            // If the group already exists then just add the mesh
            if (materialGroups[ key ]){
              materialGroups[ key ].meshes.push( mesh );
            } else {
              // Otherwise create the group
              materialGroups[ key ] = {
                meshes: [ mesh ],
                material: mesh.material,
                // LightmapId is important since the key is materialId + lightmapId
                lightmapId: lightmapId
              };
            }
          }
        }
        // If no lightmap id then check for clouds material
        else if (mesh.material.name === "clouds_1000" ){
          // Unlit texture also don't set diffuseTexture to null because the boolean:
          mesh.material.emissiveTexture = mesh.material.diffuseTexture;
          // Set the skydomeMaterial variable so it can be animated
          this.attr("skydomeMaterial", mesh.material);
        }
      }
    }

    // 1. Check if the material's binded meshes all exist
    // 2. If one binded mesh doesn't exist then the material needs to be cloned
    // 3. If the binded meshes are all in group.meshes then set the lightmap directly without cloning material
    for (const key in materialGroups){
      let group = materialGroups[ key ];
      // The lightmap texture to use
      const lm = lightmaps[ group.lightmapId ];

      let meshes = group.meshes;
      let material = group.material;
      const bindedMeshes = material.getBindedMeshes();

      let needClone = false;
      // Go over all the bindedMeshes and see if they are part of the meshes for this material
      for (let i = 0; i < bindedMeshes.length; ++i){
        let found = false;
        const bindedMesh = bindedMeshes[i];
        // Check if the bindedMesh isn't part of groups.meshes
        // If it's not part of the groups.meshes then the material needs to be cloned as a different lightmap or no lightmap atall is expected
        for (let j = 0; j < meshes.length; ++j){
          if (bindedMesh === meshes[j]){
            found = true;
            break;
          }
        }
        // If no mesh was found then we need to copy the material
        if (!found){
          needClone = true;
          break;
        }
      }
      // Clone the material if needed and set it for all the meshes
      if (needClone){
        material = material.clone();
        material.ambientTexture = lm;
        for (let i = 0; i < meshes.length; ++i){
          meshes[i].material = material;
        }
        // If no cloning use the lightmap directly
      } else {
        material.ambientTexture = lm;
      }
    }

    // Finally remove the array:
    this.attr("terrainMeshes", null);
  },

  loadLightmaps ( lightmapBundleURL ) {
    var lightmapReq = new can.Map({
      lightmap: true,
      assetID: -333,
      assetURL: lightmapBundleURL
    });
    var lightmapProm = Asset.get( lightmapReq );

    return lightmapProm.then(( assetData ) => {
      var scene = this.attr( "scene" );
      var unzippedAssets = assetData.unzippedFiles;

      this.attr("lightmaps", {});

      for ( let x = 0; x < unzippedAssets.length; x++ ) {
        let asset = unzippedAssets[ x ];
        if ( asset.type === "texture" ) {
          // length -4 should cover our usecase but if we change to .jpeg for some reason we need to check the actual extensions length!
          // Example: terrainfloor.png => terrainfloor as key name
          const lmName = asset.name.substring( 0, asset.name.length - 4 );

          let lm = new BABYLON.Texture.CreateFromBase64String( "data:image/png;base64," + asset.data, "lightmap_" + lmName, scene );
          lm.coordinatesIndex = 1;
          this.attr( "lightmaps" )[ lmName ] = lm;
        }
      }
    });
  },

  loadSkybox ( skyboxBundleURL ) {
    var skyboxReq = new can.Map({
      skybox: true,
      assetID: -444,
      assetURL: skyboxBundleURL
    });
    var skyboxProm = Asset.get( skyboxReq );

    return skyboxProm.then(( assetData ) => {
      var scene = this.attr( "scene" );
      var unzippedAssets = assetData.unzippedFiles;
      var skybox = BABYLON.Mesh.CreateBox( "skyBox", 1000, scene );
      this.attr( "skybox", skybox );

      var allURLs = []; // [_px.jpg, _py.jpg, _pz.jpg, _nx.jpg, _ny.jpg, _nz.jpg];
      var skyboxTextures = {};
      var skyboxJSON = null;

      for ( let x = 0; x < unzippedAssets.length; x++ ) {
        let asset = unzippedAssets[ x ];
        if ( asset.type === "texture" ) {
          skyboxTextures[ asset.name ] = asset.data;
        } else if ( asset.type === "json" ) {
          skyboxJSON = asset.data;
        }
      }

      allURLs[ 0 ] = skyboxTextures[ skyboxJSON.px ];
      allURLs[ 1 ] = skyboxTextures[ skyboxJSON.py ];
      allURLs[ 2 ] = skyboxTextures[ skyboxJSON.pz ];
      allURLs[ 3 ] = skyboxTextures[ skyboxJSON.nx ];
      allURLs[ 4 ] = skyboxTextures[ skyboxJSON.ny ];
      allURLs[ 5 ] = skyboxTextures[ skyboxJSON.nz ];

      var skyboxMaterial = new BABYLON.StandardMaterial( "skyBox", scene );
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture( "data:image/png;base64,", scene, allURLs );
      skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3( 0, 0, 0 );
      skyboxMaterial.specularColor = new BABYLON.Color3( 0, 0, 0 );

      skybox.material = skyboxMaterial;

      return assetData;
    });
  },

  homeLoad ( homeID, time ) {
    var vm = this;

    var homesPromise = Homes.get({
      requestType: "homeLoad",
      format: "json",
      homeID: homeID,
      time: time
    });

    vm.attr({
      "homesPromise": homesPromise,
      "homeLoadFinished": false
    });

    return homesPromise.then( ( homeLoad ) => {

      if ( homeLoad.skyboxes && homeLoad.skyboxes.skyboxAssetURL ) {
        vm.loadSkybox( homeLoad.skyboxes.skyboxAssetURL );
      }

      var uroomID = homeLoad.defaultRoomID; //"659"
      vm.attr({
        "uroomID": uroomID,
        "homeLoad": homeLoad
      });

      var terrainProm = vm.loadTerrain( homeLoad.terrainURL );

      var meshes = vm.roomInfo( uroomID ).roomStatus.meshes;
      vm.attr( "bgMeshesAjaxInfo", meshes );

      var materialsLodedProm = vm.attr(
        "materialConstantsPromise"
      ).then(
        vm.loadAllNeededMaterialConstants.bind( vm, meshes )
      );

      var lightmapsProm = vm.loadLightmaps( homeLoad.lightmaps.lightmapAssetURL );

      var roomAssetURL = vm.roomAssetURL( uroomID );
      //TODO: use real roomAssetURL to load the backgroundMesh or change service
      let livingSpaceID = homeLoad.livingSpaceID;
      roomAssetURL = "https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles/Home/LS_" + livingSpaceID + "_test.zip";
      var setDef = new Map({ assetID: roomAssetURL, assetURL: roomAssetURL });
      var roomMeshProm = Asset.get( setDef );
      
      var beforeBGMeshRenderProms = Promise.all( [ materialsLodedProm, roomMeshProm, lightmapsProm ] );
      
      return beforeBGMeshRenderProms.then(
        // load the background mesh in babylon
        vm.renderBackgroundMesh.bind( vm )
      ).then(
        // load and place the furniture
        vm.roomLoad.bind( vm, uroomID )
      ).then(( arrOfRoomLoadResults ) => {
        return terrainProm.then(( terrainPromResults ) => {
          vm.applyTerrainMaterials( terrainPromResults );
          vm.attr( "homeLoadFinished", true );
          return { arrOfRoomLoadResults, terrainPromResults };
        });
      });
    });
  },

  toggleBabylonDebugLayer ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
    var scene = this.attr( "scene" );
    var isDebugVisible = scene.debugLayer._enabled;

    if ( isDebugVisible ) {
      scene.debugLayer.hide();
    } else {
      scene.debugLayer.show();
    }
  },

  /**************************************
    Mesh movement functions
   **************************************/
  /**
   * Updates the position of an item by adding the delta movement. So x = 2  means position.x += 2
   * @param {EgowallItem} a_item
   * @param {BABYLON.Vector3} a_positionDelta
   */
  updatePositions(a_item, a_positionDelta){
    for ( let i = 0; i < a_item.rootMeshes.length; ++i){
      let rootMesh = a_item.rootMeshes[i];

      rootMesh.position.addInPlace( a_positionDelta );

      this.updateMeshMatrices( rootMesh );
    }
  },

  /**
   * Update position and rotation of an item
   * @param {EgowallItem} a_item The item to do changes to, changes will affect children automatically
   * @param {BABYLON.Vector3} a_positionDelta How much object has translated
   * @param {BABYLON.Quaternion} a_rotation The delta rotation, could for example be the rotation of a wall.
   */
  updatePositionRotation(a_item, a_positionDelta, a_rotation ){

    for ( let i = 0; i < a_item.rootMeshes.length; ++i){
      let rootMesh = a_item.rootMeshes[i];

      rootMesh.position.addInPlace( a_positionDelta );
      // Use the baseRotation and
      a_rotation.multiplyToRef( a_item.baseRotation, rootMesh.rotationQuaternion );

      // rootMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
      // rootMesh.rotationQuaternion.multiplyInPlace( a_rotation );

      this.updateMeshMatrices( rootMesh );
    }
  },

  /**
   * Updates a root mesh's world matrix and the child meshes' matrices.
   * @param {BABYLON.Mesh} rootMesh
   */
  updateMeshMatrices(rootMesh ){
    let children = rootMesh.getChildMeshes();
    // freezeWorldMatrix re-updates the world matrix so the position is correct
    rootMesh.freezeWorldMatrix();
    for (let i = 0; i < children.length; ++i){
      children[i].freezeWorldMatrix();
    }
    // Finish by telling shadowmap it needs to update
    this.updateShadowmap = true;
  },

  /***************************************
   * Parent & Child relations
   ***************************************/
  /**
   * Adds the parent to an item and if the item already had a parent then the item removes itself as a child from the old parent.
   * @param {EgowallItem} a_item
   * @param {EgowallItem} a_parent
   */
  addItemParent(a_item, a_parent ){
    if (a_item.parent){

      if (a_parent == null){
        this.removeChild( a_item );
      }
      else if ( a_item.parent !== a_parent ){
        this.removeChild( a_item );
        this.setItemParent( a_item, a_parent );
      }
      // Do nothing for same reference
    }
    else{
      if (a_parent){
        this.setItemParent( a_item, a_parent );
      }
    }
  },

  /**
   * Sets the parent and sets position & rotation correctly
   * @param {EgowallItem} a_item
   * @param {EgowallItem} a_parent
   */
  setItemParent(a_item, a_parent ){
    a_item.parent = a_parent;
    a_parent.children.push( a_item );

    let tmpVector = BABYLON.Tmp.Vector3[8];
    // Stores the inverse parent quaternion
    let tmpQuat = BABYLON.Tmp.Quaternion[0];
    for ( let i = 0; i < a_item.rootMeshes.length; ++i ){
      let rootMesh = a_item.rootMeshes[i];
      // Copy the current absolute position before adding the parent
      tmpVector.copyFrom(rootMesh.getAbsolutePosition());

      rootMesh.parent = a_parent.rootMeshes[0];

      const parentQuaternion = rootMesh.parent.rotationQuaternion;
      // Clone the parentInitialRotation to later multiply with the child when splitting.
      a_item.parentInitialRotation = parentQuaternion.clone();
      // Inverse it
      tmpQuat.copyFromFloats( -parentQuaternion.x, -parentQuaternion.y, -parentQuaternion.z, parentQuaternion.w );

      // We need to add the inverse quaternion to remove the rotation of the parent.
      // Else the rotation is very off!
      tmpQuat.multiplyToRef(rootMesh.rotationQuaternion, rootMesh.rotationQuaternion);
      // We need to use absolute position because the position gets really wrong after adding the the parent
      // My guess is the poseMatrix changes the local space
      rootMesh.setAbsolutePosition( tmpVector );
    }
  },

  /**
   * Removed the parent and sets the proper positions again
   * Cleanup code when removing a child from an item
   * @param {EgowallItem} child
   */
  removeChild( child ){
    let parent = child.parent;
    if (parent){
      let found = false;
      for (let i = 0; i < parent.children.length; ++i){
        if (parent.children[i] === child){
          parent.children.splice(i, 1);
          found = true;
          break;
        }
      }

      if (found){
        child.parent = null;

        // Fix positions!
        for (let i = 0; i < child.rootMeshes.length; ++i){
          let rootMesh = child.rootMeshes[i];
          rootMesh.parent = null;
          // Remove parentInitialRotation reduction by multiplying it back
          rootMesh.rotationQuaternion.multiplyInPlace( child.parentInitialRotation );
          // Remove parentInitialRotation
          delete child.parentInitialRotation;
        }
      }
    }
  },

  /***************************************
   * Gravity and furniture collisions
   **************************************/
  //Items affected by gravity
  gravityItems : [],
  // Selected furnitures for example gravity
  selectedFurnitureMeshes: {},
  // The meshes to check against for collision for selectedFurnitureMeshes
  meshesToCheckFurniture: {},

  /**
   * Activate gravity for an item by adding it to the gravityItems list. RenderLoop will now update it's position
   * @param {EgowallItem} a_item
   */
  activateGravity(a_item ){
    this.gravityItems.push ( a_item );
    // TODO: Temporary code to update the position slightly so gravity can be observed.
    // Will later for rotations add a fixed position so it doesn't collide
    // For furniture movement it slightly puts it above ground when moving so it doesn't collide with rugs.
    let tmpVector = BABYLON.Tmp.Vector3[8];
    BABYLON.Vector3.FromFloatsToRef(0, 0.5, 0, tmpVector );
    this.updatePositions(a_item, tmpVector);
  },

  // TODO: Evaluate if deltaY should be a vector incase of objects moving in more directions than just 1.
  /**
   * Adjust the position by using a binary search approach.
   * Start by checking half the value of deltaY and then half from there 5 times reaching 96.875% of a_deltaY
   * If it's not colliding it tries to move closer towards collision
   * @param {EgowallItem} a_item
   * @param {CollisionResult[]} a_collisions
   * @param {float} a_deltaY How much the gravity moved an object since last frame
   */
  adjustCollisionPos(a_item, a_collisions, a_deltaY ){

    // -1 = against gravity
    let direction = -1;

    let tempVec = BABYLON.Tmp.Vector3[7];
    // Need to set x & z to 0 since it's a tmp variable
    tempVec.x = 0;
    tempVec.z = 0;
    let isColliding = true;
    let multiplierValue = 0;

    for (let i = 1; i < 6; ++i){
      // Half the distance until finished!
      // 0.5, 0.75, 0.875, 0.9375, 0.96875
      let multiplier = direction * (1 / Math.pow(2, i));

      multiplierValue += multiplier;

      tempVec.y = a_deltaY * multiplier;

      this.updatePositions(a_item, tempVec);

      isColliding = false;

      // Check all collisions if they still collide or not
      for (let j = 0; j < a_collisions.length; ++j){
        let collision = a_collisions[j];
        if ( collision.furniture.intersectsMesh( collision.hit )){
          isColliding = true;
        }
      }
      // If it's not colliding then try and get closer towards collision
      if (!isColliding){
        // If no collision and moving against gravity start moving towards gravity
        if (direction == -1){
          direction = -direction;
        }
      }
      else{
        // If colliding and direction is going towards gravity
        // Then go against gravity
        if (direction == 1){
          direction = -direction;
        }
      }
    }
  },

  /**
   * Adds the gravity distance to the item and checks for collision
   * @param {EgowallItem} a_item
   * @param {BABYLON.Vector3}a_gravityDistance
   */
  applyGravity( a_item, a_gravityDistance ){
    // Start by adding the gravity distance
    this.updatePositions( a_item, a_gravityDistance );

    // Check collision and get result
    let collisions = this.checkFurnitureCollisions( a_item );
    // If colliding try and figure out where!
    if (collisions.length > 0){
      // Adjust the position by moving object ~6 times to get as near as possible
      this.adjustCollisionPos( a_item, collisions, a_gravityDistance.y );
      // If the collisions is an EgowallItem then add item as child to which had highest count or first occurence if same count
      const parent = this.getParentFromCollisions( collisions );

      // Set a parent for the item
      if (parent){
        this.addItemParent( a_item, parent );
      }
      // Remove this item from having gravity affecting it
      this.removeGravity( a_item );
      return true;
    }

    return false;
  },

  // TODO: Make outline use this function when implemented
  /**
   * Check if the furniture item is colliding with any other mesh.
   * Used by applyGravity
   * @param {EgowallItem} a_item
   * @returns {CollisionResult[]}
   */
  checkFurnitureCollisions( a_item ){
    const id = a_item._cid;
    // Lazy load the array and store until a new selection happens
    if (!this.selectedFurnitureMeshes[ id ]  ){
      // calculate the meshes
      this.selectedFurnitureMeshes[ id ] = this.getChildMeshes( a_item );
    }

    let selectedFurnitureMeshes = this.selectedFurnitureMeshes[ id ];

    // If first time checking meshes
    if (!this.meshesToCheckFurniture[ id ]){
      this.meshesToCheckFurniture[ id ] = this.getCollidableMeshes( selectedFurnitureMeshes, this.collisionMeshes );
    }

    let collidableMeshes = this.meshesToCheckFurniture[ id ];
    // The collisions result,  if empty no collisions occured
    let collisions = [];
    // Go over all collidables
    for (let i = 0; i < collidableMeshes.length; ++i){
      let collidableMesh = collidableMeshes[i];

      for ( let j = 0; j < selectedFurnitureMeshes.length; ++j){
        let furnitureMesh = selectedFurnitureMeshes[j];

        if (furnitureMesh.intersectsMesh( collidableMesh, true )){
          // Add the collision result to collisions array if colliding
          collisions.push( { hit:collidableMesh, furniture: furnitureMesh } );
        }
      }
    }

    return collisions;
  },

  /**
   * Get all childMeshes for an item. Iterating over all rootMeshes and get the childmeshes for those.
   * @param {EgowallItem} a_item
   * @returns {BABYLON.Mesh[]}
   */
  getChildMeshes( a_item ){
    let result = [];

    let rootMeshes = a_item.rootMeshes;
    for ( let i = 0; i < rootMeshes.length; ++i){
      let rootMesh = rootMeshes[i];
      // Add the rootMesh and all children
      result.push( rootMesh, ...rootMesh.getChildMeshes() );
    }

    return result;
  },

  /**
   * Get all collidable meshes for a_selectedMeshes. Basically all the meshes except selectedMeshes
   * @param {BABYLON.Mesh[]} selectedMeshes
   * @param {BABYLON.Mesh[]} collisionMeshes
   */
  getCollidableMeshes(selectedMeshes, collisionMeshes ){

    let collidableMeshes = [];

    for (let i = 0; i < collisionMeshes.length; ++i){
      // Default to canCheck so it's true if no mesh was found
      let canCheck = true;
      let mesh = collisionMeshes[i];
      // Check all selectedMeshes to see if they are equal to mesh
      for (let j = 0; j < selectedMeshes.length; ++j){
        if (mesh === selectedMeshes[j]){
          canCheck = false;
          break;
        }
      }

      // Add it to the cached collidable meshes if it wasn't in selectedMeshes
      if (canCheck){
        collidableMeshes.push(mesh);
      }
    }
    // Set the cache
    return collidableMeshes;
  },

  /**
   * Get the item to be new parent if possible
   * If 2 parents has same count the first one that occured is the parent
   * @param {CollisionResult[]} a_collisions
   */
  getParentFromCollisions(a_collisions){
    // Get count of how often a parent occurs
    let parentCount = {};

    for (let i = 0; i < a_collisions.length; ++i){
      // Get the itemRef
      let itemRef = this.getItemFromMesh( a_collisions[i].hit );
      // If the itemRef isn't empty object
      if (itemRef && Object.keys( itemRef ).length > 0  ){
        if (!parentCount[ itemRef._cid ] ){
          parentCount[ itemRef._cid ] = { count: 0, item: itemRef };
        }

        parentCount[ itemRef._cid ].count++;
      }
    }
    let highestCount = 0;
    let parent = null;
    // Check parents & parentCount
    for (let key in parentCount){
      const count = parentCount[ key ].count;
      // Compare count
      if ( count > highestCount ){
        parent = parentCount[ key ].item;
        highestCount = count;
      }
    }

    return parent;
  },

  /**
   * Remove the item from gravityItems making renderloop stop applying gravity
   * Also attempts to remove cached furniture collision values
   * @param {EgowallItem} a_item
   */
  removeGravity( a_item ){
    for( let i = 0; i < this.gravityItems.length; ++i){
      if (this.gravityItems[i] === a_item ){
        this.gravityItems.splice(i, 1);
      }
    }

    // TODO: Change so it tries to remove selectedFurnitureMeshes since that is useful for outline functionality aswell.
    // Remove the cached meshes & collision meshes arrays when removing gravity
    const id = a_item._cid;
    if (this.selectedFurnitureMeshes[ id ]){
      delete this.selectedFurnitureMeshes[ id ];
    }
    if ( this.meshesToCheckFurniture[ id ] ){
      delete this.meshesToCheckFurniture[ id ];
    }
  },


  /***************************************
   Temporary functions
   **************************************/

  /*******
   * SelectedItem stuff
   *******/
  selectedItem: null,
  selectedItemPos: null,
  /**
   * The picking when cursor is moved
   * @param {Vector2} a_mousePos
   */
  selectedItemMovePicking(a_mousePos){
    let selectedItem = this.selectedItem;

    const pickingResult = this.getPickingFromMouse( a_mousePos, ( hitMesh ) => {

      let itemRef = hitMesh.__itemRef;
      // 1. Don't return a hit for the same item
      if (itemRef){
        // Note: Reason for checking rootItems is to know if you're comparing the same group or not

        // Change itemRef to the rootItem to compare
        itemRef = this.getRootItem( itemRef );
        // If __itemRef exists and isn't the selected item then return true!
        if (itemRef !== this.getRootItem( selectedItem )){
          return true;
        }
      }
      else {
        let backgroundRef = hitMesh.__backgroundMeshInfo;
        // If the backgroundMeshInfo exists then it's a background mesh and return true!
        if (backgroundRef){
          return true;
        }
      }
      return false;
    });

    if (pickingResult.hit){
      this.moveRotateSelectedItem( selectedItem, pickingResult );
    }
  },

  /**
   * Calculate the new position and rotation for a selectedItem based off the pickingResult
   * @param {EgowallItem} selectedItem
   * @param {BABYLON.PickingInfo}pickingResult
   */
  moveRotateSelectedItem( selectedItem, pickingResult){
    /*
     BABYLON.Tmp.Vector indices:
     8: deltaPosition
     7: Axis for rotation

     Babylon.Tmp.Quaternion indices:
     0: Quaternion for y == 1 || -1
     */
    // Can use the first rootMesh to calculate how much the object has to move
    // TODO: Evaluate if center between two rootMeshes would be neccesary for proper position
    let rootMesh = selectedItem.rootMeshes[0];
    // Need to get world normal or the wall rotation calculation is wrong.
    const normal = pickingResult.getNormal(true);
    let tmpPositionDelta = BABYLON.Tmp.Vector3[8];

    pickingResult.pickedPoint.subtractToRef(rootMesh.position, tmpPositionDelta );

    let doRotation = true;
    const lastSurfaceNormal = selectedItem.lastSurfaceNormal;
    // TODO: Evaluate if upvector of selectedItem should also be checked
    if (lastSurfaceNormal){
      if (lastSurfaceNormal.x === normal.x && lastSurfaceNormal.y === normal.y && lastSurfaceNormal.z === normal.z){
        doRotation = false;
      }
    }
    // For now store the normal to not redo rotations if same normal as last time
    selectedItem.lastSurfaceNormal = normal;
    // If there is no need to do rotation then
    if (!doRotation){
      // pickingResult.pickedPoint.subtractToRef(rootMesh.position, tmpPositionDelta );
      this.updatePositions( selectedItem, tmpPositionDelta);

      console.log("not doing rotations");

    } else {

      const upVector = this.upVector3;

      // TODO: Check if normal is the same as last time because if it is there is no need to update rotation
      // Only position is neccesary to update then.
      let wallRotation;

      // For normal.y = 1 return identity quaternion
      if (normal.y === 1){
        wallRotation = BABYLON.Tmp.Quaternion[0].copyFromFloats(0, 0, 0, 1);
      }
      // For normal.y == 1 then return a quaternion to turn it upside down
      else if (normal.y === -1){
        wallRotation = BABYLON.Tmp.Quaternion[0].copyFromFloats(0, 0, 1, 0);
      }
      else {
        let tmpAxis = BABYLON.Tmp.Vector3[7];
        // Axis is [ 0, 0, 0 ] for y == 1 and y == -1
        BABYLON.Vector3.CrossToRef(upVector, normal, tmpAxis );
        tmpAxis.normalize();
        const angle = Math.acos(BABYLON.Vector3.Dot(upVector, normal));
        // TODO: in Babylon 2.5 change to use RotationAxisToRef
        // This normalizes tmpAxis
        wallRotation = BABYLON.Quaternion.RotationAxis( tmpAxis, angle);
        wallRotation.normalize();
      }

      this.updatePositionRotation( selectedItem, tmpPositionDelta, wallRotation );
    }
  },
  /**
   * Unselect the selected item and do cleanup
   */
  unselectItem(){
    let item = this.selectedItem;
    if (item){
      this.selectedItem = null;

      this.unsetHoveredMesh();

      this.activateGravity( item );
    }
  },
  // Constant stored for the upVector
  upVector3: BABYLON.Vector3.Up(),

  /**
   * Sets the base rotation of an object before moving.
   * @param a_item
   */
  setBaseRotation( a_item ){
    a_item.baseRotation = a_item.rootMeshes[0].rotationQuaternion.clone();
  }

});

export const controls = {
  "name": "game-canvas",
  "context": null,
  "keypress": {
    "`": "toggleBabylonDebugLayer",
    // Temporary until Escape works
    "v": "unselectItem"
  },
  "click": {
    "Left" ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {

      // Temporary solution that needs improving once adding more of the features from unity app
      if ( this.attr( "hoveredMesh" )) {
        // don't execute camera click on ground
        $ev.controlPropagationStopped = true;
        this.selectedItem = this.attr("hoveredMesh").__itemRef;

        if (this.selectedItem.parent){
          this.removeChild( this.selectedItem )
        }

        // Clone the reference because otherwise it'd get updated when changes are done to the selectedItem
        this.setBaseRotation( this.selectedItem );
      }
    }
  },
  "mousemove": {
    "*": "pickingEvent"
  }
};

export default Component.extend({
  tag: 'babylon-canvas',
  viewModel: ViewModel,
  template,
  events: {
    init () {
      // have to dump it to global for one tiny detail when loading custom PBR materials ( PBR = Physically Based Rendering )
      window.BABYLON = BABYLON; // see babylon.max.js@4450 - Tools.Instantiate
      var vm = this.viewModel;
      vm.attr( "$el", this.element );

      var constantsPromise = Constants.get({
        requestType: "materialList",
        format: "json"
      }).then( ( materialConstantsResp ) => {
        var statusInfo = materialConstantsResp.statusInfo || {};
        if ( statusInfo.isError ) {
          if ( statusInfo.errorCat === 1 && !statusInfo.silentError ) {
            // not logged in
            alert( statusInfo.errorMessage + "\n\nPlease log in at https://testing.egowall.com/" );
          } else {
            alert( statusInfo.errorMessage );
          }
        }
        //TODO: handle the rest of materialConstantsResp.statusInfo
        var materialConstants = materialConstantsResp.attr( "materials" );
        vm.attr( "materialConstants", materialConstants );
        return materialConstants;
      });

      vm.attr( "materialConstantsPromise", constantsPromise );
    },
    inserted () {
      var vm = this.viewModel;
      var canvas = this.element.find( "canvas" )[ 0 ];
      var engine = new BABYLON.Engine( canvas, true );
      var scene = new BABYLON.Scene( engine );
      vm.attr({
        "canvas": canvas,
        "engine": engine,
        "scene": scene
      });

      vm.initScene();

      vm.homeLoad( 1083, 110000 );

      vm.initLights();

      var renderCount = 0;
      engine.runRenderLoop(function () {
        // Convert deltaTime from milliseconds to seconds
        const deltaTime = engine.deltaTime / 1000;

        vm.attr({
          "deltaTime": deltaTime,
          "renderCount": renderCount
        });

        // Animate the skydome by moving the clouds slowly
        let skydomeMaterial = vm.attr("skydomeMaterial");
        if ( skydomeMaterial ){
          // Moving the cloud 1 cycle over 400 seconds
          skydomeMaterial.diffuseTexture.uOffset += deltaTime * 0.0025;
        }

        let gravityItems = vm.attr("gravityItems");
        if (gravityItems.length > 0){
          /*
           BABYLON.Vector3.Tmp usage:
           8: Gravity delta movement
           7: By adjustCollisionPos
           */
          BABYLON.Vector3.FromFloatsToRef(0, scene.gravity.y * deltaTime, 0, BABYLON.Tmp.Vector3[8]);
          let gravityDistance = BABYLON.Tmp.Vector3[8];

          for ( let i = 0; i < gravityItems.length; ){
            // If applyGravity returns true it removed the gravity item and thus don't increase i
            if (!vm.applyGravity( gravityItems[i], gravityDistance ) ){
              ++i;
            }
          }
        }

        if (vm.updateShadowmap){
          vm.unfreezeShadowCalculations();
        }

        scene.render();
        renderCount = ( renderCount + 1 ) % 100;
      });

      controls[ "context" ] = this.viewModel;
      getControls().registerControls( controls.name, controls );

      return;
    },
    removed () {
      getControls().removeControls( controls.name );
    }
  }
});
