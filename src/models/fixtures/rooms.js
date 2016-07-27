import fixture from 'can-fixture';
import _cloneDeep from 'lodash/cloneDeep.js';

var roomsResponse = {
  "isError": false,
  "hasData": true,
  "rooms": {
    "uroomID": "659",
    "roomID": "53",
    "roomStatus": "0",
    "meshes": [
      {
        "meshID": "1",
        "materialID": "43"
      },
      {
        "meshID": "2",
        "materialID": "43"
      },
      {
        "meshID": "3",
        "materialID": "43"
      },
      {
        "meshID": "4",
        "materialID": "87"
      },
      {
        "meshID": "5",
        "materialID": "19"
      },
      {
        "meshID": "6",
        "materialID": "17"
      },
      {
        "meshID": "7",
        "materialID": "21",
        "color": {
          "r": "0.8",
          "g": "0.4039216",
          "b": "0.2980392",
          "a": "1"
        }
      },
      {
        "meshID": "8",
        "materialID": "17"
      },
      {
        "meshID": "9",
        "materialID": "132"
      },
      {
        "meshID": "10",
        "materialID": "132"
      },
      {
        "meshID": "11",
        "materialID": "53"
      },
      {
        "meshID": "12",
        "materialID": "132"
      },
      {
        "meshID": "13",
        "materialID": "132"
      },
      {
        "meshID": "14",
        "materialID": "17"
      },
      {
        "meshID": "15",
        "materialID": "43"
      },
      {
        "meshID": "16",
        "materialID": "17"
      }
    ],
    "wallColor": {
      "r": "0",
      "g": "0",
      "b": "0"
    },
    "furnitures": [
      {
        "ufurnID": "19183",
        "furnID": "381",
        "furnName": "Floor Rug - Brown",
        "furnDesc": "",
        "furnTypeID": "17",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/Colo_Rug_Fab_LtBrown_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/Colo_Rug_Fab_LtBrown_001-mat.unity3d?v=1",
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
          "x": "0",
          "y": "0",
          "z": "0"
        },
        "rotation": {
          "x": "-0.00000007450578",
          "y": "0.00000008742277",
          "z": "-0.0000000642793",
          "w": "1"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "19184",
        "furnID": "353",
        "furnName": "19184 Credenza w\/Shelves - White",
        "furnDesc": "",
        "furnTypeID": "13",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/West_Chair_Leath_Brown_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/West_Chair_Leath_Brown_001-mat.unity3d?v=1",
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
          "x": "2",
          "y": "0",
          "z": "0"
        },
        "rotation": {
          "x": "0.000000375218",
          "y": "1",
          "z": "0.000001559441",
          "w": "-0.00000004495698"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "19185",
        "furnID": "353",
        "furnName": "19185 Credenza w\/Shelves - White",
        "furnDesc": "",
        "furnTypeID": "13",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/West_Chair_Leath_Brown_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/West_Chair_Leath_Brown_001-mat.unity3d?v=1",
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
          "x": "-2",
          "y": "0",
          "z": "0"
        },
        "rotation": {
          "x": "0.0000002714915",
          "y": "-0.7071065",
          "z": "0.0000005470065",
          "w": "0.7071071"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "19186",
        "furnID": "353",
        "furnName": "19186 Credenza w\/Shelves - White",
        "furnDesc": "",
        "furnTypeID": "13",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/West_Chair_Leath_Brown_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/West_Chair_Leath_Brown_001-mat.unity3d?v=1",
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
          "x": "0",
          "y": "0",
          "z": "2"
        },
        "rotation": {
          "x": "0.000000375218",
          "y": "1",
          "z": "0.000001559441",
          "w": "-0.00000004495698"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "19187",
        "furnID": "337",
        "furnName": "Theatre Sofa Leather w\/Pillows - Black",
        "furnDesc": "",
        "furnTypeID": "2",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/West_Chair_Leath_Brown_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/West_Chair_Leath_Brown_001-mat.unity3d?v=1",
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
          "x": "0",
          "y": "0",
          "z": "-2"
        },
        "rotation": {
          "x": "0.00000129016",
          "y": "-0.7071056",
          "z": "-0.0000005811453",
          "w": "0.7071079"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "19188",
        "furnID": "331",
        "furnName": "2-Tier Coffee Table - Black",
        "furnDesc": "",
        "furnTypeID": "8",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/KidsPrin_CeFan_Wd_LtPurp_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/KidsPrin_CeFan_Wd_LtPurp_001-mat.unity3d?v=1",
        "floorArg": "0",
        "ceilArg": "1",
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
          "x": "0",
          "y": "3",
          "z": "0"
        },
        "rotation": {
          "x": "0.0000004812887",
          "y": "0.7071095",
          "z": "0.000001362932",
          "w": "0.7071041"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "19192",
        "furnID": "55",
        "furnName": "Black Polymer Surface Table",
        "furnDesc": "",
        "furnTypeID": "5",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/KidsJng_Bed_Wd_LtBrown_002.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/KidsJng_Bed_Wd_LtBrown_002-mat.unity3d?v=1",
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
          "x": "0",
          "y": "0",
          "z": "0"
        },
        "rotation": {
          "x": "0.0000000007449545",
          "y": "0.000005023669",
          "z": "0.0000000009257254",
          "w": "1"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      }
    ],
    "egoObjects": "",
    "games": [{
      "ugameID": "551",
      "gameID": "8",
      "gameName": "Pong",
      "gameURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Game\/PongBounceGame.unity3d?v=1",
      "floorArg": "1",
      "ceilArg": "0",
      "furnArg": "1",
      "wallArg": "0",
      "parentID": "0",
      "parentType": "0",
      "gamePhysics": "1",
      "position": {
        "x": "2.77005",
        "y": "-0.5808874",
        "z": "1.554617"
      },
      "rotation": {
        "x": "0.0000000004661018",
        "y": "-0.000000004023605",
        "z": "0.000000008028991",
        "w": "1"
      }
    }],
    "mails": "",
    "stickyNotes": ""
  },
  "hasNotifications": "true",
  "newMails": 0,
  "newNotes": 0,
  "newGifts": 3
};

fixture({
  "POST /ajax/rooms": function ( req ) {
    var data = req.data || {};

    if ( data.requestType === "roomLoad" ) {
      return _cloneDeep( roomsResponse );
    }

    return { isError: true, hasData: false };
  }
});
