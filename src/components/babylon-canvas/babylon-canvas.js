import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './babylon-canvas.less!';
import template from './babylon-canvas.stache!';
import Babylon from 'babylonjs/babylon.max';
import { isServer } from '../../util/environment';
import { ObjLoader } from './bjorn-tests/lib/babylon.objFileLoader.js';
//import './bjorn-tests/lib/cannon.js';
//import { debug3d } from './bjorn-tests/debug3d.js';
import { getControls, getTooltip } from '../../util/util.js';

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
    return new Babylon.AssetsManager( scene );
  },

  // This creates and positions a free camera
  initCamera () {
    var scene = this.attr( "scene" );
    //var camera = new Babylon.FreeCamera( "camera1", new Babylon.Vector3(0, 5, -10), scene );
    var camera = new Babylon.TargetCamera( "camera1", new Babylon.Vector3( -3, 1.5, -4 ), scene );
    //var camera = new Babylon.Camera( "camera1", new Babylon.Vector3(0, 5, -10), scene );
    this.attr( "camera", camera );

    //setTimeout( ()=> {
    //  camera.position.z = -7;
    //}, 4000);
    //setTimeout( ()=> {
    //  camera.setTarget( Babylon.Vector3.Zero() );
    //}, 7000);

    camera.speed *= 0.25;

    // This targets the camera to scene origin
    //camera.setTarget( Babylon.Vector3.Zero() );
    camera.setTarget( new Babylon.Vector3( 0, 1.25, 0 ) );

    // This attaches the camera to the canvas
    camera.attachControl( this.attr( "canvas" ), false );

    return camera;
  },


  selectedMesh: null,
  pickingItem ( $ev, normalizedKey, held, deltaTime ) {
    // Return pickingInfo for first object hit except ground
    var scene = this.attr( "scene" );
    var controlsVM = getControls();
    var mouseMoveCurPos = controlsVM.attr( "mouseMoveCurPos" );
    var pageX = mouseMoveCurPos.attr( "x" );
    var pageY = mouseMoveCurPos.attr( "y" );
    var pickingInfo = scene.pick( pageX, pageY, function(a_hitMesh){
      return a_hitMesh.tag === 1;
    });
    var selectedMesh = this.attr( "selectedMesh" );
    // If the info hit a mesh that isn't the ground then outline it
    if ( pickingInfo.hit && !this.attr( "customizeMode" ) ) {
      var mesh = pickingInfo.pickedMesh;

      if (selectedMesh !== mesh){
        this.setMeshOutline( mesh );
      }
      getTooltip().set( "meshHover", mesh.name, "fa-archive", "Click to Manage", pageX, pageY );
    // Else remove outline
    } else {
      if (selectedMesh){
        selectedMesh.renderOutline = false;
        if (selectedMesh.e_siblings){
          for ( var i = 0; i < selectedMesh.e_siblings.length; ++i){
            selectedMesh.e_siblings[i].renderOutline = false;
          }
        }
        getTooltip().clear( "meshHover" );
        this.attr( "selectedMesh", null );
      }
    }
  },

  setMeshOutline ( a_mesh, a_skipSinblings ) {
    if ( !a_skipSinblings) {
      let selectedMesh = this.attr( "selectedMesh" );
      if ( selectedMesh ){
        selectedMesh.renderOutline = false;
        if (selectedMesh.e_siblings){
          for ( var i = 0; i < selectedMesh.e_siblings.length; ++i){
            selectedMesh.e_siblings[i].renderOutline = false;
          }
        }
      }

      if (a_mesh.e_siblings){
        for ( var i = 0; i < a_mesh.e_siblings.length; ++i){
          this.setMeshOutline(a_mesh.e_siblings[i], true);
        }
      }
      this.attr( "selectedMesh", a_mesh );
    }

    a_mesh.renderOutline = true;
    // rgb( 86, 170, 206)
    a_mesh.outlineColor = new Babylon.Color3(0.3359375, 0.6640625, 0.8046875);
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
    var skyboxMaterial = new Babylon.StandardMaterial( "skyBox", scene );

    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new Babylon.CubeTexture( skyboxImgs, scene );
    skyboxMaterial.reflectionTexture.coordinatesMode = Babylon.Texture.SKYBOX_MODE;

    skyboxMaterial.diffuseColor = new Babylon.Color3( 0, 0, 0 );
    skyboxMaterial.specularColor = new Babylon.Color3( 0, 0, 0 );

    skybox.material = skyboxMaterial;

    return skyboxMaterial;
  },

  initSkybox () {
    var scene = this.attr( "scene" );
    var skybox = Babylon.Mesh.CreateBox( "skyBox", 1000, scene );
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
      var normals = mesh.getVerticesData( Babylon.VertexBuffer.NormalKind );
      var rotationQuat = Babylon.Quaternion.RotationYawPitchRoll( 0,  Math.PI * 1.5, 0 );

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

      mesh.setVerticesData( Babylon.VertexBuffer.NormalKind, normals );
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

          //var positions = mesh.getVerticesData( Babylon.VertexBuffer.PositionKind );
          //var normals = mesh.getVerticesData( Babylon.VertexBuffer.NormalKind );
          //
          //Babylon.VertexData.ComputeNormals( positions, mesh.getIndices(), normals );

          if ( options.rotateNormals ) {
            vm.rotateNormals( mesh );
          }

          if ( !options.skipTag ) {
            mesh.tag = 1;
          }

          mesh.receiveShadows = true;
          mesh.position = options.position;
          mesh.rotationQuaternion = options.rotation;

          vm.addToShadowGenerator( mesh );

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

    initTestSceneModels () {
      var loader = this.getAssetsManager();

      var rotateNormals = true;

      var position = new Babylon.Vector3(0, 0, 0);
      var rotation = Babylon.Quaternion.RotationYawPitchRoll(0,0,0);
      this.testLoadModel({
        filename: "Colo_Rug_Fab_LtBrown_001.obj",
        //filename: "StoneWall_LOW.obj",
        physics: false,
        position: position,
        rotation:rotation,
        rotateNormals: rotateNormals,
        taskname: "rug"
      }, loader);

      position = new Babylon.Vector3(2, 1, 0);
      rotation = Babylon.Quaternion.RotationYawPitchRoll(Math.PI * -0.5, 0, 0);
      this.testLoadModel({
        filename: "West_Chair_Leath_Brown_001.obj",
        physics: true,
        position: position,
        rotation:rotation,
        rotateNormals: rotateNormals,
        taskname: "chair"
      }, loader);

      position = new Babylon.Vector3(-2, 1, 0);
      rotation = Babylon.Quaternion.RotationYawPitchRoll(Math.PI * 0.5, 0, 0);
      this.testLoadModel({
        filename: "West_Chair_Leath_Brown_001.obj",
        physics: true,
        position: position,
        rotation:rotation,
        rotateNormals: rotateNormals,
        taskname: "chair"
      }, loader);

      position = new Babylon.Vector3(0, 1, 2);
      rotation = Babylon.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
      this.testLoadModel({
        filename: "West_Chair_Leath_Brown_001.obj",
        physics: true,
        position: position,
        rotation:rotation,
        rotateNormals: rotateNormals,
        taskname: "chair"
      }, loader);

      position = new Babylon.Vector3(0, 1, -2);
      rotation = Babylon.Quaternion.RotationYawPitchRoll(0, 0, 0);
      this.testLoadModel({
        filename: "West_Chair_Leath_Brown_001.obj",
        physics: true,
        position: position,
        rotation:rotation,
        rotateNormals: rotateNormals,
        taskname: "chair"
      }, loader);


      position = new Babylon.Vector3(0, 3, 0);
      rotation = Babylon.Quaternion.RotationYawPitchRoll(0, 0, 0);
      this.testLoadModel({
        filename: "KidsPrin_CeFan_Wd_LtPurp_001.obj",
        physics: false,
        position: position,
        rotation:rotation,
        rotateNormals: !rotateNormals,
        taskname: "bedfan"
      }, loader);

      position = new Babylon.Vector3(0, 1, 0);
      rotation = Babylon.Quaternion.RotationYawPitchRoll(0, 0, 0);
      this.testLoadModel({
        filename: "KidsJng_Bed_Wd_LtBrown_002.obj",
        physics: true,
        position: position,
        rotation:rotation,
        rotateNormals: rotateNormals,
        taskname: "bed"
      }, loader);

      loader.load();
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
          color = new Babylon.Color3(73/255, 71/255, 63/255);
          break;
        case 1:
          color = new Babylon.Color3(149/255, 228/255, 147/255);
          break;
        case 2:
          color = new Babylon.Color3(232/255, 74/255, 74/255);
          break;
        case 3:
          color = new Babylon.Color3(104/255, 191/255, 193/255);
          break;
        case 4:
          color = new Babylon.Color3(1, 1, 0.3);
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
      this.attr( "ground" ).material.diffuseTexture = new Babylon.Texture(textureUrl, scene);
      if (bumpUrl){
        this.attr( "ground" ).material.bumpTexture = new Babylon.Texture(bumpUrl, scene);
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


    excludeMeshForLight ( a_mesh ) {
      this.attr( "hemisphericLight" ).excludedMeshes.push(a_mesh);
      //this.attr( "normalDirLight" ).excludedMeshes.push(a_mesh);
    },

    initTestGroundPlane () {
      var vm = this;
      var scene = this.attr( "scene" );
      var loader = new Babylon.AssetsManager(scene);

      var position = new Babylon.Vector3(0, 0, 0);
      var rotation = Babylon.Quaternion.RotationYawPitchRoll(0,0,0);

      var meshId = -1;

      this.testLoadModel({
        filename: "Patio_001_LOD0.obj",
        physics: false,
        position: position,
        root: this.attr( "static3DAssetPath" ) + "LS_15/",
        rotation:rotation,
        rotateNormals: true,
        taskname: "ground",
        skipTag:true,
        success: function(a_item){

          for (var i = 0; i < a_item.meshes.length; ++i){
            var mesh = a_item.meshes[i];
            mesh.collisionsEnabled = true;
            mesh.receiveShadows = true;

            if (mesh.id === "Floor_001"){
              meshId = i;
              mesh.physicsImpostor = new Babylon.PhysicsImpostor(mesh, Babylon.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.5 }, scene);
              vm.attr( "ground", mesh );

              vm.excludeMeshForLight(mesh);
            }
          }
        }
      }, loader);

      loader.load();
    },

    testSetPhysicsImpostor ( mesh ) {
      var scene = this.attr( "scene" );
      var ground = this.attr( "ground" );

      var physicsImpostor = new Babylon.PhysicsImpostor(
        mesh,
        Babylon.PhysicsImpostor.BoxImpostor,
        { mass: 1, restitution: 0.8 },
        scene
      );
      mesh.physicsImpostor = physicsImpostor;
      
      // On collision with the floor
      physicsImpostor.registerOnPhysicsCollide( ground.physicsImpostor, function ( physImpos, collidedWithPhysImpos ) {
        setTimeout(function(){
          physicsImpostor.dispose();
          if ( collidedWithPhysImpos.object.id === "Floor_001" ) {
            physImpos.object.position.y = 0;
          }
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
    this.attr( "hemisShadowGen" ).getShadowMap().renderList.push( mesh );
  },

  initLights () {
    var scene = this.attr( "scene" );

    //This creates a light, aiming 0,1,0 - to the sky.
    var hemisphericLight = new Babylon.HemisphericLight( "light1", new Babylon.Vector3( 0, 1, 0 ), scene );
    hemisphericLight.groundColor = new Babylon.Color3( 1, 1, 1 );
    hemisphericLight.intensity = 1.0;

    var normalDirLight = new Babylon.PointLight("dirlight1", new Babylon.Vector3(0, 20, 0), scene);
    
    var hemisShadowGen = new Babylon.ShadowGenerator( 1024, normalDirLight );
    hemisShadowGen.setDarkness( 0.75 );
    hemisShadowGen.usePoissonSampling = true;
    hemisShadowGen.bias *= 0.5;

    var pointLight = new Babylon.PointLight( "pointlight", new Babylon.Vector3( 0, 3, 0 ), scene );

    var hemisphericPointLight = new Babylon.HemisphericLight( "hemispoint", new Babylon.Vector3( 0, 1, 0 ), scene );
    hemisphericPointLight.intensity = 0.2;

    scene.removeLight( pointLight );
    scene.removeLight( hemisphericPointLight );

    // Shadows
    var shadowGenerator = new Babylon.ShadowGenerator( 1024, pointLight );
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
    scene.clearColor = new Babylon.Color3( 1, 1, 1 );

    // Gravity & physics stuff
    var physicsPlugin = new Babylon.CannonJSPlugin();
    var gravityVector = new Babylon.Vector3( 0, -9.81, 0 );

    scene.enablePhysics( gravityVector, physicsPlugin );

    scene.collisionsEnabled = true;
    scene.workerCollisions = true;

    var camera = this.initCamera();

    // Z axis is above/below
    // var dirLight = new Babylon.DirectionalLight("dirlight1", new Babylon.Vector3(1, 0, 0), scene);
    Babylon.StandardMaterial.AmbientTextureEnabled = false;

    Babylon.OBJFileLoader.OPTIMIZE_WITH_UV = true;
    //scene.debugLayer.show();
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
    "*": "pickingItem",
    "Right": function ( $ev ) {
      //
    }
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
      if ( isServer ) {
        return;
      }

      ObjLoader();
      //debug3d();

      var vm = this.viewModel;
      var canvas = this.element.find( "canvas" )[ 0 ];
      var engine = new Babylon.Engine( canvas, true );
      var scene = new Babylon.Scene( engine );
      vm.attr({
        "canvas": canvas,
        "engine": engine,
        "scene": scene
      });

      vm.initScene();

      vm.initTestGroundPlane();

      vm.initLights();
      vm.initSkybox();
      vm.setSkyboxMaterial( "ely_lakes", "lakes" );

      vm.initTestSceneModels();

      var renderCount = 0;
      engine.runRenderLoop(function () {
        vm.attr({
          "deltaTime": engine.deltaTime,
          "renderCount": renderCount
        });

        scene.render();
        renderCount = ( renderCount + 1 ) % 100;

        vm.testUpdatePointLights();
      });

      controls[ "context" ] = this.viewModel;
      getControls().registerControls( controls.name, controls );

      return;
    },
    removed () {
      if ( isServer ) {
        return;
      }
      getControls().removeControls( controls.name );
    }
  }
});