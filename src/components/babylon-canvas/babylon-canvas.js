import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './babylon-canvas.less!';
import template from './babylon-canvas.stache!';
import _find from 'lodash/find.js';

import 'cannon';
import BABYLON from 'babylonjs/babylon.max';

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
 * center: BABYLON.Vector3,
 * children: EgowallItem[],
 * lastSurfaceNormal: undefined|BABYLON.Vector3,
 * meshes: BABYLON.Mesh[],
 * name: string,
 * options: *,
 * parent: EgowallItem|null,
 * parentInitialRotation: undefined|BABYLON.Quaternion,
 * rootMeshes: BABYLON.Mesh[],
 * size: Size
 * }} EgowallItem
 */
/**
 * @typedef {{ hit: BABYLON.Mesh, furniture: BABYLON.Mesh }} CollisionResult
 */
/**
 * @typedef {{x:Number, y:Number}} Vector2
 */
/**
 * @typedef {{x:Number, y:Number, z:Number}} Vector3
 */
/**
 * @typedef {{width:Number, height:Number, depth:Number}} Size
 */

/*
  Added BABYLON.Mesh properties:
  __itemRef: For the EgowallItem reference
 __outlineMat: Stored outline material for on/after render and also if it gets outlined again
 __savedMaterial: The original mat when not using the outlineMaterial
 */

