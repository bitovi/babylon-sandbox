import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './babylon-canvas.less!';
import template from './babylon-canvas.stache!';
import _find from 'lodash/find.js';

import 'cannon';
import BABYLON from 'babylonjs/babylon.max';
import '../../static/3d/js/babylon.objFileLoader.js';

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
          // The light naturally affects furniture & background so it's removed until scene fully loaded
          this.attr("scene").addLight(this.attr("terrainLight"));
        }
        return newVal;
      }
    }
  },

  // This creates and positions a free camera
  initCamera () {
    var scene = this.attr( "scene" );
    //var camera = new BABYLON.FreeCamera( "camera1", new BABYLON.Vector3(0, 5, -10), scene );
    var camera = new BABYLON.TargetCamera( "camera1", new BABYLON.Vector3( -3, 1.5, -4 ), scene );
    //var camera = new BABYLON.Camera( "camera1", new BABYLON.Vector3(0, 5, -10), scene );
    camera.fov = 1;

    this.attr( "camera", camera );

    //setTimeout( ()=> {
    //  camera.position.z = -7;
    //}, 4000);
    //setTimeout( ()=> {
    //  camera.setTarget( BABYLON.Vector3.Zero() );
    //}, 7000);

    camera.speed *= 0.25;

    // This targets the camera to scene origin
    //camera.setTarget( BABYLON.Vector3.Zero() );
    camera.setTarget( new BABYLON.Vector3( 0, 1.25, 0 ) );

    // This attaches the camera to the canvas
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

  setSkyboxMaterial ( skyboxName, fileNamePrefix ) {
    var scene = this.attr( "scene" );
    var skybox = this.attr( "skybox" );
    var skyboxImgs = this.skyboxPath( skyboxName, fileNamePrefix );
    var skyboxMaterial = new BABYLON.StandardMaterial( "skyBox", scene );

    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture( skyboxImgs, scene );
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

    skyboxMaterial.diffuseColor = new BABYLON.Color3( 0, 0, 0 );
    skyboxMaterial.specularColor = new BABYLON.Color3( 0, 0, 0 );

    skybox.material = skyboxMaterial;

    return skyboxMaterial;
  },

  initSkybox () {
    var scene = this.attr( "scene" );
    var skybox = BABYLON.Mesh.CreateBox( "skyBox", 1000, scene );
    this.attr( "skybox", skybox );

    return skybox;
  },

  addToObjDirLightShadowGenerator ( mesh ) {
    this.attr( "objDirLightShadowGen" ).getShadowMap().renderList.push( mesh );
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
    mainObjectDirLight.intensity = 0.5;

    var objDirLightShadowGen = new BABYLON.ShadowGenerator( 1024, mainObjectDirLight );
    objDirLightShadowGen.setDarkness( 0 );
    objDirLightShadowGen.bias *= 0.05;

    // For the terrain only
    let terrainLight = new BABYLON.DirectionalLight( "terrainLight", new BABYLON.Vector3( 1, 0 ,0 ), scene);
    terrainLight.intensity = 0.425;
    terrainLight.specular = BABYLON.Color3.Black();
    // Add it back when the scene finished loading
    scene.removeLight( terrainLight );

    this.attr({
      hemisphericLight,
      mainObjectDirLight,
      objDirLightShadowGen,
      terrainLight
    });
  },

  initScene () {
    var scene = this.attr( "scene" );
    scene.clearColor = new BABYLON.Color3( 1, 1, 1 );

    // Gravity & physics stuff
    var physicsPlugin = new BABYLON.CannonJSPlugin();
    var gravityVector = new BABYLON.Vector3( 0, -9.81, 0 );

    scene.enablePhysics( gravityVector, physicsPlugin );

    scene.collisionsEnabled = true;
    scene.workerCollisions = true;

    var camera = this.initCamera();

    // Z axis is above/below
    // var dirLight = new BABYLON.DirectionalLight("dirlight1", new BABYLON.Vector3(1, 0, 0), scene);
    BABYLON.StandardMaterial.AmbientTextureEnabled = false;

    BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
    //scene.debugLayer.show();
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
      mesh.collisionsEnabled = true;

      if (itemInfo.terrain ){
        // This forces the terrainLight to only work on the terrain
        this.attr("terrainLight").includedOnlyMeshes.push(mesh);
        // Don't use hemispheric light for the terrain because it needs to have a different emissive color
        this.attr("hemisphericLight").excludedMeshes.push(mesh);
        // Instead of the global ambient light (hemispheric) set the emissive color of the material
        if (mesh.material){
          mesh.material.emissiveColor = new BABYLON.Color3( 0.225, 0.225, 0.225 );
        }
      } else if ( itemInfo.egoID ) {
        this.setEgoObjectDetails( mesh );
      } else {
        this.setMeshLocationFromAjaxData( mesh, itemInfo );
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

    var meshID = mesh._tags ? Object.keys( mesh._tags )[ 0 ].replace( "meshId_", "" ) : "";
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

      // Need to disable backfaceCulling or the shadow generator can't see the roof
      if (mesh.name === "ShellOut_002"){
        mesh.material.backFaceCulling = false;
      }

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

  bgMeshLoaded ( itemInfo, babylonName, meshes ) {
    var uroomID = this.attr( "uroomID" );
    var roomInfo = this.roomInfo( uroomID );

    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[ i ];
      mesh.collisionsEnabled = true;
      mesh.receiveShadows = true;

      // Add only the ceiling mesh to cast shadow
      if (mesh.name === "ShellOut_002"){
        this.addToObjDirLightShadowGenerator(mesh);
      }

      //mesh.position = new BABYLON.Vector3( 0, 0, 0 );
      //mesh.rotation = BABYLON.Quaternion.RotationYawPitchRoll( 0, 0, 0 );
      //let positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
      //let normals = mesh.getVerticesData( BABYLON.VertexBuffer.NormalKind );

      //BABYLON.VertexData.ComputeNormals( positions, mesh.getIndices(), normals );
      //mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

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
      curMaterial.attr( "instance", this.createMaterial( curMaterial.internalName, curMaterial.unzippedFiles ) );
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
      //TODO: homeLoad.skyboxes.skyboxAssetURL
      vm.initSkybox();
      vm.setSkyboxMaterial( "ely_lakes", "lakes" );

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

      var roomAssetURL = vm.roomAssetURL( uroomID );
      //TODO: use real roomAssetURL to load the backgroundMesh or change service
      let livingSpaceID = homeLoad.livingSpaceID;
      roomAssetURL = "https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles/Home/LS_" + livingSpaceID + "_test.zip";
      var setDef = new Map({ assetID: roomAssetURL, assetURL: roomAssetURL });
      var roomMeshProm = Asset.get( setDef );
      
      var materialsAndMeshProm = Promise.all( [ materialsLodedProm, roomMeshProm ] );
      
      return materialsAndMeshProm.then(
        // load the background mesh in babylon
        vm.renderBackgroundMesh.bind( vm )
      ).then(
        // load and place the furniture
        vm.roomLoad.bind( vm, uroomID )
      ).then(( arrOfRoomLoadResults ) => {
        return terrainProm.then(( terrainPromResults ) => {
          vm.attr( "homeLoadFinished", true );
          return { arrOfRoomLoadResults, terrainProm };
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

  // TEMPORARY FUNCTIONS

    static3DAssetPath: "/src/static/3d/",

    resourcePath ( fileName ) {
      return this.attr( "static3DAssetPath" ) + "Resources/" + fileName;
    },
    skyboxPath ( skyboxName, fileNamePrefix ) {
      return this.attr( "static3DAssetPath" ) + "skybox/" + skyboxName + "/" + fileNamePrefix;
    }
    
  // END TEMP FUNCTIONS
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
        vm.attr({
          // Convert deltaTime from milliseconds to seconds
          "deltaTime": engine.deltaTime / 1000,
          "renderCount": renderCount
        });

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
