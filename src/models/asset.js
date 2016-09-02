import can from 'can';
import 'can/map/define/define';
import JSZip from 'jszip/dist/jszip';

import $ from "jquery";
import connect from "can-connect";
import "can-connect/constructor/";
import "can-connect/can/map/";
import "can-connect/can/";
import "can-connect/constructor/store/";
//import "can-connect/constructor/callbacks-once/";
import "can-connect/data/callbacks/";
//import "can-connect/data/callbacks-cache/";
//import "can-connect/data/combine-requests/";
//import "can-connect/data/inline-cache/";
//import "can-connect/data/localstorage-cache/";
import "can-connect/data/parse/";
import "can-connect/data/url/";
//import "can-connect/fall-through-cache/";
//import "can-connect/real-time/";

// https://cdn.testing.egowall.com/CDN_new/Game/Assetbundles

export const Asset = can.Map.extend({
  define: {
    /*
      "ufurnID": "19181",
      "furnID": "361",
      "furnName": "Nightstand - Dark Mahogany",
      "furnDesc": "",
      "furnTypeID": "7",
      "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_NiStnd_Wd_Black_001.unity3d?v=1",
      "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_NiStnd_Wd_Black_001-mat.unity3d?v=1",
      "floorArg": "1",
      "ceilArg": "0",
      "furnArg": "1",
      "wallArg": "0",
      "parentID": "0",
      "parentType": "0",
      "snapOnSide": "0",
      "furnPhysics": "0",
      "customizable": "0",
      "multiMediaType": "0",
      "ucontainerID": 0,
      "scalable": "0",
      "particle": "1",
      "mass": "1",
      "position": {
        "x": "-10.96143",
        "y": "-0.5814251",
        "z": "4.530838"
      },
      "rotation": {
        "x": "-0.0000001067318",
        "y": "0.7071069",
        "z": "-0.0000001066364",
        "w": "0.7071067"
      },
      "scale": "1",
      "scaleX": "1",
      "scaleY": "1",
      "scaleZ": "1",
      "meshValues": null
    */
  }
});

Asset.List = can.List.extend({
  Map: Asset
}, {});

var unzipCache = {};
var texturesDropped = {};
var textureAlreadyUnpacked = {};

var commonFileResolution = function ( type, zipFileName, data ) {
  return {
    type,
    name: zipFileName,
    data: type === "json" ? JSON.parse( data ) : data
  }
};

var unzipPromise = function ( zipbuffer ) {
  var jszip = new JSZip();

  return jszip.loadAsync( zipbuffer ).then( function ( zip ) {
    var babylonFile, jsonFile, collisionFile;
    var textures = [];

    for ( var key in zip.files ) {
      if ( key === "collision.babylon" ) {
        collisionFile = zip.files[ key ];
      } else if ( key.endsWith( ".babylon" ) ) {
        babylonFile = zip.files[ key ];
      } else if ( key.endsWith( ".json" ) ) {
        jsonFile = zip.files[ key ];
      } else {
        textures.push( zip.files[ key ] );
      }
    }

    var newFiles = [];
    for ( let i = 0; i < textures.length; i++ ) {
      let texture = textures[ i ];
      // textureAlreadyUnpacked assumes all textures have a unique name and will be loaded 
      if ( !textureAlreadyUnpacked[ texture.name ] ) {
        let newTextureResolutionBound = commonFileResolution.bind( null, "texture", texture.name );
        newFiles.push( texture.async( "base64" ).then( newTextureResolutionBound ) );
        textureAlreadyUnpacked[ texture.name ] = true;
      }
    }

    if ( collisionFile ) {
      let collisionResolutionBound = commonFileResolution.bind( null, "collision", collisionFile.name )
      newFiles.push( collisionFile.async( "string" ).then( collisionResolutionBound ) );
    }

    if ( babylonFile ) {
      let babylonResolutionBound = commonFileResolution.bind( null, "babylon", babylonFile.name )
      newFiles.push( babylonFile.async( "string" ).then( babylonResolutionBound ) );
    }

    if ( jsonFile ) {
      let jsonResolutionBound = commonFileResolution.bind( null, "json", jsonFile.name )
      newFiles.push( jsonFile.async( "string" ).then( jsonResolutionBound ) );
    }

    return Promise.all( newFiles );
  });
};

var getAndUnzip = function ( url ) {
  if ( unzipCache[ url ] ) {
    return unzipCache[ url ];
  }

  unzipCache[ url ] = Promise.resolve(
    $.ajax({
      url: url,
      type: "GET",
      dataType : "binary",
      xhrFields : {
        responseType : "arraybuffer"
      }
    }).then( unzipPromise )
  );

  return unzipCache[ url ];
};

var filterFiles = function ( unzippedFiles ) {
  // changes 'unzippedFiles' to be without the textures
  var ret = [];
  for ( let i = 0; i < unzippedFiles.length; i++ ) {
    let fileInfo = unzippedFiles[ i ];
    if ( fileInfo.type === "collision" || fileInfo.type === "babylon" || fileInfo.type === "json" ) {
      ret.push( fileInfo );
    }
  }
  return ret;
};

var behaviors = [
  "constructor",
  "can-map",
  "constructor-store",
  "data-callbacks",
  //"data-callbacks-cache",
  //"data-combine-requests",
  //"data-inline-cache",
  "data-parse",
  "data-url",
  //"real-time",
  //"constructor-callbacks-once"
];

var options = {
  ajax: $.ajax,
  url: { 
    getData: function ( set ) {
      var url = set.furnURL || set.assetURL;

      url = url.replace( ".unity3d", ".zip" );

      // TODO: will need to remove this eventually
      url = url.replace( "/CDN/", "/CDN_new/" );

      var prom = unzipCache[ url ];

      if ( prom ) {
        // already been called for this object, only resolve with the .babylon file ( no textures )
        if ( !texturesDropped[ url ] ) {
          texturesDropped[ url ] = true;
          prom = prom.then( filterFiles );
          unzipCache[ url ] = prom;
        }
      }

      prom = prom || getAndUnzip( url );

      return prom.then( function ( unzippedFiles ) {
        // unzippedFiles is an array of [
        //   texture objects { name: string, data: base64 },
        //   and at the last index is the babylon file
        // ]
        set.attr( "unzippedFiles", unzippedFiles );
        return set;
      });
    }
  },
  idProp: "assetID",
  Map: Asset,
  List: Asset.List,
  name: "asset"
};


export const constantsConnection = connect( behaviors, options );

//tag( "asset-model", constantsConnection );

export default Asset;
