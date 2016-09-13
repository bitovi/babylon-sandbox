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
 * baseRotation:BABYLON.Quaternion,
 * boundsMaximum: BABYLON.Vector3,
 * boundsMinimum: BABYLON.Vector3,
 * centerOffset: BABYLON.Vector3,
 * children: EgowallItem[],
 * inverseSurfaceRotation: BABYLON.Quaternion,
 * meshes: BABYLON.Mesh[],
 * name: string,
 * needSurfaceOffset: boolean,
 * options: *,
 * parent: EgowallItem|null,
 * parentInitialRotation: undefined|BABYLON.Quaternion,
 * rootMeshes: BABYLON.Mesh[],
 * size: BABYLON.Vector3,
 * surfaceNormal: BABYLON.Vector3,
 * surfaceOffset: BABYLON.Vector3
 * }} EgowallItem
 */
/**
 * @typedef {{ hit: BABYLON.Mesh, furniture: BABYLON.Mesh }} CollisionResult
 */
/**
 * @typedef {{x:Number, y:Number}} Vector2
 */

/**
 * @typedef {{valid:Boolean, error:undefined|string}} PlacementResult
 */

/**
 * @typedef {{
 * inverseSurfaceRotation: BABYLON.Quaternion,
 * needSurfaceOffset: babylon,
 * parent:undefined|EgowallItem
 * position:BABYLON.Vector3,
 * rotation: BABYLON.Quaternion,
 * scale: BABYLON.Vector3,
 * surfaceNormal: BABYLON.Vector3,
 * surfaceOffset: BABYLON.Vector3
 * }} SelectedBackup
 */

/**
 * @typedef {{
 *  bgtype: BG_TYPES,
 *  meshID: String,
 *  parentBabylonName: String,
 *  ajaxInfo: *
 *  materialID: String
 * }} BackgroundMeshInfo
 */

/*
  Added properties to a BABYLON.Mesh:
  __backgroundMeshInfo: For background meshes information.
  __itemRef: For the EgowallItem reference
  __outlineMat: Stored outline material for on/after render and also if it gets outlined again
  __savedMaterial: The original mat when not using the outlineMaterial
 */

// TODO: Find the best way to not have FURNITURE in there.
/**
 * Type
 * @type {{NOTYPE: number, FLOOR: number, WALL: number, CEILING: number, FURNITURE:number}} BG_TYPES
 */
