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
 * @typedef {{baseRotation:undefined|BABYLON.Quaternion,  children: EgowallItem[], name: string, options: *, meshes: BABYLON.Mesh[], rootMeshes: BABYLON.Mesh[], parent: EgowallItem|null}} EgowallItem
 */
/**
 * @typedef {{ hit: BABYLON.Mesh, furniture: BABYLON.Mesh }} CollisionResult
 */

export const ViewModel = Map.extend({
  define: {
    items:{
      value: []
    },
    /*items: {
      get ( last ) {
        return last || [];
      }
    },*/
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
        this.freezeShadowCalculations();
      };

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
    window.scene = scene;
    window.BABYLON = BABYLON;
    // Needs to be black for the outline or the renderTarget gets false positives.
    scene.clearColor = new BABYLON.Color3( 0, 0, 0 );

    // Gravity & physics stuff
    // var physicsPlugin = new BABYLON.CannonJSPlugin();
    var gravityVector = new BABYLON.Vector3( 0, -9.81, 0 );

    //scene.enablePhysics( gravityVector, physicsPlugin );
    scene.gravity = gravityVector;
    scene.collisionsEnabled = true;
    // Disable workerCollisions as we only have 1 moving camera doing collisions
    scene.workerCollisions = false;

    var camera = this.initCamera();
  },



  initOutline(scene){

    /*********** END OF SHADERSTORE ***********************/

    let engine = scene.getEngine();
    let camera = this.attr("camera");

    // setup render target
    var renderTarget = new BABYLON.RenderTargetTexture("depth", 1024, scene, false);

    scene.customRenderTargets.push(renderTarget);
    renderTarget.activeCamera = camera;
    this.attr("renderTarget", renderTarget);

    renderTarget.onBeforeRender = function () {
      for (var i = 0; i < renderTarget.renderList.length; i++) {
        let mesh = renderTarget.renderList[i];
        // mesh.visibility = 1;

        if (mesh.__outlineMat){
          mesh.__savedMaterial = mesh.material;
          mesh.material = mesh.__outlineMat;
        }
      }
    };

    renderTarget.onAfterRender = function () {
      for (var i = 0; i < renderTarget.renderList.length; i++) {
        let mesh = renderTarget.renderList[i];
        // mesh.visibility = 0;
        mesh.material = mesh.__savedMaterial;
      }
    };

    //setup post processing
    var tPass = new BABYLON.PassPostProcess("pass", 1.0, camera);

    var tDisplayPass = new BABYLON.DisplayPassPostProcess("displayRenderTarget", 1.0, camera);
    tDisplayPass.onApply = function (pEffect) {
      pEffect.setTexture("passSampler", renderTarget);
    };

    new BABYLON.BlurPostProcess("blurH", new BABYLON.Vector2(1.0, 0), 1.0, 0.25, camera);
    new BABYLON.BlurPostProcess("blurV", new BABYLON.Vector2(0, 1.0), 1.0, 0.25, camera);

    var tCombine = new BABYLON.PostProcess("combine", "outlineCombine", null, ["passSampler", "maskSampler"], 1.0, camera);
    tCombine.onApply = function (pEffect) {
      pEffect.setTexture("maskSampler", renderTarget);
      //pEffect.setTextureFromPostProcess("rendering", renderTarget);
      pEffect.setTextureFromPostProcess("passSampler", tPass);
    };

    tCombine.onBeforeRender = function () {
      engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
    };

    tCombine.onAfterRender = function () {
      engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
    };

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

      if (isPainting){
        // rootMesh.rotation.y = Math.PI;
        // rootMesh.rotation.x = Math.PI / -2;
        rootMesh.rotationQuaternion.multiplyInPlace( BABYLON.Quaternion.RotationYawPitchRoll(0, Math.PI * 1.5, Math.PI ) );
      }
    }
  },

  setEgoObjectDetails ( mesh ) {
    var itemInfo = this.getItemOptionsFromMesh( mesh );
    var parent = mesh.parent || mesh;
    while ( parent.parent ) {
      parent = parent.parent;
    }

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

    // Temporary code to rotate paintings so they are correct
    // parent.rotation.z = 0;
    // parent.rotation.y = Math.PI;
    // parent.rotation.x = Math.PI / -2;



  },

  meshesLoaded ( itemInfo, babylonName, meshes ) {
    /**
     * @type EgowallItem
     */
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

    window.items = this.attr("items");

    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[ i ];

      let positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
      if ( !positions ) {
        continue;
      // If the mesh isn't a mesh group then add it to meshes[]
      } else {
        item.meshes.push( mesh );
      }

      mesh.__itemRef = item;

      mesh.name = itemInfo.furnName || mesh.name;



      if ( itemInfo.terrain ) {
        // Add the mesh to terrainMeshes to later in applyTerrainLightmap() foreach to setup the lightmap materials
        this.attr("terrainMeshes").push(mesh);
      } else if ( itemInfo.egoID ) {
        this.setEgoObjectDetails( mesh );
      }

      if ( !itemInfo.terrain ) {
        mesh.checkCollisions = true;
        mesh.receiveShadows = true;
        this.collisionMeshes.push( mesh);
        this.addToObjDirLightShadowGenerator( mesh );
        // Get rootMesh
        let parent = mesh.parent ||mesh;
        while (parent.parent){
          parent = parent.parent;
        }
        // Check if rootMesh has already been added
        if (!rootMeshes[ parent ]){
          rootMeshes[ parent ] = true;
          item.rootMeshes.push( parent );
        }

        if ( item !== this.attr("items")[0]){
          // item.parent
        }
      }
      else{
        mesh.checkCollisions = false;
        mesh.receiveShadows = false;
      }

      if ( parseInt( itemInfo.furnPhysics, 10 ) ) {
        //vm.testSetPhysicsImpostor( mesh );
      }
    }

    // Check if rootMeshes.length > 0 to remove terrain
    if (item.rootMeshes.length > 0){
      this.attr("items").push( item );
      // For paintings get itemInfo.roomInfo
      // For furniture just itemInf is fine
      const info = itemInfo.egoID ? itemInfo.roomInfo : itemInfo;
      // Set the position for all rootMeshes and rotation
      this.setMeshLocationFromAjaxData( item.rootMeshes, info, !!itemInfo.egoID );
    }

    // Need to do this after the meshes loop because for the paintings it doesn't work inside the loop.
    // Also not using item.meshes because item.meshes only adds meshes with vertices
    for ( let i = 0; i < meshes.length; ++i ) {
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

    terrainURL = "/src/static/3d/terrain.zip";

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
        if (lightmap){
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
    // const lightmaps = this.attr( "lightmaps" );

    this.attr( "bgMeshes", [] );

    for ( let i = 0; i < arrayOfLoadedMaterials.length; i++ ) {
      let curMaterial = arrayOfLoadedMaterials[ i ];
      let mat = this.createMaterial( curMaterial.internalName, curMaterial.unzippedFiles );

      // const lightmaps = this.attr( "lightmaps" );
      // const lightmapId = this.getTagValue( mesh, "lightmap" );
      //
      // if (lightmapId !== "" && lightmaps[ lightmapId ]){
      //   mat.ambientTexture = lightmaps[ lightmapId ];
      // }

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

    lightmapBundleURL = "/src/static/3d/LS_27_lightmap_1400.zip";

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
      // roomAssetURL = "https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles/Home/LS_" + livingSpaceID + "_test.zip";
      roomAssetURL = "/src/static/3d/ls27room.zip";
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

  /*
    Temporary functions
   */
  updatePositions(a_item, a_positionDelta){
    for ( let i = 0; i < a_item.rootMeshes.length; ++i){
      let rootMesh = a_item.rootMeshes[i];
      // Should get all children even from different meshes that still are parents
      let children = rootMesh.getChildMeshes();

      rootMesh.position.addInPlace( a_positionDelta );

      rootMesh.freezeWorldMatrix();

      for (let i = 0; i < children.length; ++i){
        children[i].freezeWorldMatrix();
      }
    }

    for (let i = 0; i < a_item.children.length; ++i){
      this.updatePosition( a_item.children[i], a_positionDelta );
    }
    // An item has moved need new shadow map generated
    this.updateShadowmap = true;
  },

  setItemParent(a_item, a_parent ){
    if (a_item.parent){

      if (a_parent == null){
        this.removeChild( a_item.parent, a_item );
      }
      else if ( a_item.parent !== a_parent ){
        this.removeChild( a_item.parent, a_item );
        a_item.parent = a_parent;
        a_parent.children.push( a_item);
      }
      else {
        // Do nothing same reference
      }
    }
    else{
      if (a_parent){
        a_item.parent = a_parent;
        a_parent.children.push( a_item );
      }
    }
  },

  removeChild( item, child ){
    for (let i = 0; i < item.children.length; ++i){
      if (item.children[i] === child){
        item.children.splice(i, 1);
        break;
      }
    }
  },
  /**
   * Items affected by gravity
   */
  gravityItems : [],
  /**
   * If the shadowmap needs to be updated, for example if a furniture has moved.
   */
  updateShadowmap: false,
  selectedFurnitureMeshes: null,
  // The meshes to check against for collision
  meshesToCheckFurniture: null,

  /**
   * Activate gravity for an item
   * @param {EgowallItem} a_item
   */
  activateGravity(a_item ){
    this.gravityItems.push ( a_item );
    BABYLON.Vector3.FromFloatsToRef(0, 2, 0, BABYLON.Tmp.Vector3[8]);
    this.updatePositions(a_item, BABYLON.Tmp.Vector3[8]);
  },

  /**
   * Remove the item from
   * @param {EgowallItem} a_item
   */
  removeGravity( a_item ){
    for( let i = 0; i < this.gravityItems.length; ++i){
      if (this.gravityItems[i] === a_item ){
        this.gravityItems.splice(i, 1);
      }
    }
  },

  /**
   * Recursively get all childMeshes for an item
   * @param {EgowallItem} a_item
   * @returns {BABYLON.Mesh[]}
   */
  getChildMeshes( a_item ){
    let result = [];

    for ( let i = 0; i < a_item.rootMeshes.length; ++i){
      result.push( ...a_item.rootMeshes[i].getChildMeshes() );
    }

    for (let i = 0; i < a_item.children; ++i) {
      result.push( ...this.getChildMeshes( a_item.children[i]) );
    }

    return result;
  },

  /**
   *
   * @param {EgowallItem} a_item
   * @returns {CollisionResult[]}
   */
  checkFurnitureCollisions( a_item ){
    // Lazy load the array and store until a new selection happens
    if (!this.selectedFurnitureMeshes){
      // calculate the meshes
      this.selectedFurnitureMeshes = this.getChildMeshes( a_item );
    }

    let selectedFurnitureMeshes = this.selectedFurnitureMeshes;

    // If first time checking meshes
    if (!this.meshesToCheckFurniture){
      let scene = this.attr("scene");
      // TODO: Improve this by already having an array with all meshes that needs checking instead of BG, Terrain and furnitures
      let meshes = this.collisionMeshes;

      this.meshesToCheckFurniture = [];

      for (let i = 0; i < meshes.length; ++i){
        let canCheck = true;
        let mesh = meshes[i];
        for ( let j = 0; j < selectedFurnitureMeshes.length; ++j){
          if (mesh === selectedFurnitureMeshes[j]){
            canCheck = false;
            break;
          }
        }

        if (canCheck){
          // Add it to the cached checkable meshes
          this.meshesToCheckFurniture.push(mesh);
        }
      }
    }

    let meshes = this.meshesToCheckFurniture;
    let result = [];
    for (let i = 0; i < meshes.length; ++i){
      let mesh = meshes[i];
      for ( let j = 0; j < selectedFurnitureMeshes.length; ++j){
        let furnitureMesh = selectedFurnitureMeshes[j];

        if (furnitureMesh.intersectsMesh( mesh)){
          //return { hit: mesh, furniture: furnitureMesh };
          result.push( { hit:mesh, furniture: furnitureMesh } );
        }
      }
    }

    return result;
  },
  /**
   *
   * @param {EgowallItem} a_item
   * @param {CollisionResult[]} a_collisions
   * @param {float} a_deltaY How much the gravity moved an object since last frame
   */
  adjustCollisionPos(a_item, a_collisions, a_deltaY ){
    // const furnitureInfo = a_collisionResult.furniture.getBoundingInfo().boundingBox;
    // const hitInfo = a_collisionResult.hit.getBoundingInfo().boundingBox;

    // -1 = against gravity
    let direction = -1;

    let tempVec = BABYLON.Tmp.Vector3[7];
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
   * Get the item to be new parent if possible
   * @param a_collisions
   */
  getParentFromCollisions(a_collisions){
    let parentCount = {};

    for (let i = 0; i < a_collisions.length; ++i){
      let itemRef = this.getItemFromMesh( a_collisions[i].hit );

      if (itemRef && Object.keys( itemRef ).length > 0  ){
        if (!parentCount[ itemRef ] ){
          parentCount[itemRef] = 0;
        }

        parentCount[itemRef]++;
      }
    }
    let highestCount = 0;
    let parent = null;
    for (let key in parentCount){
      let count = parentCount[ key ];
      if ( count > highestCount ){
        parent = key;
        highestCount = count;
      }
    }

    return parent;
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

      // TEMPORARY debug code incase it would happen
      if (parent === a_item){
        console.log("Parent equals gravityItem,  this should not happen! Investigate!");
        throw "a party";
      }
      // Set a parent for the item
      if (parent){
        this.setItemParent( a_item, parent );
      }
      // Remove this item from having gravity affecting it
      this.removeGravity( a_item );
    }
  },

  /**
   * Update rotation of an item
   * @param {EgowallItem} a_item
   */
  updateRotation(a_item, a_rotation){
    for ( let i = 0; i < a_item.rootMeshes.length; ++i){
      let rootMesh = a_item.rootMeshes[i];
      // Should get all children even from different meshes that still are parents
      let children = rootMesh.getChildMeshes();

      const rotValue = 1;
      if (!rootMesh.rotation){
        rootMesh.rotation = new BABYLON.Vector3(0, 0, rotValue);
      }
      else{
        rootMesh.rotation.y = rotValue;
      }
      rootMesh.freezeWorldMatrix();

      for (let i = 0; i < children.length; ++i){
        children[i].freezeWorldMatrix();
      }
    }

    for (let i = 0; i < a_item.children.length; ++i){
      this.updateRotation( a_item.children[i] );
    }
    // An item has moved need new shadow map generated
    this.updateShadowmap = true;
  },
  /**
   * Update position and rotation of an item
   * @param {EgowallItem} a_item
   * @param {BABYLON.Vector3} a_positionDelta
   * @param {BABYLON.Quaternion}a_rotation
   */
  updatePositionRotation(a_item, a_positionDelta, a_rotation ){

    // a_rotation = a_rotation.add( a_item.baseRotation ).normalize();



    for ( let i = 0; i < a_item.rootMeshes.length; ++i){
      let rootMesh = a_item.rootMeshes[i];
      // rootMesh.rotation.x = 0;
      // rootMesh.rotation.y = 0;
      // rootMesh.rotation.z = 0;
      // Should get all children even from different meshes that still are parents
      let children = rootMesh.getChildMeshes();

      rootMesh.position.addInPlace( a_positionDelta );
      // TODO: Use base rotation or the mesh loses its rotation
      // rootMesh.rotationQuaternion.copyFrom( a_rotation );
      //  a_rotation, rootMesh.rotationQuaternion);
      a_rotation.multiplyToRef( a_item.baseRotation, rootMesh.rotationQuaternion );

      rootMesh.freezeWorldMatrix();

      for (let i = 0; i < children.length; ++i){
        children[i].freezeWorldMatrix();
      }
    }

    for (let i = 0; i < a_item.children.length; ++i){
      this.updatePositionRotation( a_item.children[i], a_positionDelta, a_rotation );
    }
    // An item has moved need new shadow map generated
    this.updateShadowmap = true;
  },

  /* Mesh movement code */
  selectedItem: null,
  selectedItemPos: null,

  selectedItemMovePicking(a_mousePos){
    let selectedItem = this.selectedItem;

    const pickingResult = this.getPickingFromMouse( a_mousePos, ( hitMesh ) => {
      let itemRef = hitMesh.__itemRef;
      // 1. Don't return a hit for the same item
      if (itemRef){
        // If __itemRef exists and isn't the selected item then return true!
        if (itemRef !== selectedItem){
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
     */
    // Can use the first rootMesh to calculate how much the object has to move
    // TODO: Evaluate if center between two rootMeshes would be neccesary for proper position
    let rootMesh = selectedItem.rootMeshes[0];
    // Calculate correct position delta
    pickingResult.pickedPoint.subtractToRef(rootMesh.position, BABYLON.Tmp.Vector3[8] );

    const upVector = this.upVector3;
    // Using worldNormals is important or it gets weird normals!
    const normal = pickingResult.getNormal(true);

    BABYLON.Vector3.CrossToRef(upVector, normal, BABYLON.Tmp.Vector3[7] );
    // Axis is [ 0, 0, 0 ] for y == 1 and y == -1
    const axis = BABYLON.Tmp.Vector3[7].normalize();

    const angle = Math.acos(BABYLON.Vector3.Dot(upVector, normal));

    let rotQuat;
    if (normal.y === 1){
      // If direction is up then use identity quaternion
      rotQuat = BABYLON.Tmp.Quaternion[0].copyFromFloats(0, 0, 0, 1);
    }
    else if (normal.y === -1){
      rotQuat = BABYLON.Tmp.Quaternion[0].copyFromFloats(0, 0, 1, 0);
    }
    else{
      // TODO: in Babylon 2.5 change to use RotationAxisToRef
      rotQuat = BABYLON.Quaternion.RotationAxis( axis, angle);
    }

    // rootMesh.rotationQuaternion.copyFrom( rotQuat );
    this.updatePositionRotation( selectedItem, BABYLON.Tmp.Vector3[8], rotQuat );
  },
  /**
   * Unselect the selected item and do cleanup
   */
  unselectItem(){
    this.selectedItem = null;
  },
  // Constant stored for the upVector
  upVector3: BABYLON.Vector3.Up()

});

export const controls = {
  "name": "game-canvas",
  "context": null,
  "keypress": {
    "`": "toggleBabylonDebugLayer",
    "Escape": "unselectItem"
  },
  "click": {
    "Left" ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
      if ( this.attr( "hoveredMesh" )) {
        // don't execute camera click on ground
        $ev.controlPropagationStopped = true;
        this.selectedItem = this.attr("hoveredMesh").__itemRef;
        // Clone the reference because otherwise it'd get updated when changes are done to the selectedItem
        this.selectedItem.baseRotation = this.selectedItem.rootMeshes[0].rotationQuaternion.clone();
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

      // vm.initOutline(scene);

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

          for ( let i = 0; i < gravityItems.length; ++i){
            vm.applyGravity( gravityItems[i], gravityDistance );
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

      // TEMP
      window.updatePosition = function( a_item, a_pos ){
        vm.updatePositions( a_item, a_pos );
      };

      window.updateRotation = function( a_item, a_rot ){
        vm.updateRotation( a_item, a_rot );
      };

      window.setItemParent = function(a_item, a_parent) {
        vm.setItemParent(a_item, a_parent);
      };
      window.removeChild = function(a_item, a_child) {
        vm.removeChild(a_item, a_child);
      };

      window.activateGravity = function(a_item){
        vm.activateGravity(a_item);
      };

      window.removeGravity = function(a_item){
        vm.removeGravity( a_item);
      };

      return;
    },
    removed () {
      getControls().removeControls( controls.name );
    }
  }
});