export const ViewModel = Map.extend({
  define: {
    items: {
      value:[],
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
  outlineSharedMaterial: null,
  outlineRT: null,
  // The color used by emissiveColor to detect the meshes in the outlineRT
  outlineFindColor: BABYLON.Color3.Red(),
  // The outline color when colliding
  outlineCollisionColor: BABYLON.Color3.Red(),
  // The outline color when not colliding
  outlineOKColor: BABYLON.Color3.Blue(),
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
      // Disable postProcess since outline is no longer needed
      this.attr("scene").postProcessesEnabled = false;
      this.attr("outlineRT").refreshRate = 0;
    }
  },
  /**
   *
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
    // Clear the list but keep the array reference
    // this.attr("outlineRT").renderList.length = 0;
    this.attr("outlineRT").renderList.length = 0;
  },

  setMeshOutline ( mesh ) {
    let hoveredMesh = this.attr( "hoveredMesh" );

    if ( hoveredMesh ){
      this.clearMeshOutline( hoveredMesh );
    }

    var groupedMeshes = this.getGroupedMeshesFromMesh( mesh );
    let scene = this.attr("scene");

    // Enable the post process if it's disabled
    if ( !scene.postProcessesEnabled ){
      scene.postProcessesEnabled = true;
      // Set the outline RT to refreshRate every 2 frames
      this.outlineRT.refreshRate = 2;
    }

    for ( let i = 0; i < groupedMeshes.length; ++i ) {
      let curMesh = groupedMeshes[ i ];

      if (!curMesh.__outlineMat){
        let outlineMaterial = this.createOutlineMaterial( curMesh.material );
        curMesh.__outlineMat = outlineMaterial;
      }

      this.outlineRT.renderList.push(curMesh);
    }

    this.attr( "hoveredMesh", mesh );
  },

  /**
   * Check if a material has transparency enabled
   * @param {BABYLON.StandardMaterial} material
   */
  checkTransparency( material ){
    if (material.diffuseTexture && material.diffuseTexture.hasAlpha){
      return true;
    } else if (material.useAlphaFromDiffuseTexture){
      return true;
    } else if (material.opacityTexture){
      return true;
    } else if (material.needAlphaBlending()){
      return true;
    }

    return false;
  },

  /**
   * Removes unneeded textures and adds emissiveColor
   * @param BABYLON.StandardMaterial material
   */
  cleanOutlineMaterial( material ){
    if (material.bumpTexture) {
      delete material.bumpTexture;
    }

    material.useSpecularOverAlpha = false;
    material.disableLighting = true;

    material.emissiveColor = this.outlineFindColor;
  },

  /**
   * Create an outline material based off material input.
   * If the material input is undefined then create a new StandardMaterial
   * @param id
   * @param material
   */
  createOutlineMaterial( material ){
    let scene = this.attr("scene");

    // If the material has transparency then we clone the material otherwise use the shared reference
    let outlineMat;

    let hasTransparency = false;

    // Check for transparency
    if (material){
      if (material.subMaterials) {
        for (let i = 0; i < material.subMaterials.length; ++i){
          if ( this.checkTransparency( material.subMaterials[i] ) ){
            hasTransparency = true;
            break;
          }
        }
      } else {
        hasTransparency = this.checkTransparency( material );
      }
    }

    if ( hasTransparency ){
      const matName = material.id + "_outline";
      // TODO: Check if material already exists since some objects share materials
      // Cloning unfreezes the material
      outlineMat = material.clone( matName, true );

      // Go over each submaterial if they exist
      if (outlineMat.subMaterials){
        for (let i = 0; i < outlineMat.subMaterials.length; ++i){

          let subMaterial = outlineMat.subMaterials[ i ];
          this.cleanOutlineMaterial( subMaterial );

          subMaterial.freeze();
        }
      } else {
        this.cleanOutlineMaterial( outlineMat );
      }

      material.freeze();
    // If no transparency then get the sharedOutlineMaterial reference
    } else{
      // All materials can use this
      outlineMat = this.getSharedOutlineMaterial();
    }

    return outlineMat;
  },

  //TODO: CanJS getter?
  getSharedOutlineMaterial(){
    // If the material hasn't been created yet then create it
    if (!this.outlineSharedMaterial){
      this.outlineSharedMaterial = new BABYLON.StandardMaterial("sharedOutline" , scene );
      this.outlineSharedMaterial.emissiveColor = this.outlineFindColor;
      this.outlineSharedMaterial.disableLighting = true;
      this.outlineSharedMaterial.freeze();
    }

    return this.outlineSharedMaterial;
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

        if (material.subMaterials){
          for (let j = 0; j < material.subMaterials.length; ++j){
            material.subMaterials[ j ].freeze();
          }
        }
        material.freeze();
      }
    }
    // Also freeze all multi materials
    let multiMaterials = this.attr("scene").multiMaterials;
    for ( let i = 0; i < multiMaterials.length; ++i ){
      let material = multiMaterials[i];
      if (material.subMaterials){
        for (let j = 0; j < material.subMaterials.length; ++j){
          material.subMaterials[ j ].freeze();
        }
      }
      material.freeze();
    }
  },
  // A big fps boost
  /**
   * Freezes the shadowmap rendertarget.
   */
  freezeShadowCalculations () {
    this.attr( "objDirLightShadowGen" ).getShadowMap().refreshRate = 0;
    this.updateShadowmap = false;
  },
  // TODO: Update logic to do this every 2 frames instead of every frame, should lower RT usage by a bit while moving an object
  /**
   * Unfreeze the shadowmap so the shadows can be updated. Happens when something moves/rotates
   */
  unfreezeShadowCalculations () {
    let shadowmap =  this.attr( "objDirLightShadowGen" ).getShadowMap();

    // Only do this once
    if ( shadowmap.refreshRate === 0 ){
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
  /**
   * Init the outline code setting up the post-process pipeline
   * @param {BABYLON.Scene} scene
   */
  initOutline(scene){
    BABYLON.Effect.ShadersStore["OutlineFragmentShader"]=
      "uniform sampler2D passSampler;"+
      "uniform sampler2D textureSampler;"+
      "uniform sampler2D maskSampler;"+
      "uniform vec3 uOutlineColor;"+
      "varying vec2 vUV;"+
      "void main(void)"+
      "{"+
      "vec4 orig = texture2D(passSampler, vUV);"+
      "vec4 mask = texture2D(maskSampler, vUV);"+
      "vec4 blur = texture2D(textureSampler, vUV);"+
      "float blurOutline = clamp((blur.r - mask.r) * 2.5, 0.0, 1.0);"+
      "vec3 color = orig.rgb * (1.0 - blurOutline) + blurOutline * vec3(0.0274509803921569, 0.6666666666666667, 0.9607843137254902);"+
      "gl_FragColor = vec4( color, 1.0 );"+
      "}";

    /*********** END OF SHADERSTORE ***********************/
    let camera = this.attr("camera");

    // setup render target
    var renderTarget = new BABYLON.RenderTargetTexture("outlineRT", 1024, scene, false);
    renderTarget.refreshRate = 0;
    this.attr("outlineRT", renderTarget);
    // Disable postProcess so the setMeshOutline function knows its disabled
    scene.postProcessesEnabled = false;
    scene.customRenderTargets.push(renderTarget);
    renderTarget.activeCamera = camera;

    renderTarget.onBeforeRender = function () {
      for (var i = 0; i < renderTarget.renderList.length; i++) {
        let mesh = renderTarget.renderList[i];

        if (mesh.__outlineMat) {
          mesh.__savedMaterial = mesh.material;
          mesh.material = mesh.__outlineMat;
        } else {
          console.log("NO OUTLINE MATERIAL FOUND");
        }
      }
    };

    renderTarget.onAfterRender = function () {
      for (var i = 0; i < renderTarget.renderList.length; i++) {
        let mesh = renderTarget.renderList[i];
        mesh.material = mesh.__savedMaterial;
      }
    };

    //setup post processing
    var tPass = new BABYLON.PassPostProcess("pass", 1.0, camera);

    var tDisplayPass = new BABYLON.DisplayPassPostProcess("displayRenderTarget", 1.0, camera);
    tDisplayPass.onApply = function (pEffect) {
      pEffect.setTexture("passSampler", renderTarget);
    };

    new BABYLON.BlurPostProcess("blurH", new BABYLON.Vector2(1.0, 0), 0.85, 0.25, camera);
    new BABYLON.BlurPostProcess("blurV", new BABYLON.Vector2(0, 1.0), 0.85, 0.25, camera);

    var tCombine = new BABYLON.PostProcess("combine", "Outline", null, ["passSampler", "maskSampler", "blurSampler"], 1.0, camera);

    tCombine.onApply = function (pEffect) {
      pEffect.setTexture("maskSampler", renderTarget);
      pEffect.setTextureFromPostProcess("passSampler", tPass);
    };

    // tCombine.onBeforeRender = function () {
    //   // engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
    // };
    //
    // tCombine.onAfterRender = function () {
    //   // engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
    // };
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

  /**
   * Extract position & rotation from ajaxData and then set the position & rotations for the rootMeshes
   * @param {BABYLON.Mesh[]} rootMeshes
   * @param info
   * @param {Boolean\ isPainting
   */
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
        // rootMesh.rotationQuaternion.multiplyInPlace( BABYLON.Quaternion.RotationYawPitchRoll(0, Math.PI * 1.5, Math.PI ) );
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
      center: new BABYLON.Vector3( 0, 0, 0 ),
      // Children items, what items should have same changes done as this item
      children: [],
      name: babylonName,
      options: itemInfo,
      meshes: [],
      // RootMeshes to easily update all positions when moving an item
      rootMeshes: [],
      // The parent item of this item.
      parent:null,
      // The total size of mesh furniture
      size: { width:0, height:0, depth:0 }
    };

    // rootMeshes hashmap to check if already added
    let rootMeshes = {};

    let minX = Number.MAX_VALUE,
      minY = Number.MAX_VALUE,
      minZ = Number.MAX_VALUE,
      maxX = -Number.MAX_VALUE,
      maxY =  -Number.MAX_VALUE,
      maxZ = -Number.MAX_VALUE;

    // TODO: Remove but used for debugging
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

        let parent = this.getRootMesh( mesh );

        // Check if rootMesh has already been added
        if (!rootMeshes[ parent.id ]){
          rootMeshes[ parent.id ] = true;
          item.rootMeshes.push( parent );
        }

        const boundingBox = mesh.getBoundingInfo().boundingBox;
        const minPoint = boundingBox.minimum;
        const maxPoint = boundingBox.maximum;
        if (minX > minPoint.x ){
          minX = minPoint.x;
        }
        if (minY > minPoint.y ){
          minY = minPoint.y;
        }
        if (minZ > minPoint.z ){
          minZ = minPoint.z;
        }
        if (maxX < maxPoint.x ){
          maxX = maxPoint.x;
        }
        if (maxY < maxPoint.y ){
          maxY = maxPoint.y;
        }
        if (maxZ < maxPoint.z ){
          maxZ = maxPoint.z;
        }
      }
      // Turn off collision & receiveShadows for terrain
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
      // This adds the _cid which is our uniqueId for now
      this.attr("items").push( item );
      // For paintings get itemInfo.roomInfo
      // For furniture just itemInf is fine
      const info = itemInfo.egoID ? itemInfo.roomInfo : itemInfo;
      // Set the position for all rootMeshes and rotation
      this.setMeshLocationFromAjaxData( item.rootMeshes, info, !!itemInfo.egoID );
    }
    let __itemRef = this.attr("items")[ this.attr("items").length -1 ];

    __itemRef.size.width = (maxX - minX) * 0.5;
    __itemRef.size.height = (maxY - minY) * 0.5;
    __itemRef.size.depth = (maxZ- minZ) * 0.5;
    __itemRef.center.copyFromFloats(minX + __itemRef.size.width, minY + __itemRef.size.height, minZ + __itemRef.size.depth);

    // Need to do this after the meshes loop because for the paintings it doesn't work inside the loop.
    // Also not using item.meshes because item.meshes only adds meshes with vertices
    for ( let i = 0; i < meshes.length; ++i ) {
      // Set the __itemRef here instead because when it gets pushed to the items list it becomes a canjs object and the references no longer are equal
      // This also ensures all meshes gets it and not just the ones with positions
      meshes[i].__itemRef = __itemRef;
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

    // terrainURL = "/src/static/3d/terrain.zip";

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

    // lightmapBundleURL = "/src/static/3d/LS_27_lightmap_1400.zip";

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
      // roomAssetURL = "/src/static/3d/ls27room.zip";
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

  /***************************************
   Temporary functions
   **************************************/

  updatePositions(a_item, a_positionDelta){
    for ( let i = 0; i < a_item.rootMeshes.length; ++i){
      let rootMesh = a_item.rootMeshes[i];

      rootMesh.position.addInPlace( a_positionDelta );

      this.updateMeshMatrices( rootMesh );
    }
  },

  /**
   * Adds the item parent to an item and if the item already had a parent then the item removes itself from the old parent.
   * @param {EgowallItem} a_item
   * @param {EgowallItem} a_parent
   */
  setItemParent(a_item, a_parent ){
    if (a_item.parent){

      if (a_parent == null){
        this.removeChild( a_item );
      }
      else if ( a_item.parent !== a_parent ){
        this.removeChild( a_item );
        this.setItemParent2( a_item, a_parent );
      }
      // Do nothing for same reference
    }
    else{
      if (a_parent){
        this.setItemParent2( a_item, a_parent );
      }
    }
  },

  /**
   * Sets the parent and sets position & rotation oorrectly
   * @param {EgowallItem} a_item
   * @param {EgowallItem} a_parent
   */
  setItemParent2( a_item, a_parent ){
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

      let parentQuaternion = rootMesh.parent.rotationQuaternion.clone();
      let parent = rootMesh.parent.parent;
      while (parent){
        parent.rotationQuaternion.multiplyToRef( parentQuaternion, parentQuaternion );
        parent = parent.parent;
      }

      // Clone the parentInitialRotation to later multiply with the child when splitting.
      a_item.parentInitialRotation = parentQuaternion;
      // Inverse it
      tmpQuat.copyFromFloats( -parentQuaternion.x, -parentQuaternion.y, -parentQuaternion.z, parentQuaternion.w );

      // We need to add the inverse quaternion to remove the rotation of the parent.
      // Else the rotation is very off!
      tmpQuat.multiplyToRef(rootMesh.rotationQuaternion, rootMesh.rotationQuaternion);
      // We need to use absolute position because the position gets really wrong after adding the the parent
      // My guess is the poseMatrix changes the local space
      rootMesh.setAbsolutePosition( tmpVector );

      this.updateMeshMatrices( rootMesh );
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
          // Remove parentInitialRotation
          child.parentInitialRotation.multiplyToRef( rootMesh.rotationQuaternion, rootMesh.rotationQuaternion );
          // Remove parentInitialRotation
          delete child.parentInitialRotation;
        }
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
  selectedFurnitureMeshes: {},
  // The meshes to check against for collision
  meshesToCheckFurniture: {},

  /**
   * Activate gravity for an item
   * @param {EgowallItem} a_item
   */
  activateGravity(a_item ){
    this.gravityItems.push ( a_item );
    let tmpVector = BABYLON.Tmp.Vector3[8];
    BABYLON.Vector3.FromFloatsToRef(0, 0.5, 0, tmpVector );
    this.updatePositions(a_item, tmpVector);
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

    // Remove the cached meshes & collision meshes arrays when removing gravity
    const id = a_item._cid;
    if (this.selectedFurnitureMeshes[ id ]){
      delete this.selectedFurnitureMeshes[ id ];
    }
    if ( this.meshesToCheckFurniture[ id ] ){
      delete this.meshesToCheckFurniture[ id ];
    }
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
   * Get all collidable meshes for a_selectedMeshes. Basically all the meshes except a_selectedMeshes
   * @param {BABYLON.Mesh[]} a_selectedMeshes
   * @param {BABYLON.Mesh[]} a_collisionMeshes
   */
  getCollidableMeshes( a_selectedMeshes, a_collisionMeshes ){

    let collidableMeshes = [];

    for (let i = 0; i < a_collisionMeshes.length; ++i){
      // Default to canCheck so it's true if no mesh was found
      let canCheck = true;
      let mesh = a_collisionMeshes[i];
      // Check all selectedMeshes to see if they are equal to mesh
      for ( let j = 0; j < a_selectedMeshes.length; ++j){
        if (mesh === a_selectedMeshes[j]){
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
   *
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
          parentCount[itemRef._cid] = { count: 0, item: itemRef };
        }

        parentCount[itemRef._cid].count++;
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
      return true;
    }

    return false;
  },

  /**
   * Update rotation of an item
   * @param {EgowallItem} a_item
   */
  updateRotation( a_item, a_rotation ){
    for ( let i = 0; i < a_item.rootMeshes.length; ++i){
      let rootMesh = a_item.rootMeshes[i];
      // TODO: Remove & Implement proper
      if (!a_rotation){
        rootMesh.rotationQuaternion.multiplyInPlace( BABYLON.Quaternion.RotationYawPitchRoll(Math.PI * 0.25,0,0)   );
      }

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
   * Updates a root mesh's matrix and the child meshes' matrices.
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

  /* Mesh movement code */
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
    function multiplyVector3(quat, vec3, vec3Dest) {

      quat = [ quat.x, quat.y, quat.z, quat.w ];
      vec3 = [ vec3.x, vec3.y, vec3.z ];

      vec3Dest = [];
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

    /*
     BABYLON.Tmp.Vector indices:
     8: deltaPosition
     7: Axis for rotation
     6: Center offset
     */
    // Can use the first rootMesh to calculate how much the object has to move
    // TODO: Evaluate if center between two rootMeshes would be neccesary for proper position
    let rootMesh = selectedItem.rootMeshes[0];

    const normal = pickingResult.getNormal(true);
    const itemUpVector = multiplyVector3(rootMesh.rotationQuaternion, this.upVector3);
    let tmpPositionDelta = BABYLON.Tmp.Vector3[8];

    pickingResult.pickedPoint.subtractToRef(rootMesh.position, tmpPositionDelta );

    let doRotation = true;
    const lastSurfaceNormal = selectedItem.lastSurfaceNormal;

    if (lastSurfaceNormal){
      if (lastSurfaceNormal.x === normal.x && lastSurfaceNormal.y === normal.y && lastSurfaceNormal.z === normal.z){
        doRotation = false;
      }
    }

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
      let tmpAxis = BABYLON.Tmp.Vector3[7];
      if (normal.y === 1){
        // If direction is up then use identity quaternion
        wallRotation = BABYLON.Tmp.Quaternion[0].copyFromFloats(0, 0, 0, 1);
      }
      else if (normal.y === -1){
        // Upside down rotation
        wallRotation = BABYLON.Tmp.Quaternion[0].copyFromFloats(0, 0, 1, 0);
      }
      else {
        // let tmpAxis = BABYLON.Tmp.Vector3[7];
        // Axis is [ 0, 0, 0 ] for y == 1 and y == -1
        BABYLON.Vector3.CrossToRef(upVector, normal, tmpAxis );
        tmpAxis.normalize();
        const angle = Math.acos(BABYLON.Vector3.Dot(upVector, normal));
        // TODO: in Babylon 2.5 change to use RotationAxisToRef
        // This normalizes tmpAxis
        wallRotation = BABYLON.Quaternion.RotationAxis( tmpAxis, angle);
        wallRotation.normalize();
      }

      // this.updatePositions( selectedItem, tmpPositionDelta);
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

  setBaseRotation( a_item ){
    a_item.baseRotation = a_item.rootMeshes[0].rotationQuaternion.clone();
  },
  getRootMesh(a_mesh ){
    let parent = a_mesh.parent || a_mesh;
    while (parent.parent){
      parent = parent.parent;
    }
    return parent;
  },

  getRootItem ( a_item ){
    const rootMesh = this.getRootMesh(a_item.rootMeshes[0]);
    return rootMesh.__itemRef;
  }
});

export const controls = {
  "name": "game-canvas",
  "context": null,
  "keypress": {
    "`": "toggleBabylonDebugLayer",
    "v": "unselectItem"
  },
  "click": {
    "Left" ( $ev, normalizedKey, heldInfo, deltaTime, controlsVM ) {
      if ( this.attr( "hoveredMesh" )) {
        // don't execute camera click on ground
        $ev.controlPropagationStopped = true;
        this.selectedItem = this.attr("hoveredMesh").__itemRef;

        if (this.selectedItem.parent){
          this.removeChild( this.selectedItem )
        }

        // Clone the reference because otherwise it'd get updated when changes are done to the selectedItem
        this.setBaseRotation( this.selectedItem );


        window.selectedItem = this.selectedItem;
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

      vm.initOutline(scene);

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
