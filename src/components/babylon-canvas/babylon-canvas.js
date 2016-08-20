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

export const ViewModel = Map.extend({
  define: {
    items: {
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
    var scene = this.attr( "scene" );
    var curMousePos = controlsVM.curMousePos();
    var customizeMode = this.attr( "customizeMode" );

    var pickingInfo = scene.pick( curMousePos.x, curMousePos.y, ( hitMesh ) => {
      return this.getPickingFn( hitMesh, customizeMode ) ? true : false;
    });

    var hoveredMesh = this.attr( "hoveredMesh" );

    var allowPick = pickingInfo.hit && $ev.target.nodeName.toLowerCase() === "canvas";

    if ( allowPick ) {
      let pickingFn = this.getPickingFn( pickingInfo.pickedMesh, customizeMode );
      this[ pickingFn ]( hoveredMesh, pickingInfo, curMousePos );
    } else {
      if ( hoveredMesh ) {
        this.clearMeshOutline( hoveredMesh );
        getTooltip().clear( "meshHover" );
        this.attr( "hoveredMesh", null );
      }
    }
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
  },

  unfreezeShadowCalculations () {
    this.attr( "objDirLightShadowGen" ).getShadowMap().refreshRate = 1;
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

  isMeshFurnitureItem ( mesh ) {
    var itemOptions = this.getItemOptionsFromMesh( mesh );
    return itemOptions && itemOptions.furnArg && anyTruthy( itemOptions.furnArg );
  },

  isMeshEgoObj ( mesh ) {
    var itemOptions = this.getItemOptionsFromMesh( mesh );
    return itemOptions && ( itemOptions.egoID ? true : false );
  },

  setMeshLocationFromAjaxData ( mesh, info = {} ) {
    var pos = info.position;
    var rot = info.rotation;

    if ( mesh.position && pos ) {
      mesh.position.x = parseFloat( pos.x ) || 0;
      mesh.position.y = parseFloat( pos.y ) || 0;
      mesh.position.z = parseFloat( pos.z ) || 0;
    }
    if ( mesh.rotationQuaternion && rot ) {
      mesh.rotationQuaternion.x = parseFloat( rot.x ) || 0;
      mesh.rotationQuaternion.y = parseFloat( rot.y ) || 0;
      mesh.rotationQuaternion.z = parseFloat( rot.z ) || 0;
      mesh.rotationQuaternion.w = parseFloat( rot.w ) || 1;
    }
  },

  setEgoObjectDetails ( mesh ) {
    var itemInfo = this.getItemOptionsFromMesh( mesh );
    var parent = mesh.parent || mesh;
    while ( parent.parent ) {
      parent = parent.parent;
    }

    this.setMeshLocationFromAjaxData( parent, itemInfo.roomInfo );

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

    //parent.rotation.z = 0;
    parent.rotation.y = Math.PI;
    parent.rotation.x = Math.PI / -2;
  },

  meshesLoaded ( itemInfo, babylonName, meshes ) {
    var item = {
      name: babylonName,
      options: itemInfo,
      meshes: []
    };

    this.attr( "items" ).push( item );

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

      mesh.receiveShadows = true;

      if ( itemInfo.terrain ) {
        // Add the mesh to terrainMeshes to later in applyTerrainLightmap() foreach to setup the lightmap materials
        this.attr("terrainMeshes").push(mesh);
      } else if ( itemInfo.egoID ) {
        this.setEgoObjectDetails( mesh );
        mesh.checkCollisions = true;
      } else {
        this.setMeshLocationFromAjaxData( mesh, itemInfo );
        mesh.checkCollisions = true;
      }

      if ( !itemInfo.terrain ) {
        this.addToObjDirLightShadowGenerator( mesh );
      }

      if ( parseInt( itemInfo.furnPhysics, 10 ) ) {
        //vm.testSetPhysicsImpostor( mesh );
      }
    }
    // Need to do this after the meshes loop because for the paintings it doesn't work inside the loop.
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

    if ( mesh.material && mesh.__backgroundMeshInfo.ajaxInfo.color ) {
      let ajaxColor = mesh.__backgroundMeshInfo.ajaxInfo.color;
      let r = parseFloat( ajaxColor.r );
      let g = parseFloat( ajaxColor.g );
      let b = parseFloat( ajaxColor.b );
      let a = parseFloat( ajaxColor.a );
      mesh.material.diffuseColor = new BABYLON.Color4( r, g, b, a );
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

      this.bgMeshSetMaterial ( mesh, roomInfo );
    }
  },

  renderBackgroundMesh ( data ) {
    var scene = this.attr( "scene" );
    var arrayOfLoadedMaterials = data[ 0 ];
    var roomMeshSetDef = data[ 1 ];
    var unzippedMeshFiles = roomMeshSetDef.unzippedFiles;
    var lightmapLivingspace = this.attr( "lightmapLivingspace" );

    this.attr( "bgMeshes", [] );

    for ( let i = 0; i < arrayOfLoadedMaterials.length; i++ ) {
      let curMaterial = arrayOfLoadedMaterials[ i ];
      let mat = this.createMaterial( curMaterial.internalName, curMaterial.unzippedFiles );

      mat.ambientTexture = lightmapLivingspace;
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

  applyTerrainLightmaps () {
    let meshes = this.attr("terrainMeshes");
    const lightmapTerrain = this.attr("lightmapTerrain");

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
          if (lightmapTerrain[ lightmapId ]){
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
      const lm = lightmapTerrain[ group.lightmapId ];

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

      this.attr("lightmapTerrain", {});

      for ( let x = 0; x < unzippedAssets.length; x++ ) {
        let asset = unzippedAssets[ x ];
        if ( asset.type === "texture" ) {
          if ( asset.name === "livingspace.png" ) {
            let lm = new BABYLON.Texture.CreateFromBase64String( "data:image/png;base64," + asset.data, "lightmapLivingspace", scene );
            lm.coordinatesIndex = 1; // Use UV channel 2
            this.attr( "lightmapLivingspace", lm );
          // Create the lightmapTerrain entries for terrainshops1.png, terrainshops2.png and terrainfloor.png
          } else {
            // length -4 should cover our usecase but if we change to .jpeg for some reason we need to check the actual extensions length!
            // Example: terrainfloor.png => terrainfloor as key name
            const terrainLmName = asset.name.substring( 0, asset.name.length - 4 );

            let lm = new BABYLON.Texture.CreateFromBase64String( "data:image/png;base64," + asset.data, terrainLmName, scene );
            lm.coordinatesIndex = 1;
            this.attr( "lightmapTerrain" )[ terrainLmName ] = lm;
          }
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
          vm.applyTerrainLightmaps( terrainPromResults );
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
  }
});

export const controls = {
  "name": "game-canvas",
  "context": null,
  "keypress": {
    "`": "toggleBabylonDebugLayer"
  },
  "click": {
    "Left" ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
      if ( this.attr( "hoveredMesh" ) ) {
        // don't execute camera click on ground
        $ev.controlPropagationStopped = true;
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