const BG_TYPES = {
  // 0
  NOTYPE: 0b0000,
  // 1
  FLOOR: 0b0001,
  // 2
  WALL: 0b0010,
  // 4
  CEILING: 0b0100,
  // 8
  // Temporary should be refactored elsewhere or BG_TYPES renamed.
  FURNITURE: 0b1000
};

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
          // Set the child & parent relations now since all meshes has been loaded.
          this.setItemRelations();

          // Do a setTimeour because applyTerrainMaterials doesn't work correctly if freezing materials before all the changes has gone through.
          setTimeout( () => {
            this.freezeMaterials();
          }, 1);

          this.initPlacementGridMaterial();
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
  // Shared material by multiple outlineMaterials if no transparency is needed
  outlineSharedMaterial: null,
  // The renderTarget that has the outline meshes
  outlineRT: null,
  // The color used by emissiveColor to detect the meshes in the outlineRT
  outlineFindColor: BABYLON.Color3.Red(),
  // The outline color when colliding
  outlineCollisionColor: BABYLON.Color3.Red(),
  // The outline color when not colliding
  outlineOKColor: new BABYLON.Color3(0.0274509803921569, 0.6666666666666667, 0.9607843137254902),
  // The current color in use by outline shader
  // Uses the reference directly of either OK or Collision color
  outlineCurrentColor: null,
  // Constant stored for the upVector
  upVector3: BABYLON.Vector3.Up(),
  // The mesh that mouse is mouseovered if not null.
  hoveredMesh: null,
  // The selected item if left clicked
  selectedItem: null,
  // If the selectedItem has a valid position.
  selectedItemValidPosition: false,
  /**
   * @type null|SelectedBackup
   */
  selectedItemBackup: null,
  // The placement grid material used to ceate the blue gridded surface
  placementGridMaterial: null,
  // What meshis currently bluegridded
  placementGridMesh: null,
  // This creates and positions a free camera
  initCamera () {
    var scene = this.attr( "scene" );
    var camera = new BABYLON.TargetCamera( "camera1", new BABYLON.Vector3( -3, 1.5, -4 ), scene );
    this.attr( "camera", camera );

    camera.setTarget( new BABYLON.Vector3( 0, 1.25, 0 ) );
    camera.attachControl( this.attr( "canvas" ), false );

    return camera;
  },
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
    // If mouse is not on the canvas then don't even bother picking
    if ($ev.target.nodeName.toLowerCase() === "canvas") {
      if ( this.selectedItem ){
        // TODO: Either us if statement or a function variable to differentiate between furniture & painting movement
        // Currently this is for furniture only as painting isn't added as a selectedItem
        this.selectedItemFurnitureMovePicking( controlsVM.curMousePos() );
      // If selected isn't set
      } else {
        let curMousePos = controlsVM.curMousePos();
        let customizeMode = this.attr( "customizeMode" );
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
      if ( !this.selectedItem ){
        this.unsetHoveredMesh();
      }
    }
  },

  /**
   * Unset the hovered mesh if mouseover the canvas or no picking result
   * This also clears the outline of items
   */
  unsetHoveredMesh(){
    let hoveredMesh = this.attr( "hoveredMesh" );
    if ( hoveredMesh ) {
      this.clearItemsOutline();
      getTooltip().clear( "meshHover" );
      this.attr( "hoveredMesh", null );
      // Disable postProcess since outline is no longer needed,  otherwise the outline stays in screen.
      // Did not find a way to clear renderTarget :( . Besides disabling postProcess should improve performance.
      this.attr("scene").postProcessesEnabled = false;
      // I think this gives ~0.01ms faster render time
      this.attr("outlineRT").refreshRate = 0;
    }
  },
  /**
   * Get a picking result from mouse coordinates for the meshes that fulfill the predicate
   * @param {Vector2} mousePos
   * @param {Function} predicate
   * @returns {PickingInfo|*}
   */
  getPickingFromMouse( mousePos, predicate ){
    const scene = this.attr( "scene" );
    return scene.pick( mousePos.x, mousePos.y, predicate );
  },

  pickingBG ( hoveredMesh, pickingInfo, curMousePos ) {
    var mesh = pickingInfo.pickedMesh;
    var title = "Click to customize.<br>Press and hold right mouse to look around.";
    var message = mesh.name + " (" + mesh.__backgroundMeshInfo.meshID + ")";

    if ( hoveredMesh !== mesh ) {
      this.setHoveredOutline( mesh );
    }

    getTooltip().set( "meshHover", title, null, message, curMousePos.x, curMousePos.y );
  },

  pickingItem ( hoveredMesh, pickingInfo, curMousePos ) {
    var mesh = pickingInfo.pickedMesh;
    var name = mesh.name;

    if ( hoveredMesh !== mesh ) {
      this.setHoveredOutline( mesh );
    }

    getTooltip().set( "meshHover", name, "fa-archive", "Click to Manage", curMousePos.x, curMousePos.y );
  },

  pickingEgoObj ( hoveredMesh, pickingInfo, curMousePos ) {
    var mesh = pickingInfo.pickedMesh;
    var itemInfo = this.getItemOptionsFromMesh( mesh );
    var name = itemInfo.egoName || mesh.name;

    if ( hoveredMesh !== mesh ) {
      this.setHoveredOutline( mesh );
    }

    getTooltip().set( "meshHover", name, "fa-picture-o", "Click to Manage", curMousePos.x, curMousePos.y );
  },

  /**************************
   * Outline functions
   *************************/

  /**
   * Sets the layerMask to 0x0FFFFFFF for all meshes and clears the outline rendertarget's renderlist
   */
  clearItemsOutline () {

    let renderList = this.attr( "outlineRT" ).renderList;

    // Set the layerMask to 0x0FFFFFFF so the outlineCamera doesn't render them anymore
    for ( let i = 0; i < renderList.length; ++i ) {
      let mesh = renderList[ i ];
      mesh.layerMask = 0x0FFFFFFF;
      // Delete the savedMaterial but keep the outline material
      delete mesh.__savedMaterial;
    }
    // Clear the list but keep the array reference, no garbage collections here. We recycle!
    renderList.length = 0;
  },

  /**
   * Set the outline for a group of items
   * The item and all its children
   * @param {EgowallItem} item
   */
  setGroupOutline ( item ){
    let meshes = this.getChildMeshes( item );

    this.clearItemsOutline();
    this.setMeshesOutline( meshes );
  },

  /**
   * Set the outline for the hovered mesh
   * @param {BABYLON.Mesh} mesh
   */
  setHoveredOutline ( mesh ) {
    let hoveredMesh = this.attr( "hoveredMesh" );

    if ( hoveredMesh ){
      this.clearItemsOutline();
    }

    let groupedMeshes = this.getGroupedMeshesFromMesh( mesh );
    this.setMeshesOutline( groupedMeshes );

    this.attr( "hoveredMesh", mesh );
  },

  /**
   * Set the outline for a group of meshes
   * @param {BABYLON.Mesh[]} meshes
   */
  setMeshesOutline ( meshes ){
    let scene = this.attr("scene");
    // Enable the post process if it's disabled also enable renderTarget refresh rate
    if ( !scene.postProcessesEnabled ){
      scene.postProcessesEnabled = true;
      // Set the outline RT to refreshRate every 2 frames
      this.outlineRT.refreshRate = 1;
    }

    for ( let i = 0; i < meshes.length; ++i ) {
      let curMesh = meshes[ i ];
      // Set layermask to 0x2FFFFFFF so it's found by both cameras.
      // If setting 0x20000000 the furniture disappears and if using 0x0FFFFFFFF the outline isn't rendered
      curMesh.layerMask = 0x2FFFFFFF;

      // Create the outlineMaterial if it doesn't already exist
      if (!curMesh.__outlineMat){
        const outlineMaterial = this.createOutlineMaterial( curMesh.material );
        curMesh.__outlineMat = outlineMaterial;
      }

      this.outlineRT.renderList.push(curMesh);
    }
  },

  /**
   * Check if a material has transparency enabled
   * @param {BABYLON.StandardMaterial} material
   */
  checkTransparency( material ){
    if ( material.diffuseTexture && material.diffuseTexture.hasAlpha ){
      return true;
    } else if ( material.useAlphaFromDiffuseTexture ){
      return true;
    } else if ( material.opacityTexture ){
      return true;
    } else if ( material.needAlphaBlending() ){
      return true;
    }

    return false;
  },

  /**
   * Removes unneeded textures and adds emissiveColor
   * @param {BABYLON.StandardMaterial} material
   */
  cleanOutlineMaterial( material ){
    if ( material.bumpTexture ) {
      delete material.bumpTexture;
    }

    material.useSpecularOverAlpha = false;
    material.disableLighting = true;
    material.emissiveColor = this.outlineFindColor;
  },

  /**
   * Possibly create an outline material based off material input.
   * If the material has transparency then clone the input
   * Else set the outline material as the common shared outline mat
   * @param {BABYLON.MultiMaterial|BABYLON.StandardMaterial} material
   */
  createOutlineMaterial( material ){
    let scene = this.attr( "scene" );

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
      if ( outlineMat.subMaterials ) {
        for ( let i = 0; i < outlineMat.subMaterials.length; ++i ){

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
  getSharedOutlineMaterial() {
    // If the material hasn't been created yet then create it
    if (!this.outlineSharedMaterial){
      this.outlineSharedMaterial = new BABYLON.StandardMaterial( "sharedOutline" , this.attr( "scene" ));
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
        // Freeze all the submaterials,  although they should already be frozen by previous for loop
        for (let j = 0; j < material.subMaterials.length; ++j){
          material.subMaterials[ j ].freeze();
        }
      }
      material.freeze();
    }
  },
  // A big fps boost freezing the shadowmap rendertarget
  /**
   * Freezes the shadowmap rendertarget.
   */
  freezeShadowCalculations () {
    this.attr( "objDirLightShadowGen" ).getShadowMap().refreshRate = 0;
    this.updateShadowmap = false;
  },

  /**
   * Unfreeze the shadowmap so the shadows can be updated. Happens when something moves/rotates
   */
  unfreezeShadowCalculations () {
    let shadowmap =  this.attr( "objDirLightShadowGen" ).getShadowMap();

    // Only do this once
    if ( shadowmap.refreshRate === 0 ) {
      // Note: It has been tested using refreshRate = 2 for performance
      // but the shadow lags behind when doing fast movements creating a trailing effect
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
    scene.clearColor = new BABYLON.Color3( 0, 0, 0 );

    // Gravity & physics stuff
    var physicsPlugin = new BABYLON.CannonJSPlugin();
    var gravityVector = new BABYLON.Vector3( 0, -9.81, 0 );

    scene.enablePhysics( gravityVector, physicsPlugin );
    scene.gravity = gravityVector;
    scene.collisionsEnabled = true;
    scene.workerCollisions = false;

    var camera = this.initCamera();
  },

  /**
   * Init the outline code setting up the post-process pipeline
   * @param {BABYLON.Scene} scene
   */
  initOutline( scene ) {
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
      "vec3 color = blurOutline * uOutlineColor;"+
      "gl_FragColor = vec4( color, blurOutline );"+
      "}";

    /*********** END OF SHADERSTORE ***********************/
    let engine = scene.getEngine();
    let camera = this.attr( "camera" );

    let outlineCamera = new BABYLON.TargetCamera( "outlineCamera", new BABYLON.Vector3( 0, 0, 0), scene );
    // Need to set the Field of View the same
    outlineCamera.fov = camera.fov;
    outlineCamera.minZ = camera.minZ;

    outlineCamera.position = camera.position;
    outlineCamera.rotation = camera.rotation;
    // The layerMask for the outline camera
    outlineCamera.layerMask = 0x20000000;

    outlineCamera.setTarget( new BABYLON.Vector3( 0, 1.25, 0 ) );

    scene.activeCameras.push( camera, outlineCamera );

    // setup render target
    let renderTarget = new BABYLON.RenderTargetTexture( "outlineRT" , 1024, scene, false);
    renderTarget.refreshRate = 0;
    this.attr( "outlineRT" , renderTarget);
    // Default to OK blue!
    this.outlineCurrentColor = this.outlineOKColor;
    // this.outlineCurrentColor = this.outlineCollisionColor;

    // Disable postProcess so the setMeshOutline function knows its disabled
    scene.postProcessesEnabled = false;
    scene.customRenderTargets.push(renderTarget);
    renderTarget.activeCamera = outlineCamera;

    renderTarget.onBeforeRender = function () {
      for (let i = 0; i < renderTarget.renderList.length; i++) {
        let mesh = renderTarget.renderList[i];

        if (mesh.__outlineMat) {
          mesh.__savedMaterial = mesh.material;
          mesh.material = mesh.__outlineMat;
        }
      }
    };

    renderTarget.onAfterRender = function () {
      for (let i = 0; i < renderTarget.renderList.length; i++) {
        let mesh = renderTarget.renderList[i];
        mesh.material = mesh.__savedMaterial;
      }
    };

    //setup post processing
    let tPass = new BABYLON.PassPostProcess("pass", 1.0, outlineCamera);

    let tDisplayPass = new BABYLON.DisplayPassPostProcess("displayRenderTarget", 1.0, outlineCamera );
    tDisplayPass.onApply = function (pEffect) {

      pEffect.setTexture("passSampler", renderTarget);
    };

    // Create blur
    new BABYLON.BlurPostProcess("blurH", new BABYLON.Vector2(1.0, 0), 1, 0.25, outlineCamera);
    new BABYLON.BlurPostProcess("blurW", new BABYLON.Vector2(0, 1.0), 1, 0.25, outlineCamera);

    let tCombine = new BABYLON.PostProcess("combine", "Outline", null, ["passSampler", "maskSampler", "blurSampler", "uOutlineColor"], 1.0, outlineCamera);

    tCombine.onApply = (pEffect) => {
      pEffect.setTexture("maskSampler", renderTarget);
      pEffect.setTextureFromPostProcess("passSampler", tPass);
      pEffect.setColor3( "uOutlineColor", this.outlineCurrentColor );
    };

    // This is needed otherwise the screen goes white while outlining
    tCombine.onBeforeRender = function () {
      engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
    };

    tCombine.onAfterRender = function () {
      engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
    };
  },

  /**
   * Initialize the blue gridded material.
   */
  initPlacementGridMaterial: function() {
    let scene = this.attr("scene");
    let material = new BABYLON.StandardMaterial( "placementgrid", scene );

    material.disableLighting = true;
    // TODO: When the grid texture is on CDN add use this instead.
    material.emissiveTexture = new BABYLON.Texture( "https://cdn.testing.egowall.com//CDN_new/Game/PlacementGrid.png", scene );
    // material.emissiveColor = new BABYLON.Color3.FromHexString("#4FAEE5");

    this.placementGridMaterial = material;
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
   * @param {BABYLON.Mesh} mesh
   * @returns {BABYLON.Mesh}
   */
  getRootMesh( mesh ){
    let parent = mesh.parent || mesh;
    while ( parent.parent ){
      parent = parent.parent;
    }
    return parent;
  },

  /**
   * Get the root item from a group of items.
   * So if you do getRootItem( item ) and it has a parent you'll get the parent item instead of input item.
   * @param {EgowallItem} item
   * @returns {EgowallItem}
   */
  getRootItem (item ){
    const rootMesh = this.getRootMesh( item.rootMeshes[ 0 ] );
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
      if ( !rootMesh.rotationQuaternion ){
        rootMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
      }

      rootMesh.rotationQuaternion.x = rotX;
      rootMesh.rotationQuaternion.y = rotY;
      rootMesh.rotationQuaternion.z = rotZ;
      rootMesh.rotationQuaternion.w = rotW;

      // To currently show the paintings before they get the rotation from the walls
      if ( isPainting ){

        // rootMesh.rotation.y = Math.PI;
        // rootMesh.rotation.x = Math.PI / -2;
        rootMesh.rotationQuaternion.multiplyInPlace( BABYLON.Quaternion.RotationYawPitchRoll( 0, Math.PI * 1.5, Math.PI ) );
      }

      rootMesh.rotationQuaternion.normalize();
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
    /**
     * @type EgowallItem
     */
    let item = {
      // The base rotation of the item when moving it along surfaces.
      // Base rotation = rotation - current surfaceRotation
      baseRotation: BABYLON.Quaternion.Identity(),
      // The maximum values for the bounds ( bounding box )
      boundsMaximum: new BABYLON.Vector3( -Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE ),
      // The minimum values for the bounds
      boundsMinimum: new BABYLON.Vector3( Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
      // The center offset of item + children.
      // Is position + centerOffset = center
      centerOffset: BABYLON.Vector3.Zero(),
      // Children items, what items should have same changes done as this item
      children: [],
      name: babylonName,
      meshes: [],
      options: itemInfo,
      // RootMeshes to easily update all positions when moving an item
      rootMeshes: [],

      // The surface rotation of the item. The inverse is used to remove its rotation before applying the new rotation.
      // Is the inverse but when creating we can use identity still since identity has no impact or the inverse of an identity
      inverseSurfaceRotation: BABYLON.Quaternion.Identity(),
      // The parent item of this item.
      parent:null,
      // The size of the item + children
      // centerOffset.x + size.x * 0.5 = maximum x
      size: BABYLON.Vector3.Zero(),
      // The surface normal of the floor / furniture / something else that this item is attached to
      surfaceNormal: BABYLON.Vector3.Zero(),
      // The surface offset when moving the item across surfaces
      surfaceOffset: BABYLON.Vector3.Zero(),
      needSurfaceOffset: true
    };

    // rootMeshes hashmap to check if already added
    let rootMeshes = {};
    const isTerrain = itemInfo.terrain;

    // This adds the _cid which is our uniqueId for an EgowallItem
    this.attr("items").push( item );
    // Update the item reference since canjs created a new object?
    item = this.attr("items")[ this.attr("items").length - 1 ];

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
        if ( !rootMeshes[ parent.id ] ){
          rootMeshes[ parent.id ] = true;
          item.rootMeshes.push( parent );
        }
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        this.compareMinMax( item.boundsMinimum, item.boundsMaximum, boundingBox.minimumWorld, boundingBox.maximumWorld );
        // Turn off collision & receiveShadows for terrain
      } else {
        mesh.checkCollisions = false;
        mesh.receiveShadows = false;
        // Add the mesh to terrainMeshes to later in applyTerrainLightmap() foreach to setup the lightmap materials
        this.attr("terrainMeshes").push(mesh);
      }

      if ( parseInt( itemInfo.furnPhysics, 10 ) ) {
        //vm.testSetPhysicsImpostor( mesh );
      }
    } // End for meshes.length

    // Check if rootMeshes.length > 0 which it is unless it's terrain
    if ( item.rootMeshes.length > 0 ) {
      // For paintings get itemInfo.roomInfo
      // For furniture just itemInfo is fine
      const info = itemInfo.egoID ? itemInfo.roomInfo : itemInfo;

      this.itemUpdateCenterOffset( item );
      // Set the position for all rootMeshes and rotation
      this.setMeshLocationFromAjaxData( item.rootMeshes, info, !!itemInfo.egoID );
    }

    // Need to do this after the meshes loop because for the paintings it doesn't work inside the loop.
    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[ i ];

      // Add itemRef to all meshes except terrain.
      // Could do this in mainloop too but the mainloop stops for these meshes   if ( !positions )
      if ( !isTerrain ){
        mesh.__itemRef = item;
      }
      mesh.freezeWorldMatrix();
    }
  },
  /**
   * Compares min & max and changes the input if lower/greater
   * @param {BABYLON.Vector3} minimum
   * @param {BABYLON.Vector3} maximum
   * @param {BABYLON.Vector3} compareMinimum The minimum to compare against
   * @param {BABYLON.Vector3} compareMaximum The maximum to compare against
   */
  compareMinMax( minimum, maximum, compareMinimum, compareMaximum ) {

    if ( minimum.x > compareMinimum.x ) {
      minimum.x = compareMinimum.x;
    }
    if ( minimum.y > compareMinimum.y ) {
      minimum.y = compareMinimum.y;
    }
    if ( minimum.z > compareMinimum.z ) {
      minimum.z = compareMinimum.z;
    }

    if ( maximum.x < compareMaximum.x ) {
      maximum.x = compareMaximum.x;
    }
    if ( maximum.y < compareMaximum.y ) {
      maximum.y = compareMaximum.y;
    }
    if ( maximum.z < compareMaximum.z ) {
      maximum.z = compareMaximum.z;
    }
  },

  /**
   * Update what the center offset is to center an item's meshes
   * This is called onload and when setting a new parent / removing as child to re-calculate the center offset
   * @param {EgowallItem} item
   */
  itemUpdateCenterOffset( item ) {
    // get the minimum & maximum
    let tmpMinimum = BABYLON.Tmp.Vector3[ 8 ].copyFrom( item.boundsMinimum );
    let tmpMaximum = BABYLON.Tmp.Vector3[ 7 ].copyFrom( item.boundsMaximum );

    // TODO: Loop over item's children and compare against their bounds min & max
    for ( let i = 0; i < item.children.length; ++i ) {
      // Do recursive stuff
      this.itemCompareChildBounds( item.children[ i ], tmpMinimum, tmpMaximum );
    }

    item.size.x = (tmpMaximum.x - tmpMinimum.x);
    item.size.y = (tmpMaximum.y - tmpMinimum.y);
    item.size.z = (tmpMaximum.z - tmpMinimum.z);

    // Get the center pos of the bounds
    const centerX = item.size.x * 0.5 + tmpMinimum.x;
    const centerY = item.size.y * 0.5 + tmpMinimum.y;
    const centerZ = item.size.z * 0.5 + tmpMinimum.z;

    // Since position (pivot point) is always 0, 0, 0 this is the offset to place an object in the center when setting position
    // If center is at 0, 1, 0 then we need to remove 0, -1 , 0  to put pivot point at center
    // Otherwise if we use positive offset we push the object up in the world
    item.centerOffset.copyFromFloats( -centerX, -centerY, -centerZ );
    // Everytime the centerOffset is recalculated the surfaceOffset also has to be recalculated
    item.needSurfaceOffset = true;
  },

  /**
   * Comapres the bounds to input minimum & maximum
   * Then does the same for all children
   * @param {EgowallItem} item
   * @param {BABYLON.Vector3} minimum
   * @param {BABYLON.Vector3} maximum
   */
  itemCompareChildBounds ( item, minimum, maximum ) {
    let tmpMinimum = BABYLON.Tmp.Vector3[ 6 ].copyFrom(item.boundsMinimum);
    let tmpMaximum = BABYLON.Tmp.Vector3[ 5 ].copyFrom(item.boundsMaximum);

    const rootMesh = item.rootMeshes[ 0 ];
    let tmpPosition = BABYLON.Tmp.Vector3[ 4 ].copyFrom( rootMesh.position );

    this.multiplyVector3( rootMesh.rotationQuaternion, tmpPosition, tmpPosition );

    // Compare bounds
    this.compareMinMax( minimum, maximum, tmpMinimum, tmpMaximum );

    // Compare children bounds
    for ( let i = 0; i < item.children.length; ++i ) {
      // Do recursive stuff
      this.itemCompareChildBounds( item.children[ i ], minimum, maximum );
    }
  },

  loadModels ( arrayOfLoadedAssets ) {
    var scene = this.attr( "scene" );

    for ( let i = 0; i < arrayOfLoadedAssets.length; i++ ) {
      let assetInfo = arrayOfLoadedAssets[ i ];
      let unzippedAssets = assetInfo.unzippedFiles;
      let len = unzippedAssets.length;
      for ( let b = len - 1; b > -1; b-- ) {
        let fileInfo = unzippedAssets[ b ];
        if ( fileInfo.type === "babylon" ) {
          // is a babylon file that's been unpacked
          let meshesLoadedBound = this.meshesLoaded.bind( this, assetInfo, fileInfo.name );
          BABYLON.SceneLoader.ImportMesh( "", "", "data:" + fileInfo.data, scene, meshesLoadedBound );
          break; //only one file of type "babylon" expected
        }
        // else if ( fileInfo.type === "collision" ) {
        //  console.log( fileInfo );
        //}
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

    return materials.then( () => {
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

  /**
   * Creates the __backgroundMeshInfo
   * Sets the material of the background mesh
   * @param {BABYLON.Mesh} mesh
   * @param roomInfo
   */
  bgMeshSetMaterial ( mesh, roomInfo ) {
    var materialConstants = this.attr( "materialConstants" );

    var meshID = this.getTagValue( mesh, "meshID" );
    var parentBabylonName = ( mesh.parent && mesh.parent.name || "" ).toLowerCase();

    var rs = roomInfo.roomStatus || {};
    var key = ( rs.roomTypeName || "" ).replace( /[^a-z]/gi, "" ).toLowerCase();

    /**
     * @type BackgroundMeshInfo
     */
    mesh.__backgroundMeshInfo = {
      bgtype: BG_TYPES.NOTYPE,
      meshID: meshID,
      parentBabylonName: parentBabylonName,
      ajaxInfo: {},
      materialID: ""
    };

    // If material is set already then dispose of it because it will be discarded automatically
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
      if( lightmapId !== "" ) {
        // Try and get the lightmap for that id and then set it
        const lightmap = this.attr( "lightmaps" )[ lightmapId ];
        if ( lightmap ) {
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
   * Try and parse the name of the mesh to get the BG_TYPES
   * @param {BABYLON.Mesh} mesh
   * @returns {number}
   */
  bgMeshSetType (mesh ) {
    const name = mesh.name.toLowerCase();
    let bgMeshInfo = mesh.__backgroundMeshInfo;
    // TODO: Use tags on mesh instead of name?
    if (name.startsWith("floor_")){
      bgMeshInfo.bgtype = BG_TYPES.FLOOR;
    } else if ( name.startsWith( "wall_" ) ){
      bgMeshInfo.bgtype = BG_TYPES.WALL;
    } else if ( name.startsWith( "ceiling_" ) ) {
      bgMeshInfo.bgtype = BG_TYPES.CEILING;
    } else {
      bgMeshInfo.bgtype = BG_TYPES.NOTYPE;
    }
  },


  /**
   *
   * @param {BABYLON.Mesh} mesh
   * @returns {BG_TYPES}
   */
  bgMeshGetType ( mesh ) {
    if ( mesh.__backgroundMeshInfo ) {
      return mesh.__backgroundMeshInfo.bgtype;
    } else if ( mesh.__itemRef ) {
      return BG_TYPES.FURNITURE;
    } else {
      return BG_TYPES.NOTYPE;
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
      this.bgMeshSetType( mesh );
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
      let assetInfo = unzippedMeshFiles[ i ] || {};
      if ( assetInfo.type === "babylon" ) {
        // is a babylon file that's been unpacked
        let bgMeshLoadedBound = this.bgMeshLoaded.bind( this, assetInfo, assetInfo.name );
        BABYLON.SceneLoader.ImportMesh( "", "", "data:" + assetInfo.data, scene, bgMeshLoadedBound );
      }
      //else if ( assetInfo.type === "collision" ) {
      //  console.log( assetInfo );
      //}
    }
  },

  /**
   * Applies the lightmap material to terrain meshes that uses a lightmap
   * Also sets the attr skydomeMaterial so it can be animated
   */
  applyTerrainMaterials () {
    let meshes = this.attr( "terrainMeshes" );
    const lightmaps = this.attr( "lightmaps" );

    let materialGroups = {};

    for ( let i = 0; i < meshes.length; ++i ) {
      let mesh = meshes[i];

      // 1. Check if material exists
      // 2. Check the tags
      // 3. Check if the texture for that lightmap tag exists
      // 4. Check materialId + lightmapId already exists ( If parentId is null then use meshId )
      //    4a. If exists then add mesh to meshes
      //    4b. If not then create new group
      if ( mesh.material ) {
        const lightmapId = this.getTagValue( mesh, "lightmap" );

        if ( lightmapId != "" ) {
          // Check if the lightmap exists as a file
          if ( lightmaps[ lightmapId ] ) {
            // Creates a key like "xxxx-xxxx-xxxx-xxxxxxterrainfloor (GUID + lmId)
            const key = mesh.material.id + lightmapId;
            // If the group already exists then just add the mesh
            if ( materialGroups[ key ] ) {
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
    for ( const key in materialGroups ){
      let group = materialGroups[ key ];
      // The lightmap texture to use
      const lm = lightmaps[ group.lightmapId ];

      let meshes = group.meshes;
      let material = group.material;
      const bindedMeshes = material.getBindedMeshes();

      let needClone = false;
      // Go over all the bindedMeshes and see if they are part of the meshes for this material
      for ( let i = 0; i < bindedMeshes.length; ++i ){
        let found = false;
        const bindedMesh = bindedMeshes[i];
        // Check if the bindedMesh isn't part of groups.meshes
        // If it's not part of the groups.meshes then the material needs to be cloned as a different lightmap or no lightmap atall is expected
        for ( let j = 0; j < meshes.length; ++j ){
          if (bindedMesh === meshes[j]){
            found = true;
            break;
          }
        }
        // If no mesh was found then we need to copy the material
        if ( !found ){
          needClone = true;
          break;
        }
      }
      // Clone the material if needed and set it for all the meshes
      if ( needClone ){
        material = material.clone();
        material.ambientTexture = lm;
        for ( let i = 0; i < meshes.length; ++i ){
          meshes[i].material = material;
        }
        // If no cloning use the lightmap directly
      } else {
        material.ambientTexture = lm;
      }
    }

    // Finally remove the array:
    this.attr( "terrainMeshes", null );
  },

  loadLightmaps ( lightmapBundleURL ) {
    var lightmapReq = new can.Map({
      lightmap: true,
      assetID: -333,
      assetURL: lightmapBundleURL
    });
    var lightmapProm = Asset.get( lightmapReq );

    return lightmapProm.then( ( assetData ) => {
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
   * @param {EgowallItem} item
   * @param {BABYLON.Vector3} positionDelta
   */
  updatePositionsDelta ( item, positionDelta ) {
    for (let i = 0; i < item.rootMeshes.length; ++i ){
      let rootMesh = item.rootMeshes[ i ];

      rootMesh.position.addInPlace( positionDelta );

      this.updateMeshMatrices( rootMesh );
    }
  },

  updatePositions( item, position, skipMatrices ){
    for (let i = 0; i < item.rootMeshes.length; ++i ){
      let rootMesh = item.rootMeshes[ i ];

      rootMesh.position.copyFrom( position );

      if ( !skipMatrices ) {
        this.updateMeshMatrices( rootMesh );
      }
    }
  },


  /**
   * Update position and rotation of an item
   * @param {EgowallItem} item The item to do changes to, changes will affect children automatically
   * @param {BABYLON.Vector3} positionDelta How much object has translated
   * @param {BABYLON.Quaternion} rotation The delta rotation, could for example be the rotation of a wall.
   */
  updatePositionRotationDelta ( item, positionDelta, rotation, skipMatrices ) {
    for (let i = 0; i < item.rootMeshes.length; ++i ){
      let rootMesh = item.rootMeshes[ i ];

      // rootMesh.position.addInPlace( positionDelta );
      rootMesh.position.addInPlace( positionDelta );

      // Use the baseRotation and
      rotation.multiplyToRef( item.baseRotation, rootMesh.rotationQuaternion );
      if ( !skipMatrices ) {
        this.updateMeshMatrices( rootMesh );
      }
    }
  },

  updatePositionRotation ( item, position, rotation ) {
    for (let i = 0; i < item.rootMeshes.length; ++i ){
      let rootMesh = item.rootMeshes[ i ];

      // rootMesh.position.addInPlace( positionDelta );
      rootMesh.position.copyFrom( position );

      // Use the baseRotation and
      rotation.multiplyToRef( item.baseRotation, rootMesh.rotationQuaternion );

      this.updateMeshMatrices( rootMesh );
    }
  },

  updateRotation ( item, rotation, skipMatrices ) {
    for (let i = 0; i < item.rootMeshes.length; ++i ){
      let rootMesh = item.rootMeshes[ i ];

      // Use the baseRotation and
      rotation.multiplyToRef( item.baseRotation, rootMesh.rotationQuaternion );
      if ( !skipMatrices ) {
        this.updateMeshMatrices( rootMesh );
      }
    }
  },

  /**
   * Updates a root mesh's world matrix and the child meshes' matrices.
   * @param {BABYLON.Mesh} rootMesh
   */
  updateMeshMatrices ( rootMesh ) {
    let children = rootMesh.getChildMeshes();
    // freezeWorldMatrix re-updates the world matrix so the position is correct
    rootMesh.freezeWorldMatrix();
    for ( let i = 0; i < children.length; ++i ){
      children[ i ].freezeWorldMatrix();
    }
    // Finish by telling shadowmap it needs to update
    this.updateShadowmap = true;
  },

  /***************************************
   * Parent & Child relations
   ***************************************/
  /**
   * Adds the parent to an item and if the item already had a parent then the item removes itself as a child from the old parent.
   * @param {EgowallItem} item
   * @param {EgowallItem} parent
   */
  addItemParent ( item, parent ) {
    if ( item.parent ) {
      if ( parent === null ){
        this.removeChild( item );
      } else if ( item.parent !== parent ) {
        this.removeChild( item );
        this.setItemParent( item, parent );
      }
      // Do nothing for same reference
    } else {
      if ( parent ){
        this.setItemParent( item, parent );
      }
    }
  },

  /**
   * Sets the parent and sets position & rotation correctly
   * @param {EgowallItem} item
   * @param {EgowallItem} parent
   */
  setItemParent ( item, parent ) {
    item.parent = parent;
    parent.children.push( item );

    let tmpVector = BABYLON.Tmp.Vector3[ 8 ];
    // Stores the inverse parent quaternion
    let tmpQuat = BABYLON.Tmp.Quaternion[ 0 ];
    for ( let i = 0; i < item.rootMeshes.length; ++i ){

      let rootMesh = item.rootMeshes[i];
      // Copy the current absolute position before adding the parent
      tmpVector.copyFrom(rootMesh.getAbsolutePosition());

      // Not the rootParent yet but the parent that the rootMesh needs
      let rootParent = parent.rootMeshes[ 0 ];
      rootMesh.parent = rootParent;

      // Start by cloning the parents rotationQuaternion
      let parentQuaternion = rootParent.rotationQuaternion.clone();
      // Now iterate over all parents to hit the real root parent
      while ( rootParent.parent ){
        rootParent = rootParent.parent;
        // Add the rotationQuaternion of each parent
        rootParent.rotationQuaternion.multiplyToRef( parentQuaternion, parentQuaternion );
      }
      parentQuaternion.normalize();
      // Clone the parentInitialRotation to later multiply with the child when splitting.
      item.parentInitialRotation = parentQuaternion;
      // Inverse the quaternion to remove the rotation
      tmpQuat.copyFromFloats( -parentQuaternion.x, -parentQuaternion.y, -parentQuaternion.z, parentQuaternion.w );

      // We need to add the inverse quaternion to remove the rotation of the parent.
      // Else the rotation is very off!
      tmpQuat.multiplyToRef(rootMesh.rotationQuaternion, rootMesh.rotationQuaternion);
      // We need to use absolute position because the position gets really wrong after adding the the parent
      // My guess is the poseMatrix changes the local space
      rootMesh.setAbsolutePosition( tmpVector );
    }

    // TODO: Update the bounds & center offset
    this.itemUpdateCenterOffset( parent );
  },

  /**
   * Removed the parent and sets the proper positions again
   * Cleanup code when removing a child from an item
   * @param {EgowallItem} child
   */
  removeChild ( child ) {
    let parent = child.parent;
    if ( parent ) {
      let found = false;
      for ( let i = 0; i < parent.children.length; ++i ){
        if ( parent.children[ i ] === child ){
          parent.children.splice( i, 1 );
          found = true;
          break;
        }
      }

      if ( found ) {
        child.parent = null;

        // Fix positions!
        for ( let i = 0; i < child.rootMeshes.length; ++i ){
          let rootMesh = child.rootMeshes[ i ];
          rootMesh.parent = null;
          // Remove parentInitialRotation inverse reduction by multiplying it back
          child.parentInitialRotation.multiplyToRef( rootMesh.rotationQuaternion, rootMesh.rotationQuaternion );
          // Remove parentInitialRotation
          delete child.parentInitialRotation;
        }

        // Finally update the centerOffset for the child & parent
        this.itemUpdateCenterOffset( child );
        this.itemUpdateCenterOffset( parent );

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
   * @param {EgowallItem} item
   */
  activateGravity ( item ) {
    this.gravityItems.push ( item );
  },

  // TODO: Evaluate if deltaY should be a vector incase of objects moving in more directions than just 1.
  /**
   * Adjust the position by using a binary search approach.
   * Start by checking half the value of deltaY and then half from there 5 times reaching 96.875% of a_deltaY
   * If it's not colliding it tries to move closer towards collision
   * Uses Tmp.Vector3[ 7 ]
   * @param {EgowallItem} item
   * @param {CollisionResult[]} collisions
   * @param {BABYLON.Vector3} deltaPos How much the gravity moved an object since last frame
   * @param {number} steps How many steps to check. The more the closer to 0. Default is 6 that gives 98.4375% accuracy
   */
  adjustCollisionPos ( item, collisions, deltaPos, steps = 6 ) {

    // -1 = against gravity
    let direction = -1;

    let tempVec = BABYLON.Tmp.Vector3[ 7 ];
    // Need to set x & z to 0 since it's a tmp variable
    tempVec.x = 0;
    tempVec.y = 0;
    tempVec.z = 0;
    let isColliding = true;
    let multiplierValue = 0;

    let alwaysColliding = true;

    for ( let i = 1; i < steps; ++i ) {
      // Half the distance until finished!
      // 0.5, 0.75, 0.875, 0.9375, 0.96875, 0.984375
      let multiplier = direction * ( 1 / Math.pow( 2, i) );

      multiplierValue += multiplier;

      tempVec.x = deltaPos.x * multiplier;
      tempVec.y = deltaPos.y * multiplier;
      tempVec.z = deltaPos.z * multiplier;

      this.updatePositionsDelta( item, tempVec );

      isColliding = false;

      // Check all collisions if they still collide or not
      for ( let j = 0; j < collisions.length; ++j ){
        let collision = collisions[ j ];
        if ( collision.furniture.intersectsMesh( collision.hit, true )){
          isColliding = true;
        }
      }
      // If it's not colliding then try and get closer towards collision
      if ( !isColliding ){
        alwaysColliding = false;
        // If no collision and moving against gravity start moving towards gravity
        if ( direction == -1 ){
          direction = -direction;
        }
      } else {
        // If colliding and direction is going towards gravity
        // Then go against gravity
        if ( direction == 1 ){
          direction = -direction;
        }
      }
    }

    // If it always collided
    if (alwaysColliding) {
      // Since base direction is -1 we need to do -1 - value
      const remaining = -1 - multiplierValue;

      tempVec.x = deltaPos.x * remaining;
      tempVec.y = deltaPos.y * remaining;
      tempVec.z = deltaPos.z * remaining;

      this.updatePositionsDelta( item, tempVec );
    }
  },

  /**
   * Adds the gravity distance to the item and checks for collision
   * @param {EgowallItem} item
   * @param {BABYLON.Vector3}gravityDistance
   */
  applyGravity ( item, gravityDistance ) {
    // Start by adding the gravity distance
    this.updatePositionsDelta( item, gravityDistance );

    // Check collision and get result
    let collisions = this.checkFurnitureCollisions( item );
    // If colliding try and figure out where!
    if ( collisions.length > 0 ){
      // Adjust the position by moving object ~6 times to get as near as possible
      this.adjustCollisionPos( item, collisions, gravityDistance );
      // If the collisions is an EgowallItem then add item as child to which had highest count or first occurence if same count
      const parent = this.getParentFromCollisions( collisions );

      // Set a parent for the item
      if ( parent ){
        this.addItemParent( item, parent );
      }

      return true;
    }

    return false;
  },

  // TODO: Make outline use this function when implemented
  /**
   * Check if the furniture item is colliding with any other mesh.
   * Used by applyGravity
   * @param {EgowallItem} item
   * @returns {CollisionResult[]}
   */
  checkFurnitureCollisions ( item ) {
    const id = item._cid;
    // Lazy load the array and store until a new selection happens
    if (!this.selectedFurnitureMeshes[ id ]  ){
      // calculate the meshes
      this.selectedFurnitureMeshes[ id ] = this.getCollisionMeshesForItem( item );
    }

    let selectedFurnitureMeshes = this.selectedFurnitureMeshes[ id ];

    // If first time checking meshes
    if (!this.meshesToCheckFurniture[ id ]){
      this.meshesToCheckFurniture[ id ] = this.getCollidableMeshes( selectedFurnitureMeshes, this.collisionMeshes );
    }

    let collidableMeshes = this.meshesToCheckFurniture[ id ];

    return this.checkMeshCollisions( selectedFurnitureMeshes, collidableMeshes );
  },

  /**
   *
   * @param {BABYLON.Mesh[]} meshes
   * @param {BABYLON.Mesh[]} collidableMeshes
   * @returns {CollisionResult[]}
   */
  checkMeshCollisions( meshes, collidableMeshes ) {
    let collisions = [];
    // Go over all collidables
    for ( let i = 0; i < collidableMeshes.length; ++i ){
      const collidableMesh = collidableMeshes[ i ];

      // Check the collidable against all meshes and see if they intersect
      for ( let j = 0; j < meshes.length; ++j ){
        const mesh = meshes[ j ];

        if (mesh.intersectsMesh( collidableMesh, true )){
          // Add the collision result to collisions array if colliding
          collisions.push( { hit:collidableMesh, furniture: mesh } );
        }
      }
    }

    return collisions;
  },

  /**
   * Get all childMeshes for an item. Iterating over all rootMeshes and get the childmeshes for those.
   * @param {EgowallItem} item
   * @returns {BABYLON.Mesh[]}
   */
  getChildMeshes ( item ) {
    let result = [];

    let rootMeshes = item.rootMeshes;
    for ( let i = 0; i < rootMeshes.length; ++i ){
      let rootMesh = rootMeshes[ i ];
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
  getCollidableMeshes ( selectedMeshes, collisionMeshes ) {

    let collidableMeshes = [];

    for ( let i = 0; i < collisionMeshes.length; ++i ){
      // Default to canCheck so it's true if no mesh was found
      let canCheck = true;
      let mesh = collisionMeshes[ i ];
      // Check all selectedMeshes to see if they are equal to mesh
      for ( let j = 0; j < selectedMeshes.length; ++j ){
        if (mesh === selectedMeshes[ j ]){
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
   * @param {CollisionResult[]} collisions
   */
  getParentFromCollisions ( collisions ) {
    // Get count of how often a parent occurs
    let parentCount = {};

    for ( let i = 0; i < collisions.length; ++i ){
      // Get the itemRef
      let itemRef = this.getItemFromMesh( collisions[ i ].hit );
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
   * @param {EgowallItem} item
   */
  removeGravity ( item ) {
    for( let i = 0; i < this.gravityItems.length; ++i ){
      if (this.gravityItems[ i ] === item ){
        this.gravityItems.splice(i, 1);
      }
    }

    this.removeCollisionItemCache( item );
  },

  /**
   * Remove the selectedFurnitureMeshes & meshesToCheck for an item id
   * @param {EgowallItem} item
   */
  removeCollisionItemCache ( item ) {
    const id = item._cid;
    if (this.selectedFurnitureMeshes[ id ]){
      delete this.selectedFurnitureMeshes[ id ];
    }
    if ( this.meshesToCheckFurniture[ id ] ){
      delete this.meshesToCheckFurniture[ id ];
    }
  },

  /*************************************
   * Item handling
   ************************************/

  /**
   * Function to move & possibly rotate a selected furniture object.
   * @param {Vector2} mousePos
   */
  selectedItemFurnitureMovePicking ( mousePos ) {
    let selectedItem = this.selectedItem;

    const pickingResult = this.getPickingFromMouse( mousePos, (hitMesh ) => {

      let itemRef = hitMesh.__itemRef;
      // 1. Don't return a hit for the same item
      if ( itemRef ) {
        // Note: Reason for checking rootItems is to know if you're comparing the same group or not

        // Change itemRef to the rootItem to compare
        itemRef = this.getRootItem( itemRef );
        // If __itemRef exists and isn't the selected item then return true!
        if (itemRef !== this.getRootItem( selectedItem )){
          return true;
        }
      } else {
        let backgroundRef = hitMesh.__backgroundMeshInfo;
        // If the backgroundMeshInfo exists then it's a background mesh and return true!
        if (backgroundRef){
          return true;
        }
      }
      return false;
    });



    // Technically this should always happen
    if ( pickingResult.hit ){
      this.moveRotateSelectedItem( selectedItem, pickingResult );

      const placementResult = this.canFurnitureBePlaced( selectedItem, pickingResult );
      this.setOutlineColor( placementResult.valid, placementResult.error );

      this.selectedItemValidPosition = placementResult.valid;
    }

    this.tryUpdatePlacementGrid( pickingResult );
  },

  /**
   *
   * @param {undefined|BABYLON.PickingInfo} pickingResult
   */
  tryUpdatePlacementGrid ( pickingResult ) {

    if ( pickingResult && pickingResult.hit ) {
      let pickedMesh = pickingResult.pickedMesh;

      let pickedType = this.bgMeshGetType( pickedMesh );

      // Check if the placement mesh is different
      if ( this.placementGridMesh !== pickedMesh ) {
        // If the pickedMesh is a notype mesh then clear it
        if ( pickedType !== BG_TYPES.FURNITURE ) {
          this.clearPlacementGrid();

          // Set placementGridMesh as pickedMesh
          this.placementGridMesh = pickedMesh;
        }
      }

      if ( pickedType !== BG_TYPES.NOTYPE && pickedType !== BG_TYPES.FURNITURE ){
        // Check if the material isn't placementGrid material to change it
        if ( pickedMesh.material !== this.placementGridMaterial ) {
          pickedMesh.__savedMaterial = pickedMesh.material;
          pickedMesh.material = this.placementGridMaterial;
        }
      }

    } else {
      this.clearPlacementGrid();
    }

  },

  /**
   * Set the material back  to what it was
   */
  clearPlacementGrid () {
    if ( this.placementGridMesh !== null){
      // Set the old material back
      this.placementGridMesh.material = this.placementGridMesh.__savedMaterial;
      // Delete it, no need to have extra reference
      delete this.placementGridMesh.__savedMaterial;

      this.placementGridMesh = null;
    }
  },

  /**
   * Set the outline color of the selectedItem
   * Also set the error message
   * @param isValid
   * @param errorMsg
   */
  setOutlineColor( isValid, errorMsg ){

    if ( isValid ){
      // Check if
      if (this.outlineCurrentColor.r === 1){
        this.outlineCurrentColor = this.outlineOKColor;
      }
    } else {
      if (this.outlineCurrentColor.r !== 1){
        this.outlineCurrentColor = this.outlineCollisionColor;
      }

      // Set error mesasge
    }
  },

  /**
   *
   * @param {EgowallItem} furnitureItem
   * @param {BABYLON.PickingInfo} pickingResult
   * @returns PlacementResult
   */
  canFurnitureBePlaced( furnitureItem, pickingResult ){
    /**
     * @type PlacementResult
     */
    let result = {
      valid: false
    };

    const pickedMesh = pickingResult.pickedMesh;
    const pickedType = this.bgMeshGetType( pickedMesh );

    const validTypes = this.getValidBgTypes( furnitureItem.options );

    if ( validTypes[ pickedType ]  ) {
      // Check collisions
      // this.checkFurnitureCollisions();
      const collisions = this.checkFurnitureCollisions( furnitureItem );
      result.valid = collisions.length === 0;
    // The pickedType is not a valid type
    } else {

    }

    return result;
  },

  /**
   * Get what BG_TYPES are allowed
   * @param {*} options
   * @returns {Boolean[]}
   */
  getValidBgTypes ( options ) {
    let result = [];

    if ( anyTruthy(options.floorArg ) ) {
      result[ BG_TYPES.FLOOR ] = true;
    }
    if ( anyTruthy( options.ceilArg ) ) {
      result[ BG_TYPES.CEILING ] = true;
    }
    if ( anyTruthy( options.wallArg ) ) {
      result[ BG_TYPES.WALL ] = true;
    }
    if ( anyTruthy( options.furnArg ) ) {
      result[ BG_TYPES.FURNITURE ] = true;
    }

    return result;
  },

  /**
   * Calculate the new position and rotation for a selectedItem based off the pickingResult
   * @param {EgowallItem} selectedItem
   * @param {BABYLON.PickingInfo} pickingResult
   */
  moveRotateSelectedItem ( selectedItem, pickingResult ) {
    /*
     BABYLON.Tmp.Vector indices:
     8: deltaPosition
     7: Axis for rotation
     ** Used by getValidPosition() **
     7: Adjustcollision
     6: tmpCenterOffset: The centerOffset rotated by the rotationQuaternion to get proper xys coords
     5: maxOffset: How much the max distance offset would be if colliding all the way to the end
     4: tmpNormal: small offset to not collide with rugs e.t.c.

     Babylon.Tmp.Quaternion indices:
     0: Quaternion for function getSurfaceRotation
     */
    // Can use the first rootMesh to calculate how much the object has to move
    // TODO: Evaluate if center between two rootMeshes would be neccesary for proper position
    let rootMesh = selectedItem.rootMeshes[ 0 ];
    // Need to get world normal or the wall rotation calculation is wrong.
    const normal = pickingResult.getNormal(true);
    let tmpPositionDelta = BABYLON.Tmp.Vector3[ 8 ];
    // pickingResult.pickedPoint.subtractToRef( rootMesh.position, tmpPositionDelta );
    tmpPositionDelta.copyFrom( pickingResult.pickedPoint );

    let doRotation = true;
    const lastSurfaceNormal = selectedItem.surfaceNormal;
    // If the surface normal is the same then there is no point doing expensive surface computation
    if ( lastSurfaceNormal.x === normal.x && lastSurfaceNormal.y === normal.y && lastSurfaceNormal.z === normal.z ) {
      doRotation = false;
    }

    /***
     * Part 1: Get the rotation
     ***/
    let surfaceRotation = BABYLON.Tmp.Quaternion[ 0 ];
    // For now store the normal to not redo rotations if same normal as last time
    selectedItem.surfaceNormal.copyFrom( normal );
    // If there is no need to do rotation then
    if ( !doRotation ){
      // Copy the saved offset if no need for surfaceOffset calculation
      if (!selectedItem.needSurfaceOffset) {
        tmpPositionDelta.addInPlace( selectedItem.surfaceOffset );
        // Add saved offset to position
        this.updatePositions( selectedItem, tmpPositionDelta );
      }
    } else {
      // Uses Tmp.Quaternion[ 0 ]
      this.getSurfaceRotation( normal, surfaceRotation );
      // Copy the surface rotation before it has the old surface rotation removed from it
      surfaceRotation.conjugateToRef( selectedItem.inverseSurfaceRotation );
      // No need to update the matrices it will happen when calculating surfaceOffset
      this.updateRotation( selectedItem, surfaceRotation, true );
    }

    // Surface offset should never be 0,0,0 except first time
    if ( doRotation || selectedItem.needSurfaceOffset ) {

      // Add center offset and other stuff
      this.getValidPosition( selectedItem, tmpPositionDelta, normal, pickingResult.pickedMesh );

      tmpPositionDelta.copyFrom( rootMesh.position );
      // Get the difference between position and the pickedPoint
      tmpPositionDelta.subtractInPlace( pickingResult.pickedPoint );

      selectedItem.surfaceOffset.copyFrom( tmpPositionDelta );
      selectedItem.needSurfaceOffset = false;
    }
  },

  /**
   * Add centerOffset,
   * Then move item along normal until it doesn't collide with pickedMesh
   * Uses Tmp.Vector3[ 4, 5 ]
   * @param {EgowallItem} selectedItem
   * @param {BABYLON.Vector3} position
   * @param {BABYLON.Vector3} normal
   * @param {BABYLON.AbstractMesh} pickedMesh
   */
  getValidPosition( selectedItem, position, normal, pickedMesh ) {
    let tmpCenterOffset = BABYLON.Tmp.Vector3[ 6 ].copyFrom( selectedItem.centerOffset );
    // -0.5 because of adjustCollisionPos in tryValidPosition
    const sizeLength = selectedItem.size.length() * -0.5;
    const maxOffset = BABYLON.Tmp.Vector3[ 5 ].copyFrom( normal ).scaleInPlace( sizeLength );

    // this.multiplyVector3( tmpItemRotation, tmpCenterOffset, tmpCenterOffset );
    this.multiplyVector3( selectedItem.rootMeshes[ 0 ].rotationQuaternion, tmpCenterOffset, tmpCenterOffset );
    position.addInPlace( tmpCenterOffset );

    this.tryValidPositions( selectedItem, position, maxOffset, pickedMesh );

    let tmpNormal = BABYLON.Tmp.Vector3[ 4 ].copyFrom( normal );
    // TODO: Evaluate the height scale needed to avoid rugs
    // Translate a tiny portion of surface normal to not collide with rugs
    tmpNormal.scaleInPlace( 0.05 );

    for ( let i = 0; i < selectedItem.rootMeshes.length; ++i ) {
      this.updatePositionsDelta( selectedItem, tmpNormal );
    }
  },

  /**
   * Get the collisionMeshes and try adjust the position until it doesn't collide with the binary search technique.
   * @param {EgowallItem} selectedItem
   * @param {BABYLON.Vector3} startPosition
   * @param {BABYLON.Vector3} maxOffset
   * @param {BABYLON.AbstractMesh} pickedMesh
   */
  tryValidPositions ( selectedItem, startPosition, maxOffset, pickedMesh ) {
    // Set the position as center of collision
    this.updatePositions( selectedItem, startPosition );

    const furnitureCollisionMeshes = this.getCollisionMeshesForItem( selectedItem );
    let collisioResults = this.checkMeshCollisions( furnitureCollisionMeshes, [ pickedMesh ] );

    if ( collisioResults.length > 0 ) {
        this.adjustCollisionPos( selectedItem, collisioResults, maxOffset );
    }
  },

  /**
   * Reset the values of a selectedItem by using the backup values
   */
  resetSelectedItem () {
    // Check that we're not in customize mode first
    if ( !this.attr( "customizeMode" ) ) {
      let backupItem = this.selectedItemBackup;
      let selectedItem = this.selectedItem;

      // Remove the collision item cache if resetting
      this.removeCollisionItemCache( selectedItem );

      if ( backupItem && selectedItem ) {

        // Add back as parent if it was detached
        if (backupItem.parent){
          this.setItemParent( this.selectedItem, backupItem.parent );
        }

        selectedItem.surfaceNormal.copyFrom( backupItem.surfaceNormal );
        selectedItem.surfaceOffset.copyFrom( backupItem.surfaceOffset );
        selectedItem.needSurfaceOffset = backupItem.needSurfaceOffset;
        selectedItem.inverseSurfaceRotation.copyFrom( backupItem.inverseSurfaceRotation );

        let rootMeshes = this.selectedItem.rootMeshes;
        for ( let i = 0; i < rootMeshes.length; ++i ){
          let rootMesh = rootMeshes[ i ];

          // Reset position
          rootMesh.position.copyFrom( backupItem.position );
          // Reset rotation
          rootMesh.rotationQuaternion.copyFrom( backupItem.rotation );
          // Reset scale
          rootMesh.scaling.copyFrom( backupItem.scale );

          this.updateMeshMatrices( rootMesh );
        }

        // Finally unset the selectedItem
        this.unsetSelectedItem();
      }
    }
  },

  /**
   * Happens on a leftclick
   * @param $ev
   */
  setupSelectedItem( $ev ) {
    let hoveredMesh = this.attr( "hoveredMesh" );

    if ( hoveredMesh ) {
      // don't execute camera click on ground
      $ev.controlPropagationStopped = true;

      if ( !this.selectedItem) {
        if ( this.attr( "customizeMode" ) ){
          this.setupSelectedBackground( hoveredMesh );
        } else {
          // Check for egoId
          let item = hoveredMesh.__itemRef;
          if (item.options.egoID){
            this.setupSelectedEgoId( item );
          } else {
            this.setupSelectedFurniture( item );
          }
        }
      }
    }
  },

  /**
   * Setup the selectedItem variables for a selected Background mesh (in customize mode)
   * @param {BABYLON.Mesh} mesh
   */
  setupSelectedBackground( mesh ) {

  },

  /**
   * Setup the selectedItem for a furniture
   * @param {EgowallItem} item
   */
  setupSelectedFurniture( item ) {
    this.selectedItem = item;

    let rootMesh = item.rootMeshes[ 0 ];
    /**
     * @type SelectedBackup
     */
    this.selectedItemBackup = {
      inverseSurfaceRotation: item.inverseSurfaceRotation.clone(),
      needSurfaceOffset: item.needSurfaceOffset,
      position: rootMesh.position.clone(),
      rotation: rootMesh.rotationQuaternion.clone(),
      scale: rootMesh.scaling.clone(),
      surfaceNormal: item.surfaceNormal.clone(),
      surfaceOffset: item.surfaceOffset.clone()
    };

    // Note: Do this before unsetting parent! :)
    // Check normal length is 0 then calculate it
    if (item.surfaceNormal.lengthSquared() === 0 ) {
      this.tryCheckFurnitureSurfaceRotation( item );
    }

    if ( item.parent){
      this.selectedItemBackup.parent = item.parent;
      this.removeChild( item );
    }
    // Set outline for all children
    this.setGroupOutline( item );

    // Clone the reference because otherwise it'd get updated when changes are done to the selectedItem
    this.setBaseRotation( item );
  },

  /**
   * Setup the selectedItem properties for an egoId item / painting
   * @param {EgowallItem\ item
   */
  setupSelectedEgoId ( item ) {

  },

  /**
   * Unselect the selected item and do cleanup
   */
  unselectItem () {
    let item = this.selectedItem;
    if ( item ) {
      // If selectedItem is set then check if the item can be set
      if ( this.selectedItemValidPosition ){
        this.unsetSelectedItem();
        // Activate gravity
        this.activateGravity( item );
      }
    }
  },

  /**
   * Unsets the selectedItem and also
   * unsetsHoveredMesh and resets the outline color.
   */
  unsetSelectedItem(){
    this.selectedItem = null;
    this.selectedItemBackup = null;
    this.selectedItemValidPosition = false;

    this.unsetHoveredMesh();
    // Clear the placement grid surface when you're unselecting too
    this.clearPlacementGrid();
    // Reset the color if it was red
    this.outlineCurrentColor = this.outlineOKColor;
  },

  /**
   * Checks the ajax data for parentID and then sets up the proper relations if a parent is found.
   */
  setItemRelations () {
    let items = this.attr( "items" );

    for ( let i = 0; i < items.length; ++i ) {
      let item = items[ i ];
      const itemInfo = item.options.roomInfo || item.options;

      // TODO: Create new loadMeshes function for terrain specifically
      if ( !item.options.terrain ){
        // Check if parentID is not 0
        if ( itemInfo.parentID !== "0" ) {
          // Find the parent with the Id
          let parent = this.getFurnitureItemFromId( itemInfo.parentID );
          if ( parent ){
            this.setItemParent( item, parent );
          }
        }
      }
    }
  },

  /**
   * Get a furniture from an id.
   * It loops through all items checking if ufurnID == id
   * @param {String} id
   * @returns {EgowallItem}
   */
  getFurnitureItemFromId( id ){
    let items = this.attr( "items" );
    for (let i = 0; i < items.length; ++i ){
      let item = items[ i ];
      let options = item.options;
      // Check that ufurnID exists and is equal to id
      if ( options.ufurnID && options.ufurnID === id ) {
        return item;
      }
    }

    return null;
  },
  /**
   * Sets the base rotation of an object before moving.
   * Removes the surfaceRotation when setting the rotation
   * @param {EgowallItem} item
   */
  setBaseRotation ( item ){
    const rotation = item.rootMeshes[ 0 ].rotationQuaternion;
    item.inverseSurfaceRotation.multiplyToRef( rotation, item.baseRotation );
  },
  /***********************************
   * Find surface rotations with rays
   **********************************/

  // Source of base implementation: http://www.html5gamedevs.com/topic/11172-rotate-an-object-perpendicular-to-the-surface-of-a-sphere/
  /**
   * Get the surface rotation based of input normal.
   * @param {BABYLON.Vector3} normal
   * @param {undefined|BABYLON.Quaternion} rotationRef Uses Tmp.Quaternion[ 0 ] if undefined
   * @returns {BABYLON.Quaternion}
   */
  getSurfaceRotation ( normal, rotationRef ) {
    if (!rotationRef){
      rotationRef = BABYLON.Tmp.Quaternion[ 0 ];
    }
    const upVector = this.upVector3;

    // The wall rotation quaternion
    // let surfaceRotation;

    // For normal.y = 1 return identity quaternion
    if ( normal.y === 1 ) {
      rotationRef = BABYLON.Tmp.Quaternion[ 0 ].copyFromFloats(0, 0, 0, 1);
    }
    // For normal.y == 1 then return a quaternion to turn it upside down
    else if ( normal.y === -1 ) {
      rotationRef = BABYLON.Tmp.Quaternion[ 0 ].copyFromFloats(0, 0, 1, 0);
    } else {
      let tmpAxis = BABYLON.Tmp.Vector3[ 7 ];
      // Axis is [ 0, 0, 0 ] for y == 1 and y == -1
      BABYLON.Vector3.CrossToRef(upVector, normal, tmpAxis );
      const angle = Math.acos(BABYLON.Vector3.Dot(upVector, normal));
      // TODO: in Babylon 2.5 change to use RotationAxisToRef
      // This normalizes tmpAxis
      const rotation = BABYLON.Quaternion.RotationAxis( tmpAxis, angle);
      rotation.normalize();

      rotationRef.copyFrom( rotation );
    }

    return rotationRef;
  },

  /************************************************
   * Furniture surface checking when selected
   ************************************************/

  /**
   * Get the meshes for a furniture that can be used by tryCheckFurnitureSurfaceRotation()
   * If item.parent is undefined then get bgMeshes that fit the critera of furniture.options
   * If item.parent is set then get the parent.meshes to check against
   * @param {EgowallItem} item
   */
  getMeshesForFurnitureSurfaceCheck( item ) {
    const itemInfo = item.options;

    let meshesToCheck = [];

    if ( !item.parent ) {

      const validTypes = this.getValidBgTypes( itemInfo );

      // Iterate over bgmeshes to find
      let bgMeshes = this.attr( "bgMeshes" );

      for ( let i = 0; i < bgMeshes.length; ++i ) {
        const bgMesh = bgMeshes[ i ];
        const bgType = bgMesh.__backgroundMeshInfo.bgtype;

        if (validTypes[ bgType ]  ){
          meshesToCheck.push( bgMesh );
        }
      }
    } else {
      // Get all meshes for parent to raycast against
      meshesToCheck = item.parent.meshes;
      // TODO: Get the closest mesh? Alternatively move the
    }

    return meshesToCheck;

  },

  /**
   * Attempt to find the surface rotation. If it's not found then reset the rotation of the item.
   * @param {EgowallItem} item
   */
  tryCheckFurnitureSurfaceRotation( item ){
    const meshesToCheck = this.getMeshesForFurnitureSurfaceCheck( item );

    const axises = [
      [ 0, 1, 0 ],
      [ 0, -1, 0 ],
      [ 0, 0, 1 ],
      [ 0, 0, -1 ],
      [ 1, 0, 0 ],
      [ -1, 0, 0 ]
    ];

    let rootMesh = item.rootMeshes[ 0 ];

    const position = rootMesh.position;
    let found = false;
    // TODO: Evaluate performance if testing more than 6 axises can be done. (Can start combining axises)
    // Try alll 6 axises
    for ( let i = 0; i < axises.length; ++i ) {
      let direction = BABYLON.Tmp.Vector3[ 8 ];
      direction.copyFromFloats( axises[i][0], axises[i][1], axises[i][2] );
      // TODO multiply with items rotation if parent exists
      if ( item.parent ){
        this.multiplyVector3( rootMesh.rotationQuaternion, direction, direction );
      }

      if ( this.checkFurnitureSurfaceRotation( item, position, direction, meshesToCheck ) ) {
        found = true;
        break;
      }
    }
    // If the surface normal could not be found then reset the rotation
    if (!found) {
      for( let i = 0; i < item.rootMeshes.length; ++i ) {
        // Reset rotation by setting identity quaternion
        item.rootMeshes[ i ].rotationQuaternion.copyFromFloats( 0, 0, 0, 1 );
      }
    }

    return found;
  },

  /**
   * Checks with a picking ray if the ray collides with any of the meshes to check
   * @param {EgowallItem} item
   * @param {BABYLON.Vector3} position
   * @param {BABYLON.Vector3} direction
   * @param {BABYLON.Mesh[]} meshesToCheck
   * @returns {boolean}
   */
  checkFurnitureSurfaceRotation( item, position, direction, meshesToCheck ){
    let scene = this.attr("scene");

    let tmpRay = BABYLON.Tmp.Ray[ 0 ];
    tmpRay.direction.copyFrom( direction );
    tmpRay.origin.copyFrom( position);
    // Shoot a short ray
    tmpRay.length = 50;

    const pickingResult = scene.pickWithRay( tmpRay, ( mesh ) => {
      // Check if mesh is meshesToCheck
      for ( let i = 0; i < meshesToCheck.length; ++i ) {
        if (mesh === meshesToCheck[i]){
          return true;
        }
      }

      return false;
    });

    if (pickingResult.hit){
      const normal = pickingResult.getNormal( true );
      const rotation = this.getSurfaceRotation( normal );

      // Inverse the rotation
      rotation.conjugateToRef( item.inverseSurfaceRotation );
      item.surfaceNormal.copyFrom( normal );

      return true;
    }

    return false;
  },

  /**
   * Multiply quat quaternion with vector3
   * @param {BABYLON.Quaternion} quat
   * @param {BABYLON.Vector3} vec3
   * @param {undefined|BABYLON.Vector3} ref Uses Tmp.Vector3[ 5 ] if undefined
   * @returns {BABYLON.Vector3}
   */
  multiplyVector3 (quat, vec3, ref ) {
    if (!ref){
      ref = BABYLON.Tmp.Vector3[ 5 ];
    }

    var vx = vec3.x,
      vy = vec3.y,
      vz = vec3.z,
      qx = quat.x,
      qy = quat.y,
      qz = quat.z,
      qw = quat.w,
      i = qw * vx + qy * vz - qz * vy,
      j = qw * vy + qz * vx - qx * vz,
      k = qw * vz + qx * vy - qy * vx,
      l = -qx * vx - qy * vy - qz * vz;
    ref.x = i * qw + l * -qx + j * -qz - k * -qy;
    ref.y = j * qw + l * -qy + k * -qx - i * -qz;
    ref.z = k * qw + l * -qz + i * -qy - j * -qx;
    return ref;
  },

  getCollisionMeshesForItem( item ) {
    // TODO: Replace with collision meshes and not childMeshes
    return this.getChildMeshes( item );
  }

});

export const controls = {
  "name": "game-canvas",
  "context": null,
  "keypress": {
    "`": "toggleBabylonDebugLayer",
    // Temporary until Double left click is set up
    "v": "unselectItem"
  },
  "keyup": {
    "Escape": "resetSelectedItem"
  },
  "click": {
    "Left" : "setupSelectedItem"
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

      // Create a tmp quaternion if it doesn't already exist
      // Babylon 2.4 only has 1 tmp quaternion
      // We use it for lastSurfaceNormal
      // TODO: Remove? :)
      if (!BABYLON.Tmp.Quaternion[1]){
        BABYLON.Tmp.Quaternion[1] = BABYLON.Quaternion.Identity();
      }

      if (!BABYLON.Tmp.Ray){
        BABYLON.Tmp.Ray = [];
      }
      if (!BABYLON.Tmp.Ray[0]){
        BABYLON.Tmp.Ray[0] = new BABYLON.Ray( BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero() );
      }

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
        let skydomeMaterial = vm.attr( "skydomeMaterial" );
        if ( skydomeMaterial ){
          // Moving the cloud 1 cycle over 400 seconds
          skydomeMaterial.diffuseTexture.uOffset += deltaTime * 0.0025;
        }

        let gravityItems = vm.attr("gravityItems");
        if ( gravityItems.length > 0 ){
          /*
           BABYLON.Vector3.Tmp usage:
           8: Gravity delta movement
           7: By adjustCollisionPos
           */
          BABYLON.Vector3.FromFloatsToRef( 0, scene.gravity.y * deltaTime, 0, BABYLON.Tmp.Vector3[ 8 ] );
          let gravityDistance = BABYLON.Tmp.Vector3[ 8 ];

          for ( let i = 0; i < gravityItems.length; ){
            // If applyGravity returns true it will be removed
            if (!vm.applyGravity( gravityItems[ i ], gravityDistance ) ) {
              // If false increase i by 1!
              ++i;
            } else {
              // Remove this item from having gravity affecting it
              vm.removeGravity( gravityItems[ i ] );
            }
          }
        }

        if ( vm.updateShadowmap ){
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
