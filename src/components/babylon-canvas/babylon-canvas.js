import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './babylon-canvas.less!';
import template from './babylon-canvas.stache!';

import 'cannon';
import BABYLON from 'babylonjs/babylon.max';
import '../../static/3d/js/babylon.objFileLoader.js';

import { getControls, getTooltip } from '../../util/util.js';

import JSZip from 'jszip/dist/jszip';
import $ from 'jquery';

/*
Tests
 */
import CompressionTests from '../performance/compression';
// Loading tests
import LoadingBabylonTests from '../performance/loadingbabylon';
import LoadingTgaTests from '../performance/loadingtga';
import LoadingZipTests from '../performance/loadingzip';
// Draw performance tests
import Draw1000 from '../performance/draw1000';
import Draw2500 from '../performance/draw2500';
// Triangle tests
import Tri100 from '../performance/tri100';
import Tri250 from '../performance/tri250';
import Tri500 from '../performance/tri500';
import Tri1000 from '../performance/tri1000';
import Tri2000 from '../performance/tri2000';
import Tri5000 from '../performance/tri5000';

/*
Shadow tests
 */
import Shadows from '../performance/shadows';
import Shadows50 from '../performance/shadows50';
import Shadows100 from '../performance/shadows100';
import Shadows200 from '../performance/shadows200';

/* Rotation tests */
import Rot25 from '../performance/rot25';
import Rot50 from '../performance/rot50';

