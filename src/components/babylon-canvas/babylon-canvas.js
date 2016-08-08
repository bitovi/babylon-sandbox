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
    }
  },

  getAssetsManager () {
    var scene = this.attr( "scene" );
    return new BABYLON.AssetsManager( scene );
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
  pickingEvent ( $ev, normalizedKey, heldInfo, deltaTime ) {
    var scene = this.attr( "scene" );
    var customizeMode = this.attr( "customizeMode" );
    var controlsVM = getControls();
    var curMousePos = controlsVM.curMousePos();
    var pickingInfo = scene.pick( curMousePos.x, curMousePos.y, ( hitMesh ) => {
      return customizeMode ? hitMesh.__backgroundMeshInfo : this.isMeshFurnitureItem( hitMesh );
    });
    var hoveredMesh = this.attr( "hoveredMesh" );

    var allowPick = pickingInfo.hit && $ev.target.nodeName.toLowerCase() === "canvas";

    if ( allowPick ) {
      window.pickingInfo = pickingInfo;
      this[ customizeMode ? "pickingBG" : "pickingItem" ]( hoveredMesh, pickingInfo, curMousePos );
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
    window.hoveredMesh = mesh;
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

  addToShadowGenerator ( mesh ) {
    this.attr( "shadowGenerator" ).getShadowMap().renderList.push( mesh );
    this.attr( "hemisShadowGen" ).getShadowMap().renderList.push( mesh );
  },

  initLights () {
    var scene = this.attr( "scene" );

    //This creates a light, aiming 0,1,0 - to the sky.
    var hemisphericLight = new BABYLON.HemisphericLight( "light1", new BABYLON.Vector3( 0, 1, 0 ), scene );

    hemisphericLight.groundColor = new BABYLON.Color3( 1, 1, 1 );
    hemisphericLight.intensity = 0.85;

    var normalDirLight = new BABYLON.DirectionalLight( "dirlight1", new BABYLON.Vector3( 0, -1, 0 ), scene );

    var hemisShadowGen = new BABYLON.ShadowGenerator( 1024, normalDirLight );
    hemisShadowGen.setDarkness( 0 );
    //hemisShadowGen.usePoissonSampling = true; //PointLight
    //hemisShadowGen.useBlurVarianceShadowMap = true;
    hemisShadowGen.bias *= 0.05;

    var pointLight = new BABYLON.PointLight( "pointlight", new BABYLON.Vector3( 0, 3, 0 ), scene );

    var hemisphericPointLight = new BABYLON.HemisphericLight( "hemispoint", new BABYLON.Vector3( 0, 1, 0 ), scene );
    hemisphericPointLight.intensity = 0.8;

    scene.removeLight( pointLight );
    scene.removeLight( hemisphericPointLight );

    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator( 1024, pointLight );
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.setDarkness( 0 );

    this.attr({
      hasPointlight: false,
      hemisphericLight,
      normalDirLight,
      hemisShadowGen,
      pointLight,
      hemisphericPointLight,
      shadowGenerator
    });
  },

  initScene () {
    var scene = this.attr( "scene" );
    scene.clearColor = new BABYLON.Color3( 1, 1, 1 );
    window.scene = scene;

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

  meshesLoaded ( itemInfo, babylonName, meshes ) {
    var item = {
      name: babylonName,
      options: itemInfo,
      meshes: [],
      // minimum, maximum
      boundingInfo: null
    };

    try{
      this.attr( "items" ).push( item );
      let rootParents = [];
      // No need to do babylon3
      let minimum = new BABYLON.Vector3( Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE );
      let maximum = new BABYLON.Vector3( -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE );

      // The ternary expression is for environment.babylon that has neither itemInfo.position or roomInfo
      const position = itemInfo.position || ( ( itemInfo.roomInfo && itemInfo.roomInfo.position ) ? itemInfo.roomInfo.position : {} );
      const rotation = itemInfo.rotation || ( ( itemInfo.roomInfo && itemInfo.roomInfo.rotation) ? itemInfo.roomInfo.rotation : {} );

      const posX = parseFloat( position.x ) || 0;
      const posY = parseFloat( position.y ) || 0;
      const posZ = parseFloat( position.z ) || 0;

      const rotX = parseFloat( rotation.x ) || 0;
      const rotY = parseFloat( rotation.y ) || 0;
      const rotZ = parseFloat( rotation.z ) || 0;
      const rotW = parseFloat( rotation.w ) || 0;

      for ( let i = 0; i < meshes.length; ++i ) {
        let mesh = meshes[ i ];

        let positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
        if ( !positions ) {
          //continue;
        // If the mesh isn't a mesh group then add it to meshes[]
        } else {
          item.meshes.push( mesh );

          mesh.receiveShadows = true;
          mesh.collisionsEnabled = true;
          this.addToShadowGenerator( mesh );

          const bbInfo = mesh.getBoundingInfo();
          // Set the bbInfo data for each mesh that has positions
          if (bbInfo.minimum.x < minimum.x){
            minimum.x = bbInfo.minimum.x;
          }
          if (bbInfo.minimum.y < minimum.y){
            minimum.y = bbInfo.minimum.y;
          }
          if (bbInfo.minimum.z < minimum.z){
            minimum.z = bbInfo.minimum.z;
          }
          if (bbInfo.maximum.x > maximum.x){
            maximum.x = bbInfo.maximum.x;
          }
          if (bbInfo.maximum.y > maximum.y){
            maximum.y = bbInfo.maximum.y;
          }
          if (bbInfo.maximum.z > maximum.z){
            maximum.z = bbInfo.maximum.z;
          }

          if (!mesh.rotationQuaternion){
            mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
          }
          // mesh.rotationQuaternion.x = rotX;
          // mesh.rotationQuaternion.y = rotY;
          // mesh.rotationQuaternion.z = rotZ;
          // mesh.rotationQuaternion.w = rotW;

          if ( parseInt( itemInfo.furnPhysics, 10 ) ) {
            //vm.testSetPhysicsImpostor( mesh );
          }
        }

        //this.addToShadowGenerator( mesh );

        mesh.__itemRef = item;
        mesh.name = itemInfo.furnName || mesh.name;

        let parent = mesh.parent || mesh;
        while ( parent.parent ) {
          parent = parent.parent;
        }

        // Should change this to
        if (!parent.__hasPosition) {
          // this.addToShadowGenerator( parent );
          rootParents.push(parent);
          parent.__hasPosition = true;
        }
      } // End meshes.length

      for (let i = 0; i < rootParents.length; ++i){
        let rootParent = rootParents[i];

        //this.addToShadowGenerator( mesh );

        rootParent.position.x = posX;
        rootParent.position.y = posY;
        rootParent.position.z = posZ;

        // This happens for environment.babylon
        // if (!rootParent.rotationQuaternion){
        //   rootParent.rotationQuaternion = BABYLON.Quaternion.Identity();
        // }
        //
        rootParent.rotationQuaternion.x = rotX;
        rootParent.rotationQuaternion.y = rotY;
        rootParent.rotationQuaternion.z = rotZ;
        rootParent.rotationQuaternion.w = rotW;

        if (itemInfo.egoID){
          const rotQuat = BABYLON.Quaternion.RotationYawPitchRoll( 0, Math.PI * 0.5, 0 );
          // Rotate the paintings an additional degree
          // rootParent.rotationQuaternion = rootParent.rotationQuaternion.multiply( rotQuat );
        }

        delete rootParent.__hasPosition;
      }

      // Add the position to boundingInfo
      minimum.x += posX;
      minimum.y += posY;
      minimum.z += posZ;

      maximum.x += posX;
      maximum.y += posY;
      maximum.z += posZ;

      item.boundingInfo = new BABYLON.BoundingInfo( minimum, maximum );

      // This is to rotate the paintings with the nearest wall
      if (itemInfo.egoID){
        const nearestWall = this.findNearestwall(item);
        if (nearestWall){
          this.rotatePainting( item, nearestWall, null, 0 );
        }
      }
    }
    catch(e){
      console.log(e);
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
    for ( let i = 0; i < roomFurnitures.length; i++ ) {
      let furn = roomFurnitures[ i ];
      furn.assetID = furn.assetID || furn.ufurnID;
      furn.furnURL = furn.furnURL.replace( ".unity3d", "_LOD0.zip" );
      furnPromises.push( Asset.get( furn ) );
    }

    return Promise.all( furnPromises ).then(
      this.loadTextures.bind( this )
    ).then(
      this.loadModels.bind( this )
    );
  },

  loadEgoObjects ( egoObjects ) {
    var egoPromises = [];
    for ( let i = 0; i < egoObjects.length; i++ ) {
      let egoObj = egoObjects[ i ];
      egoObj.assetID = egoObj.assetID || egoObj.egoID;
      egoObj.assetURL = egoObj.roomInfo.frameURL.replace( ".unity3d", "_LOD0.zip" );
      egoPromises.push( Asset.get( egoObj ) );
    }

    return Promise.all( egoPromises ).then(
      this.loadTextures.bind( this )
    ).then(
      this.loadModels.bind( this )
    );
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

    this.attr( "bgMeshes" ).push( mesh );

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
      mesh.material.diffuseColor = new BABYLON.Color3( r, g, b );
    }

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

    vm.attr( "homesPromise", homesPromise );

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
      );
    });
  },


  // TEMPORARY FUNCTIONS

    findNearestwall( item ){

      const boundingInfo = item.boundingInfo;

      const bgMeshes = this.attr( "bgMeshes" );
      for (let i = 0; i < bgMeshes.length; ++i){
        const bgMesh = bgMeshes[i];

        const bbInfo = bgMesh.getBoundingInfo();

        if (boundingInfo.intersects(bbInfo)){
          return bgMesh;
        }
      }

      return null;
    },

    rotatePainting( item, wall, rayDirection, fails ){

      function lookRotation(forward, up){
        forward = forward.normalize();

        //const normForward = forward.copy();
        const crossUp = BABYLON.Vector3.Cross( up, forward ).normalize();
        const crossCross = BABYLON.Vector3.Cross( forward, crossUp );

        const m00 = crossUp.x;
        const m01 = crossUp.y;
        const m02 = crossUp.z;
        const m10 = crossCross.x;
        const m11 = crossCross.y;
        const m12 = crossCross.z;
        const m20 = forward.x;
        const m21 = forward.y;
        const m22 = forward.z;

        const num8 = (m00 + m11) + m22;
        let quaternion = BABYLON.Quaternion.Identity();
        if (num8 > 0)
        {
          let num = Math.sqrt(num8 + 1);
          quaternion.w = num * 0.5;
          num = 0.5 / num;
          quaternion.x = (m12 - m21) * num;
          quaternion.y = (m20 - m02) * num;
          quaternion.z = (m01 - m10) * num;
          return quaternion.normalize();
        }
        if ((m00 >= m11) && (m00 >= m22))
        {
          const num7 = Math.sqrt(((1 + m00) - m11) - m22);
          const num4 = 0.5 / num7;
          quaternion.x = 0.5 * num7;
          quaternion.y = (m01 + m10) * num4;
          quaternion.z = (m02 + m20) * num4;
          quaternion.w = (m12 - m21) * num4;
          return quaternion.normalize();
        }
        if (m11 > m22)
        {
          const num6 = Math.sqrt(((1 + m11) - m00) - m22);
          const num3 = 0.5 / num6;
          quaternion.x = (m10+ m01) * num3;
          quaternion.y = 0.5 * num6;
          quaternion.z = (m21 + m12) * num3;
          quaternion.w = (m20 - m02) * num3;
          return quaternion.normalize();
        }
        const num5 = Math.sqrt(((1 + m22) - m00) - m11);
        const num2 = 0.5 / num5;
        quaternion.x = (m20 + m02) * num2;
        quaternion.y = (m21 + m12) * num2;
        quaternion.z = 0.5 * num5;
        quaternion.w = (m01 - m10) * num2;
        return quaternion.normalize();
      }
      function multiplyVector3(quat, vec3, vec3Dest) {

        quat = [ quat.x, quat.y, quat.z, quat.w ];
        vec3 = [ vec3.x, vec3.y, vec3.z ];

        vec3Dest || (vec3Dest = vec3);
        var d = vec3[0],
            e = vec3[1],
            g = vec3[2],
            b = quat[0],
            f = quat[1],
            h = quat[2],
            a = quat[3],
            i = a * d + f * g - h * e,
            j = a * e + h * d - b * g,
            k = a * g + b * e - f * d,
            d = -b * d - f * e - h * g;
        vec3Dest[0] = i * a + d * -b + j * -h - k * -f;
        vec3Dest[1] = j * a + d * -f + k * -b - i * -h;
        vec3Dest[2] = k * a + d * -h + i * -f - j * -b;
        return new BABYLON.Vector3( vec3Dest[0], vec3Dest[1], vec3Dest[2] );
      };

      function rotateAxis( pickingInfo ){

        const upVector = BABYLON.Vector3.Up();

        const normal = pickingInfo.getNormal();
        const direction = new BABYLON.Vector3( -normal.x, -normal.y, -normal.z);

        const axis = BABYLON.Vector3.Cross(upVector, direction ).normalize();
        const angle = Math.acos(BABYLON.Vector3.Dot(upVector, direction));

        rootNode.rotationQuaternion = BABYLON.Quaternion.Identity();
        rootNode.rotate(axis, angle , BABYLON.Space.LOCAL);
      }

      function rotateLookRot( pickingInfo ){

      }

      let scene = this.attr("scene");
      let rootNode = item.meshes[0];
      while (rootNode.parent){
        rootNode = rootNode.parent;
      }

      // size = Max - Min
      // Min + size / 2
      //const rayDirection = multiplyVector3( rootNode.rotationQuaternion, new BABYLON.Vector3(0, -1, 0));
      //const rayDirection = multiplyVector3( rootNode.rotationQuaternion, new BABYLON.Vector3(0, 0, -1));
      rayDirection = rayDirection || multiplyVector3( rootNode.rotationQuaternion, new BABYLON.Vector3(0, 0, -1));

      //const rayDirection = center.subtract(rootNode.position).normalize();
      const ray = new BABYLON.Ray( rootNode.position, rayDirection );

      DEBUG3D.drawPoint(scene, rootNode.position.add( rayDirection ) , {
        time: 100000,
        size: 0.3,
        color: new BABYLON.Color3(1, 0, 1)
      });

      const pickingInfo = scene.pickWithRay(ray, function(mesh){
        return mesh === wall;
      });

      if (pickingInfo.hit){

        rotateAxis(pickingInfo);

        // const upVector =  multiplyVector3(rootNode.rotationQuaternion, BABYLON.Vector3.Up());
        // const normal = pickingInfo.getNormal();

        // DEBUG3D.drawPoint(scene, rootNode.position.add( normal ) , {
        //   time: 100000,
        //   size: 0.3
        // });

        //const direction = new BABYLON.Vector3( -normal.x, -normal.y, -normal.z);
        // let direction = BABYLON.Vector3.Cross(upVector, normal);
        // direction.x = -direction.x;
        // direction.y = -direction.y;
        // direction.z = -direction.z;

        // const rotQuat = lookRotation( direction, upVector);//BABYLON.Vector3.Up());

        //console.log(rotQuat.subtract( rootNode.rotationQuaternion ));



        //rootNode.rotationQuaternion = rootNode.rotationQuaternion.multiply(rotQuat);
        // rootNode.rotationQuaternion = rotQuat;



        const upvec = multiplyVector3( rootNode.rotationQuaternion, BABYLON.Vector3.Up() );
        const forvec = multiplyVector3( rootNode.rotationQuaternion, new BABYLON.Vector3( 0, 0, 1 ));
        const rightvec = multiplyVector3( rootNode.rotationQuaternion, new BABYLON.Vector3( 1, 0, 0 ));

        DEBUG3D.drawPoint(scene, rootNode.position.add( upvec ) , {
          time: 100000,
          size: 0.3,
          color: new BABYLON.Color3(0, 1, 0  )
        });
        DEBUG3D.drawPoint(scene, rootNode.position.add( forvec ) , {
          time: 100000,
          size: 0.3,
          color: new BABYLON.Color3(0, 0, 1  )
        });
        DEBUG3D.drawPoint(scene, rootNode.position.add( rightvec ) , {
          time: 100000,
          size: 0.3,
          color: new BABYLON.Color3(1, 0, 0  )
        });

        // console.log( "after: ", rootNode.rotationQuaternion );

      }
      else{
        if (fails === 0) {
          this.rotatePainting(item, wall, multiplyVector3(rootNode.rotationQuaternion, new BABYLON.Vector3(-1, 0, 0)), fails+ 1);
        }
        else if (fails === 1) {
          this.rotatePainting(item, wall, multiplyVector3(rootNode.rotationQuaternion, new BABYLON.Vector3(0, 0, 1)), fails+ 1);
        } else if (fails == 2){
              this.rotatePainting( item, wall, multiplyVector3( rootNode.rotationQuaternion, new BABYLON.Vector3(0, 0, 1)), fails+ 1);
        } else if (fails == 3){
          this.rotatePainting( item, wall, multiplyVector3( rootNode.rotationQuaternion, new BABYLON.Vector3(0, -1, 0)), fails + 1);
        }
      }
    },

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
  //"keypress": {
  //  "8": "changeColor",
  //  "9": "changeTexture",
  //  "0": "resetGround"
  //},
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
        //TODO: handle the materialConstantsResp.statusInfo
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