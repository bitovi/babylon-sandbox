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

export const ViewModel = Map.extend({
  define: {
    items: {
      get ( last ) {
        return last || [];
      }
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
    var camera = new Babylon.TargetCamera( "camera1", new Babylon.Vector3( -3, 1.75, -4 ), scene );
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
    camera.setTarget( new Babylon.Vector3( 0, 1.5, 0 ) );

    // This attaches the camera to the canvas
    camera.attachControl( this.attr( "canvas" ), false );

    return camera;
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

      //TODO: new can.Deferred();
      var task = loader.addMeshTask(
        options.taskname || options.filename,
        "",
        this.attr( "static3DAssetPath" ),
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

          mesh.tag = 1;
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

    initTestGroundPlane () {
      var scene = this.attr( "scene" );
      var ground = Babylon.Mesh.CreateGround( "ground1", 6, 6, 2, scene );

      ground.collisionsEnabled = true;
      ground.receiveShadows = true;
      ground.physicsImpostor = new Babylon.PhysicsImpostor(
        ground,
        Babylon.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.5 },
        scene
      );
      
      ground.material = new Babylon.StandardMaterial( "groundmat", scene );
      ground.material.diffuseTexture = new Babylon.Texture( this.resourcePath( "slack-imgs.com.jpg" ), scene );
      ground.material.diffuseColor = new Babylon.Color3( 0x49 / 255, 0x47 / 255, 0x42 / 255 );
      ground.material.specularColor = new Babylon.Color3( 0, 0, 0 );

      this.attr( "ground", ground );

      return ground;
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
          if ( collidedWithPhysImpos.object.id === "ground1" ) {
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

    testUpdatePointLights ( deltaTime ) {
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

    var normalDirLight = new Babylon.DirectionalLight("dirlight1", new Babylon.Vector3(0, -1, 0), scene);
    
    var hemisShadowGen = new Babylon.ShadowGenerator( 1024, normalDirLight );
    hemisShadowGen.setDarkness( 0.5 );
    hemisShadowGen.usePoissonSampling = true;
    hemisShadowGen.bias *= 0.2;

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
      if ( 0 || isServer ) {
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

      // Register a render loop to repeatedly render the scene
      engine.runRenderLoop(function () {
        scene.render();

        vm.testUpdatePointLights( engine.deltaTime );
      });

      return;
    }
  }
});