export const ViewModel = Map.extend({
  debug: true,
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

  groundId: "41_Floor_001",
  backgroundImpostors: [],
  studioMaterials : [],

  getAssetsManager () {
    var scene = this.attr( "scene" );
    return new BABYLON.AssetsManager( scene );
  },

  // This creates and positions a free camera
  initCamera () {
    var scene = this.attr( "scene" );
    //var camera = new BABYLON.FreeCamera( "camera1", new BABYLON.Vector3(0, 5, -10), scene );
    var camera = new BABYLON.TargetCamera( "camera1", new BABYLON.Vector3( -3, 1.5, -4 ), scene );
    camera.fov = 1;

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
    var controlsVM = getControls();
    var curMousePos = controlsVM.curMousePos();
    var pickingInfo = scene.pick( curMousePos.x, curMousePos.y, function(a_hitMesh){
      return a_hitMesh.tag === 1;
    });
    var hoveredMesh = this.attr( "hoveredMesh" );

    var allowPick = pickingInfo.hit && !this.attr( "customizeMode" ) && $ev.target.nodeName.toLowerCase() === "canvas";

    // If the info hit a mesh that isn't the ground then outline it
    if ( allowPick ) {
      var mesh = pickingInfo.pickedMesh;

      if (hoveredMesh !== mesh){
        this.setMeshOutline( mesh );
      }
      getTooltip().set( "meshHover", mesh.label, "fa-archive", "Click to Manage", curMousePos.x, curMousePos.y );
    // Else remove outline
    } else {
      if ( hoveredMesh ) {
        this.clearMeshOutline( hoveredMesh );
        getTooltip().clear( "meshHover" );
        this.attr( "hoveredMesh", null );
      }
    }
  },

  checkIfTextureCached(url, engine){
    var cachedTextures = engine.getLoadedTexturesCache();
    for (var i = 0; i < cachedTextures.length; i++) {
      var cacheEntry = cachedTextures[i];

      if (cacheEntry.url === url) {
        return cacheEntry;
      }
    }
    return null;
  },

  clearMeshOutline ( mesh ) {
    mesh.renderOutline = false;
    if ( mesh.e_siblings ) {
      for ( let i = 0; i < mesh.e_siblings.length; ++i ) {
        mesh.e_siblings[ i ].renderOutline = false;
      }
    }
  },

  setMeshOutline ( a_mesh, a_skipSinblings ) {
    if ( !a_skipSinblings ) {
      let hoveredMesh = this.attr( "hoveredMesh" );
      if ( hoveredMesh ){
        this.clearMeshOutline( hoveredMesh );
      }

      if (a_mesh.e_siblings){
        for ( var i = 0; i < a_mesh.e_siblings.length; ++i){
          this.setMeshOutline(a_mesh.e_siblings[i], true);
        }
      }
      this.attr( "hoveredMesh", a_mesh );
    }

    a_mesh.renderOutline = true;
    // rgb( 86, 170, 206)
    a_mesh.outlineColor = new BABYLON.Color3(0.3359375, 0.6640625, 0.8046875);
    a_mesh.outlineWidth = 0.025;
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

  /* Demo/Test Functions */


    /**
     * Multiply quat quaternion with vector3
     * @param {Array} quat
     * @param {Array} vec3
     * @param {Array?} vec3Dest
     * @returns {*}
     */
    multiplyVector3 ( quat, vec3, vec3Dest ) {
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
      return vec3Dest;
    },

    rotateNormals ( mesh ) {
      var normals = mesh.getVerticesData( BABYLON.VertexBuffer.NormalKind );
      var rotationQuat = BABYLON.Quaternion.RotationYawPitchRoll( 0,  Math.PI * 1.5, 0 );

      for (var i = 0; i < normals.length; i+= 3){
        var normalVector = [ normals[i], normals[i + 1], normals[i + 2] ];

        // From glMatrix 0.95
        this.multiplyVector3(
          [ rotationQuat.x, rotationQuat.y, rotationQuat.z, rotationQuat.w ],
          normalVector
        );

        normals[i] = normalVector[0];
        normals[i+1] = normalVector[1];
        normals[i + 2] = normalVector[2];
      }

      mesh.setVerticesData( BABYLON.VertexBuffer.NormalKind, normals );
    },

    testLoadZip( options ){
      let vm = this;
      let promise = new Promise(function( resolve, reject ){
        options.root = options.root || "https://cdn.testing.egowall.com/CDN_new/temp_test/";
        //options.root = vm.static3DAssetPath + "loadingzip/";
        //options.root = vm.static3DAssetPath + "loadingzipbase/";
        const url = options.root + options.filename;

        $.ajax({
          url: url,
          type:"get",
          dataType : "binary",
          xhrFields : {
            responseType : "arraybuffer"
          },
          success:function(zipbuffer){

            if (zipbuffer) {
              let jszip = new JSZip();
              // Load the zipfile from arraybuffer
              jszip.loadAsync(zipbuffer).then(function (zip) {
                resolve(zip);
                // JsZip async
              }).catch(function (reason) {
                reject(reason);
              });
            }
          }
        }); // End $.ajax
      });


      return promise;
    },

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

      if (options.textures){
        /**
         * Returns a closure for the for loop to check material for each mesh
         * @param mesh
         * @returns {Function}
         */
        function checkMaterial(mesh){
          // Function for set timeout loop
          function checkmaterial(){
            var material = mesh.material;
            if (material){
              var scene = vm.attr( "scene" );
              if (options.textures.diffuse){
                let url = vm.attr( "static3DAssetPath" ) + options.textures.diffuse;
                material.diffuseTexture = new BABYLON.Texture(url, scene);
              }
              if (options.textures.normal){
                let url = vm.attr( "static3DAssetPath" ) + options.textures.normal;
                material.bumpTexture = new BABYLON.Texture(url, scene);
              }
            }
            else{
              setTimeout(checkmaterial, 50);
            }
          }

          setTimeout(checkmaterial, 50);
        }
      }


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
                mesh.e_siblings.push(item.meshes[j]);
              }
            }
          }

          var positions = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
          var normals = mesh.getVerticesData( BABYLON.VertexBuffer.NormalKind );

          BABYLON.VertexData.ComputeNormals( positions, mesh.getIndices(), normals );
          mesh.setVerticesData( BABYLON.VertexBuffer.NormalKind, normals );

          // if ( options.rotateNormals ) {
          //   vm.rotateNormals( mesh );
          // }

          if (options.textures){
            checkMaterial(mesh);
          }

          if ( !options.skipTag ) {
            mesh.tag = 1;
          }

          mesh.label = options.label;

          mesh.receiveShadows = true;
          mesh.position = options.position;
          mesh.rotationQuaternion = options.rotation;

          if (!options.skipshadow){
            vm.addToShadowGenerator( mesh );
          }
          if ( options.physics ) {
            vm.testSetPhysicsImpostor( mesh );
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

    testloadModelZip(options){
      let vm = this;
      options.root = options.root || "https://cdn.testing.egowall.com/CDN_new/temp_test/";
      //options.root = vm.static3DAssetPath + "loadingzip/";
      //options.root = vm.static3DAssetPath + "loadingzipbase/";
      const url = options.root + options.filename;

      this.testLoadZip(options).then( function(zip){
        let babylonFile;
        let textures = [];

        // Iterate over files to find the .babylon file and textures
        for (var key in zip.files) {
          if (key.endsWith(".babylon")) {
            babylonFile = zip.files[key];
          } else {
            textures.push(zip.files[key]);
          }
        }
        // After finding the babylon file and textures start by loading textures
        if (textures.length > 0){
          vm.testLoadTexturs(textures, babylonFile, options);
        }
        else{
          vm.testLoadMesh(babylonFile, options);
        }
      }, function(reason){
        console.log(reason);
      });
    },

    /**
     *
     * @param {JSZip[]} textures
     * @param {JSZip} babylonZipFile
     */
    testLoadTexturs(textures, babylonZipFile, options){
      let vm = this;
      let scene = this.attr("scene");
      let texturesInitialized = 0;

      /**
       * When a texture has been initialized update the count.
       * If all textures are initialized then load the mesh
       */
      function textureInitialized(){
        texturesInitialized++;
        if (texturesInitialized >= textures.length) {
          vm.testLoadMesh(babylonZipFile, options);
        }
      }

      // Iterate over all textures
      textures.forEach(function (texture) {
        let engine = scene.getEngine();

        // Check if the texture is cached or not.
        // Need to add data: to the filename or it won't check against correct cache.
        if (!vm.checkIfTextureCached( "data:" + texture.name, engine )){
          texture.async("base64").then(function (data) {
            // Create the texture to add it to cache
            new BABYLON.Texture.CreateFromBase64String("data:image/png;base64," + data, texture.name, scene );
            textureInitialized();

          }).catch(function (reason) {
            console.log(reason);
          });
        // No need to do anything except update initialized count if the file already is cached.
        } else {
          textureInitialized();
        }
      });
    },

  /**
   * It's important to load the mesh after all textures have been initialized otherwise it will make a http request.
   * For example it would try and get "data:chair.png"
   * But since textures have been created before loading mesh it will get the data:chair.png from the texture cache instead.
   * @param {JSZip} babylonZipFile
   */
    testLoadMesh(babylonZipFile, options){
      let vm = this;
      let items = this.attr("items");
      //Retrieve the json text from the zipped .babylon file
      babylonZipFile.async("string").then(function (text) {
        // Add data: to the jsontext to skip making http request
        BABYLON.SceneLoader.ImportMesh("", "", "data:" + text, vm.attr("scene"), function (meshes) {
          var item = {
            name: babylonZipFile.name,
            meshes: meshes
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
                  mesh.e_siblings.push(item.meshes[j]);
                }
              }
            }

            let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            // Only the renderable meshes has positions
            if (!positions){
              continue;
            }

            if ( !options.skipTag ) {
              mesh.tag = 1;
            }

            mesh.label = options.label;
            // Enable receive shadow & collisions
            mesh.receiveShadows = true;
            // Collision so the camera can't move through object
            mesh.collisionsEnabled = true;

            if (options.position){
              mesh.position = options.position;
            }
            if (options.rotation){
              mesh.rotationQuaternion = options.rotation;
            }
            if (!options.skipshadow){
              vm.addToShadowGenerator( mesh );
            }

            if ( options.physics ) {
              vm.testSetPhysicsImpostor( mesh );
            }
          }

          if ( options.success ) {
            options.success( item );
          }
        // End ImportMesh
        });
        // Babylon async
      });
    },

    initTestSceneModels () {
      switch( location.search){
        case "?test=compression":
          CompressionTests(BABYLON, this.attr("scene"), this);
          break;
        /*
          Loading tests
         */
        case "?test=loadingbabylon":
          LoadingBabylonTests(BABYLON, this);
          break;
        case "?test=loadingtga":
          LoadingTgaTests(BABYLON, this);
          break;
        case "?test=loadingzip":
          LoadingZipTests(BABYLON, this);
          break;
        /*
          Draw call tests
         */
        case "?test=draw1000":
          Draw1000(BABYLON, this);
          break;
        case "?test=draw2500":
          Draw2500(BABYLON, this);
          break;
        case "?test=draw5000":
          break;
        /*
          Triangle tests
         */
        case "?test=tri100":
          Tri100(BABYLON, this);
          break;
        case "?test=tri250":
          Tri250(BABYLON, this);
          break;
        case "?test=tri500":
          Tri500(BABYLON, this);
          break;
        case "?test=tri1000":
          Tri1000(BABYLON, this);
          break;
        case "?test=tri2000":
          Tri2000(BABYLON, this);
          break;
        case "?test=tri5000":
          Tri5000(BABYLON, this);
          break;
        /* Shadow tests */
        case "?test=shadows":
          Shadows(BABYLON, this);
          break;
        case "?test=shadows50":
          Shadows50(BABYLON, this);
          break;
        case "?test=shadows100":
          Shadows100(BABYLON, this);
          break;
        case "?test=shadows200":
          Shadows200(BABYLON, this);
          break;
        /* shadow & rotations */
        case "?test=rot25":
          Rot25(BABYLON, this);
          break;
        case "?test=rot50":
          Rot50(BABYLON, this);
          break;
      }
    },

    changeColor () {
      if ( !this.attr( "customizeMode" ) ) {
        return;
      }



      var colorId = parseInt(Math.random() * 5);
      // So there is sliiiiightly higher chance of getting 3 than 0, 1 , 2!
      if (colorId === 5) colorId = 4;
      var color;

      switch ( colorId ){
        case 0:
          color = new BABYLON.Color3(73/255, 71/255, 63/255);
          break;
        case 1:
          color = new BABYLON.Color3(149/255, 228/255, 147/255);
          break;
        case 2:
          color = new BABYLON.Color3(232/255, 74/255, 74/255);
          break;
        case 3:
          color = new BABYLON.Color3(104/255, 191/255, 193/255);
          break;
        case 4:
          color = new BABYLON.Color3(1, 1, 0.3);
          break;
      }

      this.setDefaults();

      this.attr( "ground" ).material.diffuseColor = color;
    },

    changeTexture () {
      if ( !this.attr( "customizeMode" ) ) {
        return;
      }
      // randomization from 0 -> 4
      var textureId = parseInt(Math.random() * 4);
      // So there is sliiiiightly higher chance of getting 3 than 0, 1 , 2!
      if (textureId === 4) textureId = 3;

      var textureUrl = this.attr( "static3DAssetPath" ) + "LS_15/Resources/";
      var bumpUrl;

      switch ( textureId){
        case 0:
          textureUrl += "Concrete_005_Tex0_Diff.tga";
          break;
        case 1:
          textureUrl += "Grass_002_Tex0_Diff.tga";
          break;
        case 2:
          textureUrl += "Marble_001_Tex0_Diff.tga";
          break;
        case 3:
          bumpUrl = textureUrl + "Wood_006_Tex0_Nrml.tga";
          textureUrl += "Wood_006_Tex0_Diff.tga";
          break;
      }

      this.setDefaults();
      var scene = this.attr( "scene" );
      let material = this.attr("ground").material;

      material.diffuseTexture = new BABYLON.Texture(textureUrl, scene);
      if (bumpUrl){
        material.bumpTexture = new BABYLON.Texture(bumpUrl, scene);
      }


    },

    resetGround () {
      if ( !this.attr( "customizeMode" ) ) {
        return;
      }
      if ( this.attr( "hasChanged" ) ) {
        let ground = this.attr( "ground" );
        ground.material.diffuseColor = this.attr( "defaultColor" );
        ground.material.diffuseTexture = this.attr( "defaultTexture" );
        ground.material.bumpTexture = this.attr( "defaultBump" );
      }
    },

    setDefaults () {
      if ( !this.attr( "hasChanged" ) ) {
        this.attr( "hasChanged", true );
        let ground = this.attr( "ground" );
        this.attr( "defaultColor", ground.material.diffuseColor );
        this.attr( "defaultTexture", ground.material.diffuseTexture );
        this.attr( "defaultBump", ground.material.bumpTexture );
      }
    },

    testLoadMaterialTexture( material, zipfile, type ){
      let scene = this.attr("scene");
      let engine = scene.getEngine();
      let vm = this;

      function setTexture( texture ){
        if (type === "diffuse"){
          material.diffuseTexture = texture;
        }else{
          material.bumpTexture = texture;
        }
      }

      return new Promise(function(resolve, reject){
        // Check if the texture is cached or not.
        // Need to add data: to the filename or it won't check against correct cache.
        if (!vm.checkIfTextureCached( "data:" + zipfile.name, engine )){
          zipfile.async("base64").then(function (data) {
            // Create the texture to add it to cache
            let texture = new BABYLON.Texture.CreateFromBase64String("data:image/png;base64," + data, zipfile.name, scene );
            setTexture(texture);
            resolve();
          }).catch(function (reason) {
            reject(reason);
          });
          // No need to do anything except update initialized count if the file already is cached.
        } else {
          let texture = new BABYLON.Texture("data:" + zipfile.name, scene );
          setTexture(texture);
          resolve();
        }
      });

    },

    testSetStudioMaterial( mesh, meshId ){

      let vm = this;
      function setMaterial( zipUrl, color ){

        if (!vm.studioMaterials[ meshId ] ){
          //let url = vm.static3DAssetPath + "LS_15/Resources/" + diffuseUrl;
          const root = vm.static3DAssetPath + "LS_15/Resources/";
          let scene = vm.attr("scene");
          let material = new BABYLON.StandardMaterial(zipUrl, scene);
          //material.diffuseTexture = new BABYLON.Texture( url, scene);

          let promise = new Promise( function(resolve, reject){


            vm.testLoadZip({
              filename: zipUrl,
              root: root
            }).then(function(zip){

              let finished = 0;
              let onFinish = function(){
                finished++;
                if (finished >= textures.length){



                  resolve(material);
                }
              }

              let textures = [];

              for (var key in zip.files) {
                if (key.endsWith(".png")){
                  textures.push(zip.files[key]);
                }
              }

              for (var i = 0; i < textures.length; ++i){
                let texture = textures[i];
                if (texture.name.endsWith("Diff.png")){

                  vm.testLoadMaterialTexture( material, texture, "diffuse").then(onFinish);
                } else if (texture.name.endsWith("Nrml.png")){
                  vm.testLoadMaterialTexture( material, texture, "normal").then(onFinish);
                }

              }

            }, function(error){
              console.log(error);
            });
          });



          material.specularColor = new BABYLON.Color3(0,0,0);
          vm.studioMaterials[ meshId ] = promise;
        }

        vm.studioMaterials[ meshId ].then(function( material ){
          mesh.material = material.clone();

          const uScale = 0.19995;
          const vScale = 0.225;

          mesh.material.diffuseTexture.uScale = uScale;
          //mesh.material.diffuseTexture.vScale = 0.228;
          mesh.material.diffuseTexture.vScale = vScale;
          if (mesh.material.bumpTexture){
            mesh.material.bumpTexture.uScale = uScale;
            mesh.material.bumpTexture.vScale = vScale;
          }

          if (color){
            mesh.material.diffuseColor = color;
          }

        });
      }

      let suffix = "_Tex0.zip";

      switch( meshId ){
        // 43
        case 1:
        case 2:
        case 3:
        case 15:
          meshId = 1;
          setMaterial("Plaster_001" + suffix);
          break;
        // 19
        case 5:
          setMaterial("Concrete_008" + suffix);
          break;
        // 17
        case 4:
        case 6:
        case 7:
        case 8:
        case 14:
        case 16:
          meshId = 4;
          setMaterial("Concrete_006" + suffix);
          break;
        // 132
        case 9:
        case 10:
        case 12:
        case 13:
          meshId = 9;
          setMaterial("Wood_017" + suffix);
          break;
        case 11:
          setMaterial("Plaster_011" + suffix);
          break;
        // Window frame
        case 666:
          setMaterial("Tile_Concrete_001" + suffix, new BABYLON.Color3(0.1, 0.1 ,0.1));
          break;
        // GlassIn
        case 999:
          //mesh.material = new BABYLON.StandardMaterial("window", this.attr("scene"));
          mesh.visibility = 0;
          break;
      }
    },



    initTestGroundPlane () {
      var vm = this;
      var scene = this.attr( "scene" );
      var position = new BABYLON.Vector3(0, 0, 0);
      // For patio
      //var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, Math.PI, Math.PI * 0.5 );
      var rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0 );

      const root = this.attr( "static3DAssetPath" ) + "LS_15/";

      this.testloadModelZip({
        filename: "output.zip",
        physics: false,
        position: position,
        root: root,
        rotation:rotation,
        rotateNormals: true,
        taskname: "ground",
        skipTag:true,
        skipshadow: true,
        success: function(a_item){

          let nodes = {};
          let nodesOrder = [];
          let count = 1;
          for (var i = 0; i < a_item.meshes.length; ++i){
            var mesh = a_item.meshes[i];

            if (mesh._tags){
              mesh.tag = 1;
              mesh.label = mesh.id;

              if (mesh.id === "74_GlassIn_001" || mesh.id === "73_GlassOut_001"){
                vm.testSetStudioMaterial(mesh, 999);
              } else if (mesh.id === "72_WindowFrame_001" || mesh.parent.id === "52_DoorFrame_LOD0") {
                vm.testSetStudioMaterial(mesh, 666);

              } else if (mesh.parent.id === "44_Balcony_001_LOD0") {
                vm.testSetStudioMaterial(mesh, 4);
              }
              else {
                let meshId = parseInt( Object.keys( mesh._tags )[ 0 ].replace( "meshId_", ""), 10 );
                vm.testSetStudioMaterial(mesh, meshId);
              }
            }
          } // End for
        }
      });
    },

    testSetPhysicsImpostor ( mesh ) {
      var scene = this.attr( "scene" );

      console.log(mesh);
      var physicsImpostor = new BABYLON.PhysicsImpostor(
        mesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, restitution: 0.8 },
        scene
      );
      mesh.physicsImpostor = physicsImpostor;

      // On collision with the floor
      physicsImpostor.registerOnPhysicsCollide( this.backgroundImpostors, function ( physImpos, collidedWithPhysImpos ) {
        console.log("colliding");
        setTimeout(function(){
          physicsImpostor.dispose();
            physImpos.object.position.y = 0;
        }, 1);
      });
    },

    testToggleLights () {
      var scene = this.attr ( "scene" );
      var hasPointlight = this.attr( "hasPointlight" );
      var normalDirLight = this.attr( "normalDirLight" );
      var pointLight = this.attr( "pointLight" );
      var hemisphericPointLight = this.attr( "hemisphericPointLight" );
      var hemisphericLight = this.attr( "hemisphericLight" );

      if ( hasPointlight ) {
        scene.removeLight( pointLight );
        scene.removeLight( hemisphericPointLight );
        scene.addLight( hemisphericLight );
        scene.addLight( normalDirLight );
      } else {
        scene.addLight( pointLight );
        scene.addLight( hemisphericPointLight );
        scene.removeLight( hemisphericLight );
        scene.removeLight( normalDirLight );
      }

      this.attr( "hasPointlight", !hasPointlight );
    },

    testUpdatePointLights () {
      var hasPointlight = this.attr( "hasPointlight" );
      var pointLight = this.attr( "pointLight" );

      var spr = 30; //seconds per rotation
      var percentOfRotation = ( ( Date.now() / 1000 ) % spr ) / spr;
      var degrees = percentOfRotation * 360;
      var radians = degrees * Math.PI / 180;

      if ( hasPointlight ) {
        let radius = 3.5;
        pointLight.position.x = radius * Math.cos( radians );
        pointLight.position.z = radius * Math.sin( radians );
      }
    },
  /* end Demo/Test Functions */

  addToShadowGenerator ( mesh ) {
      this.attr( "shadowGenerator" ).getShadowMap().renderList.push( mesh );
      this.attr( "dirShadowGenerator" ).getShadowMap().renderList.push( mesh );
  },

  initLights () {
    var scene = this.attr( "scene" );

    //This creates a light, aiming 0,1,0 - to the sky.
    var hemisphericLight = new BABYLON.HemisphericLight( "light1", new BABYLON.Vector3( 0, 1, 0 ), scene );
    const groundColor = 1;
    hemisphericLight.groundColor = new BABYLON.Color3( groundColor, groundColor, groundColor );
    hemisphericLight.intensity = 0.85;

    var normalDirLight = new BABYLON.DirectionalLight("dirlight1", new BABYLON.Vector3(0, -1, 0), scene);
    
    var dirShadowGenerator = new BABYLON.ShadowGenerator( 1024, normalDirLight );
    dirShadowGenerator.setDarkness( 0 );
    // dirShadowGenerator.useBlurVarianceShadowMap = true;
    dirShadowGenerator.bias *= 0.05;

    var pointLight = new BABYLON.PointLight( "pointlight", new BABYLON.Vector3( 0, 3, 0 ), scene );

    var hemisphericPointLight = new BABYLON.HemisphericLight( "hemispoint", new BABYLON.Vector3( 0, 1, 0 ), scene );
    hemisphericPointLight.intensity = 0.8;
    //hemisphericPointLight.groundColor = new BABYLON.Color3( groundColor, groundColor, groundColor );

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
      dirShadowGenerator,
      pointLight,
      hemisphericPointLight,
      shadowGenerator
    });
  },

  initScene () {
    var scene = this.attr( "scene" );
    scene.clearColor = new BABYLON.Color3( 1, 1, 1 );

    window.scene = scene;
    window.BABYLON = BABYLON;

    // Gravity & physics stuff
    var physicsPlugin = new BABYLON.CannonJSPlugin();
    var gravityVector = new BABYLON.Vector3( 0, -9.9807, 0 );

    scene.enablePhysics( gravityVector, physicsPlugin );

    scene.collisionsEnabled = true;
    scene.workerCollisions = true;

    var camera = this.initCamera();

    BABYLON.StandardMaterial.AmbientTextureEnabled = false;

    BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
    if (this.attr("debug")){
      scene.debugLayer.show();
    }
  }
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
    },
    inserted () {
      var vm = this.viewModel;
      var canvas = this.element.find( "canvas" )[ 0 ];
      var engine = new BABYLON.Engine( canvas, true );
      var scene = new BABYLON.Scene( engine );
      vm.attr({
        "canvas": canvas,
        "engine": engine,
        "scene": scene,
        "renderLoop": function () {
          vm.attr({
            "deltaTime": engine.deltaTime,
            "renderCount": renderCount
          });

          scene.render();
          renderCount = ( renderCount + 1 ) % 100;

          vm.testUpdatePointLights();
        }
      });
      vm.initScene();

      vm.initTestGroundPlane();

      vm.initLights();
      vm.initSkybox();
      vm.setSkyboxMaterial( "ely_lakes", "lakes" );

      vm.initTestSceneModels();

      var renderCount = 0;

      engine.runRenderLoop(vm.renderLoop);

      controls[ "context" ] = this.viewModel;
      getControls().registerControls( controls.name, controls );

      return;
    },
    removed () {
      getControls().removeControls( controls.name );
    }
  }
});