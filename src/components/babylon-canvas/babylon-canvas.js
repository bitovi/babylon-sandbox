import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './babylon-canvas.less!';
import template from './babylon-canvas.stache!';

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
  pickingItem ( $ev, normalizedKey, heldInfo, deltaTime ) {
    // Return pickingInfo for first object hit except ground
    var scene = this.attr( "scene" );
    var customizeMode = this.attr( "customizeMode" );
    var controlsVM = getControls();
    var curMousePos = controlsVM.curMousePos();
    var pickingInfo = scene.pick( curMousePos.x, curMousePos.y, ( hitMesh ) => {
      return customizeMode ? hitMesh.backgroundMesh : this.isMeshFurnitureItem( hitMesh );
    });
    var hoveredMesh = this.attr( "hoveredMesh" );

    var allowPick = pickingInfo.hit && $ev.target.nodeName.toLowerCase() === "canvas";

    if ( allowPick ) {
      var mesh = pickingInfo.pickedMesh;

      if (hoveredMesh !== mesh){
        this.setMeshOutline( mesh );
      }
      getTooltip().set( "meshHover", mesh.name, "fa-archive", "Click to Manage", curMousePos.x, curMousePos.y );
    } else {
      if ( hoveredMesh ) {
        this.clearMeshOutline( hoveredMesh );
        getTooltip().clear( "meshHover" );
        this.attr( "hoveredMesh", null );
      }
    }
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

  static3DAssetPath: "/src/static/3d/",

  resourcePath ( fileName ) {
    return this.attr( "static3DAssetPath" ) + "Resources/" + fileName;
  },
  skyboxPath ( skyboxName, fileNamePrefix ) {
    return this.attr( "static3DAssetPath" ) + "skybox/" + skyboxName + "/" + fileNamePrefix;
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
    hemisphericLight.intensity = 1.0;

    var normalDirLight = new BABYLON.DirectionalLight( "dirlight1", new BABYLON.Vector3( 0, -1, 0 ), scene );
    
    var hemisShadowGen = new BABYLON.ShadowGenerator( 1024, normalDirLight );
    hemisShadowGen.setDarkness( 0.75 );
    //hemisShadowGen.usePoissonSampling = true; //PointLight
    //hemisShadowGen.useBlurVarianceShadowMap = true;
    hemisShadowGen.bias *= 0.05;

    var pointLight = new BABYLON.PointLight( "pointlight", new BABYLON.Vector3( 0, 3, 0 ), scene );

    var hemisphericPointLight = new BABYLON.HemisphericLight( "hemispoint", new BABYLON.Vector3( 0, 1, 0 ), scene );
    hemisphericPointLight.intensity = 0.2;

    scene.removeLight( pointLight );
    scene.removeLight( hemisphericPointLight );

    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator( 1024, pointLight );
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.setDarkness( 0.5 );

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

  roomAssetURL ( uroomID ) {
    var homeLoad = this.attr( "homeLoad" );
    var roomStatus = homeLoad.roomStatus;
    var roomBundles = homeLoad.roomBundles;
    var roomID = "";
    var roomAssetURL = "";

    for ( let i = 0; i < roomStatus.length; i++ ) {
      if ( roomStatus[ i ].uroomID === uroomID ) {
        roomID = roomStatus[ i ].roomID;
        break;
      }
    }

    for ( let i = 0; i < roomBundles.length; i++ ) {
      if ( roomBundles[ i ].roomID === roomID ) {
        roomAssetURL = roomBundles[ i ].roomAssetURL;
        break;
      }
    }

    return roomAssetURL;
  },

  loadTextures ( arrayOfLoadedFurnitures ) {
    var scene = this.attr( "scene" );
    for ( let i = 0; i < arrayOfLoadedFurnitures.length; i++ ) {
      let furnAssets = arrayOfLoadedFurnitures[ i ].unzippedFiles;
      for ( let x = 0; x < furnAssets.length; x++ ) {
        let asset = furnAssets[ x ];
        if ( asset.type === "texture" ) {
          new BABYLON.Texture.CreateFromBase64String( "data:image/png;base64," + asset.data, asset.name, scene );
        }
      }
    }

    return arrayOfLoadedFurnitures;
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
      meshes: meshes
    };

    this.attr( "items" ).push( item );

    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[ i ];

      mesh.__itemRef = item;

      if ( !mesh.parent ) {
        continue;
      }

      mesh.name = itemInfo.furnName || mesh.name;

      mesh.receiveShadows = true;
      mesh.position.x = parseFloat( itemInfo.position.x ) || 0;
      mesh.position.y = parseFloat( itemInfo.position.y ) || 0;
      mesh.position.z = parseFloat( itemInfo.position.z ) || 0;
      mesh.rotationQuaternion.x = parseFloat( itemInfo.rotation.x ) || 0;
      mesh.rotationQuaternion.y = parseFloat( itemInfo.rotation.y ) || 0;
      mesh.rotationQuaternion.z = parseFloat( itemInfo.rotation.z ) || 0;
      mesh.rotationQuaternion.w = parseFloat( itemInfo.rotation.w ) || 1;

      vm.addToShadowGenerator( mesh );

      if ( parseInt( itemInfo.furnPhysics, 10 ) ) {
        //vm.testSetPhysicsImpostor( mesh );
      }
    }
  },

  loadModels ( arrayOfLoadedFurnitures ) {
    var scene = this.attr( "scene" );

    for ( let i = 0; i < arrayOfLoadedFurnitures.length; i++ ) {
      let furnitureInfo = arrayOfLoadedFurnitures[ i ];
      let furnAssets = furnitureInfo.unzippedFiles;
      let len = furnAssets.length;
      let babylon = len && furnAssets[ len - 1 ];
      if ( babylon && babylon.type === "babylon" ) {
        // is a babylon file that's been unpacked
        let meshesLoadedBound = this.meshesLoaded.bind( this, furnitureInfo, babylon.name );
        BABYLON.SceneLoader.ImportMesh( "", "", "data:" + babylon.data, scene, meshesLoadedBound );
      }
    }

    return arrayOfLoadedFurnitures;
  },

  loadFurnitures ( roomFurnitures ) {
    var furnPromises = [];
    for ( let i = 0; i < roomFurnitures.length; i++ ) {
      let furn = roomFurnitures[ i ];
      furnPromises.push( Asset.get( furn ) );
    }

    return Promise.all( furnPromises ).then(
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
      vm.loadFurnitures( roomLoad.furnitures );
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

      var roomAssetURL = vm.roomAssetURL( uroomID );
      //TODO: use roomAssetURL to load the backgroundMesh
      vm.initTestGroundPlane();

      //TODO: Figure out materialConstants mapping to backgroundMesh meshes

      return vm.roomLoad( uroomID );
    });
  },


  // TEMPORARY FUNCTIONS

    testLoadModel ( options, loader ) {
      var vm = this;
      var items = this.attr( "items" );

      options.root = options.root || this.attr( "static3DAssetPath" );

      //TODO: new can.Deferred();
      var task = loader.addMeshTask(
        options.taskname || options.filename,
        "",
        options.root,
        options.filename
      );

      task.onSuccess = function (t) {

        var item = {
          name: t.name,
          meshes: t.loadedMeshes
        };

        items.push( item );

        // Set the models position
        for ( var i = 0; i < item.meshes.length; ++i ) {
          var mesh = item.meshes[i];
          mesh.e_item = item;

          if ( item.meshes.length > 1 ) {
            mesh.e_siblings = [];

            for (var j = 0; j < item.meshes.length; ++j){
              if (j != i){
                if ( options.backgroundMesh ) {
                  item.meshes[j].backgroundMesh = true;
                }
                mesh.e_siblings.push(item.meshes[j]);
              }
            }
          }

          //var positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
          //var normals = mesh.getVerticesData( BABYLON.VertexBuffer.NormalKind );
          //
          //BABYLON.VertexData.ComputeNormals( positions, mesh.getIndices(), normals );

          if ( options.rotateNormals ) {
            vm.rotateNormals( mesh );
          }

          if ( options.backgroundMesh ) {
            mesh.backgroundMesh = true;
          }

          mesh.receiveShadows = true;
          mesh.position = options.position;
          mesh.rotationQuaternion = options.rotation;

          if ( !options.skipshadow ) {
            vm.addToShadowGenerator( mesh );
          }

          if ( options.physics ) {
            //vm.testSetPhysicsImpostor( mesh );
          }

          if ( options.hide ) {
            mesh.visibility = 0;
          }
        }

        if ( options.success ) {
          options.success( item );
        }
      };
      
      return task;
    },

    initTestGroundPlane () {
      var vm = this;
      var scene = this.attr( "scene" );
      var loader = new BABYLON.AssetsManager(scene);

      var position = new BABYLON.Vector3(0, 0, 0);
      var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0,0,0);

      var meshId = -1;

      this.testLoadModel({
        filename: "Patio_001_LOD0.obj",
        physics: false,
        position: position,
        root: this.attr( "static3DAssetPath" ) + "LS_15/",
        rotation:rotation,
        rotateNormals: true,
        taskname: "ground",
        backgroundMesh: true,
        skipshadow: true,
        success: function(a_item){

          for (var i = 0; i < a_item.meshes.length; ++i){
            var mesh = a_item.meshes[i];
            mesh.collisionsEnabled = true;
            mesh.receiveShadows = true;

            if (mesh.id === "Floor_001"){
              meshId = i;
              mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.5 }, scene);
              vm.attr( "ground", mesh );

              vm.attr( "hemisphericLight" ).excludedMeshes.push( mesh );
              //vm.attr( "normalDirLight" ).excludedMeshes.push( mesh );
            }
          }
        }
      }, loader);

      loader.load();
    }

  // END TEMP FUNCTIONS
});

export const controls = {
  "name": "game-canvas",
  "context": null,
  "keypress": {
    "8": "changeColor",
    "9": "changeTexture",
    "0": "resetGround"
  },
  "mousemove": {
    "*": "pickingItem"
  }
};

export default Component.extend({
  tag: 'babylon-canvas',
  viewModel: ViewModel,
  template,
  events: {
    init () {
      var vm = this.viewModel;
      vm.attr( "$el", this.element );

      var constantsPromise = Constants.get({
        requestType: "materialList",
        format: "json"
      });

      constantsPromise.then( ( materialConstants ) => {
        console.log( "success materialConstants:", materialConstants );
        vm.attr( "materialConstants", materialConstants );
      });
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

      vm.homeLoad( 1845, 110000 );

      vm.initLights();

      //vm.initTestSceneModels();

      var renderCount = 0;
      engine.runRenderLoop(function () {
        vm.attr({
          "deltaTime": engine.deltaTime,
          "renderCount": renderCount
        });

        scene.render();
        renderCount = ( renderCount + 1 ) % 100;

        //vm.testUpdatePointLights();
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