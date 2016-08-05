import fixture from 'can-fixture';
import _cloneDeep from 'lodash/cloneDeep.js';

var roomsResponse659 = {
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
        "furnName": "Cont_CoTbl_Plstc_Red_001",
        "furnDesc": "",
        "furnTypeID": "2",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Plstc_Red_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN_new\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Plstc_Red_001-mat.unity3d?v=1",
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

var roomsResponse9667 = {
  "isError": false,
  "hasData": true,
  "rooms": {
    "uroomID": "9667",
    "roomID": "63",
    "roomStatus": "0",
    "meshes": [
      {
        "meshID": "1",
        "materialID": "36"
      },
      {
        "meshID": "2",
        "materialID": "43"
      },
      {
        "meshID": "3",
        "materialID": "7"
      },
      {
        "meshID": "4",
        "materialID": "43"
      },
      {
        "meshID": "5",
        "materialID": "43"
      },
      {
        "meshID": "6",
        "materialID": "83"
      },
      {
        "meshID": "7",
        "materialID": "83"
      },
      {
        "meshID": "8",
        "materialID": "36"
      },
      {
        "meshID": "9",
        "materialID": "43"
      },
      {
        "meshID": "10",
        "materialID": "43"
      },
      {
        "meshID": "11",
        "materialID": "43"
      },
      {
        "meshID": "12",
        "materialID": "43"
      },
      {
        "meshID": "13",
        "materialID": "43"
      },
      {
        "meshID": "14",
        "materialID": "43"
      },
      {
        "meshID": "15",
        "materialID": "45"
      }
    ],
    "wallColor": {
      "r": "0",
      "g": "0",
      "b": "0"
    },
    "furnitures": [
      {
        "ufurnID": "7209",
        "furnID": "1136",
        "furnName": "Picnic Table - Concrete",
        "furnDesc": "",
        "furnTypeID": "5",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Pub_Tbl_Cncrte_Grey_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Pub_Tbl_Cncrte_Grey_001-mat.unity3d?v=1",
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
        "particle": "0",
        "mass": "0",
        "position": {
          "x": "1.921036",
          "y": "0.02023613",
          "z": "10.78514"
        },
        "rotation": {
          "x": "0.0000000004629328",
          "y": "0.7071068",
          "z": "0.000000001396984",
          "w": "-0.7071068"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7210",
        "furnID": "1092",
        "furnName": "Ultramodern Side Table - Silver",
        "furnDesc": "",
        "furnTypeID": "6",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Met_Silvr_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Met_Silvr_001-mat.unity3d?v=1",
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
          "x": "-2.131833",
          "y": "0.02006668",
          "z": "11.12333"
        },
        "rotation": {
          "x": "-0.00000001970329",
          "y": "0.7071108",
          "z": "-0.00000002980232",
          "w": "-0.7071028"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7211",
        "furnID": "351",
        "furnName": "End Table w\/Drawer - Black\/White",
        "furnDesc": "",
        "furnTypeID": "6",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Plstc_Black_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Plstc_Black_001-mat.unity3d?v=1",
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
          "x": "-8.336865",
          "y": "0.02091293",
          "z": "8.250237"
        },
        "rotation": {
          "x": "0.0000002384066",
          "y": "0.7071072",
          "z": "0.0000004172407",
          "w": "-0.7071064"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7212",
        "furnID": "350",
        "furnName": "End Table w\/Drawer - White",
        "furnDesc": "",
        "furnTypeID": "6",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Plstc_White_002.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Plstc_White_002-mat.unity3d?v=1",
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
          "x": "-5.167996",
          "y": "0.0209129",
          "z": "10.98153"
        },
        "rotation": {
          "x": "0.000000000578459",
          "y": "0.7071068",
          "z": "0.000000001194167",
          "w": "-0.7071068"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7213",
        "furnID": "74",
        "furnName": "End Table w\/Drawer - Red\/White",
        "furnDesc": "",
        "furnTypeID": "6",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Plstc_Red_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Plstc_Red_001-mat.unity3d?v=1",
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
          "x": "-8.60048",
          "y": "0.02091323",
          "z": "2.816318"
        },
        "rotation": {
          "x": "-0.00000002492608",
          "y": "0.00000008742279",
          "z": "-0.00000001101802",
          "w": "1"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7214",
        "furnID": "73",
        "furnName": "Entertainment Console",
        "furnDesc": "",
        "furnTypeID": "6",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Plstc_White_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_SiTbl_Plstc_White_001-mat.unity3d?v=1",
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
          "x": "-8.391565",
          "y": "0.02030858",
          "z": "-3.693704"
        },
        "rotation": {
          "x": "-0.00000002467517",
          "y": "0.00000008744642",
          "z": "-0.00000001101709",
          "w": "1"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7215",
        "furnID": "332",
        "furnName": "2-Tier Coffee Table - White",
        "furnDesc": "",
        "furnTypeID": "8",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Plstc_White_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Plstc_White_001-mat.unity3d?v=1",
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
          "x": "-5.578031",
          "y": "0.02057479",
          "z": "-7.460605"
        },
        "rotation": {
          "x": "-0.000000024454",
          "y": "0.00000008712248",
          "z": "-0.000000007529533",
          "w": "1"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7216",
        "furnID": "333",
        "furnName": "2-Tier Coffee Table - Red",
        "furnDesc": "",
        "furnTypeID": "8",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Plstc_Red_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Plstc_Red_001-mat.unity3d?v=1",
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
          "x": "-1.867216",
          "y": "0.02057482",
          "z": "-7.580201"
        },
        "rotation": {
          "x": "0.000000001972269",
          "y": "0.0000000872016",
          "z": "-0.00000000007901854",
          "w": "1"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7217",
        "furnID": "61",
        "furnName": "Square Coffee Table - Black\/Silver",
        "furnDesc": "",
        "furnTypeID": "8",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Wd_Black_001.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Wd_Black_001-mat.unity3d?v=1",
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
          "x": "5.093264",
          "y": "0.0206449",
          "z": "-7.411722"
        },
        "rotation": {
          "x": "0.000000001468859",
          "y": "0.00000008194166",
          "z": "0.000000007108615",
          "w": "1"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      },
      {
        "ufurnID": "7218",
        "furnID": "62",
        "furnName": "Square Coffee Table - Dark Walnut",
        "furnDesc": "",
        "furnTypeID": "8",
        "furnURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Wd_Black_002.unity3d?v=1",
        "furnMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Furniture\/Cont_CoTbl_Wd_Black_002-mat.unity3d?v=1",
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
          "x": "6.025244",
          "y": "0.02064401",
          "z": "10.72727"
        },
        "rotation": {
          "x": "0.000000002118707",
          "y": "0.00000008742681",
          "z": "0",
          "w": "1"
        },
        "scale": "1",
        "scaleX": "1",
        "scaleY": "1",
        "scaleZ": "1",
        "meshValues": null
      }
    ],
    "egoObjects": [
      {
        "egoID": "760",
        "egoName": "LS_14_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c40a157e_54455562502541a2e96eac0b8c096a5c_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c40a157e_54455562502541a2e96eac0b8c096a5c_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c40a157e_54455562502541a2e96eac0b8c096a5c_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "8.975893",
            "y": "2.009406",
            "z": "-8.833194"
          },
          "rotation": {
            "x": "-0.0000000001281572",
            "y": "0.7071068",
            "z": "0.0000000001281572",
            "w": "-0.7071068"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "761",
        "egoName": "LS_18_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c41738a0_8c7d2450401f99286759c536b82d08fb_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c41738a0_8c7d2450401f99286759c536b82d08fb_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c41738a0_8c7d2450401f99286759c536b82d08fb_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "-6.276108",
            "y": "2.064928",
            "z": "-13.97501"
          },
          "rotation": {
            "x": "0.00000002185569",
            "y": "-6.371497e-17",
            "z": "0.000000003385085",
            "w": "1"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "762",
        "egoName": "LS_19_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c41b9c1e_3e39a1a6d0289d3fb7621a5f4e741260_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c41b9c1e_3e39a1a6d0289d3fb7621a5f4e741260_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c41b9c1e_3e39a1a6d0289d3fb7621a5f4e741260_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "4.446962",
            "y": "2.024934",
            "z": "-13.97501"
          },
          "rotation": {
            "x": "0.00000002185569",
            "y": "-1.355098e-17",
            "z": "0.000000001672079",
            "w": "1"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "763",
        "egoName": "LS_20_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c429aa3d_b9ee2fffacce34967b2657f57f2899c0_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c429aa3d_b9ee2fffacce34967b2657f57f2899c0_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c429aa3d_b9ee2fffacce34967b2657f57f2899c0_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "-11.14999",
            "y": "1.993457",
            "z": "-1.15464"
          },
          "rotation": {
            "x": "-0.000000004764735",
            "y": "0.7071068",
            "z": "-0.000000004764735",
            "w": "0.7071068"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "764",
        "egoName": "LS_21_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c42b750f_c3db9faa22ffc58bbae134d0dacfb45e_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c42b750f_c3db9faa22ffc58bbae134d0dacfb45e_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c42b750f_c3db9faa22ffc58bbae134d0dacfb45e_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "-1.136468",
            "y": "2.017981",
            "z": "-11.97501"
          },
          "rotation": {
            "x": "0.00000002185569",
            "y": "-1.355098e-17",
            "z": "0.000000001672079",
            "w": "1"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "765",
        "egoName": "LS_22_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c43bea42_d5a018c18021040baa054eaddf0b8b7f_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c43bea42_d5a018c18021040baa054eaddf0b8b7f_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c43bea42_d5a018c18021040baa054eaddf0b8b7f_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "-11.14999",
            "y": "2.002412",
            "z": "-8.249347"
          },
          "rotation": {
            "x": "0.000000001710152",
            "y": "0.7071068",
            "z": "0.000000001710152",
            "w": "0.7071068"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "766",
        "egoName": "LS_15_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c43c68c4_6f5cfb806aff63bc195b0806eb67b75c_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c43c68c4_6f5cfb806aff63bc195b0806eb67b75c_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c43c68c4_6f5cfb806aff63bc195b0806eb67b75c_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "8.975002",
            "y": "2.003242",
            "z": "9.781687"
          },
          "rotation": {
            "x": "0.00000002199348",
            "y": "0.7071068",
            "z": "-0.00000002199348",
            "w": "-0.7071068"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "767",
        "egoName": "LS_26_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c44ad8d1_bc673f91cfb1012f037065320424b2ad_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c44ad8d1_bc673f91cfb1012f037065320424b2ad_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c44ad8d1_bc673f91cfb1012f037065320424b2ad_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "3.785189",
            "y": "2.039741",
            "z": "13.39809"
          },
          "rotation": {
            "x": "-4.440892e-16",
            "y": "1",
            "z": "-0.000000002507505",
            "w": "-0.0000001629207"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "768",
        "egoName": "LS_24_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c44f27dd_b5e85e4cf7a1a5b3f62a000bedf04f37_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c44f27dd_b5e85e4cf7a1a5b3f62a000bedf04f37_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c44f27dd_b5e85e4cf7a1a5b3f62a000bedf04f37_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "-11.14999",
            "y": "2.024503",
            "z": "8.642382"
          },
          "rotation": {
            "x": "0.0000000000447715",
            "y": "0.7071068",
            "z": "0.0000000000447715",
            "w": "0.7071068"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      },
      {
        "egoID": "769",
        "egoName": "LS_27_screenshot_1920x1080.jpg",
        "containerID": "858",
        "egoThumbURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c4634101_f16f2623f29a0eadb0815cb24f8768f4_123_0.jpg&s=t",
        "egoAlbumURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c4634101_f16f2623f29a0eadb0815cb24f8768f4_123_0.jpg&s=a",
        "egoFullURL": "https:\/\/static.testing.egowall.com\/Photo\/photo.php?photoID=578e6c4634101_f16f2623f29a0eadb0815cb24f8768f4_123_0.jpg&s=f",
        "roomInfo": {
          "position": {
            "x": "-6.309093",
            "y": "1.978299",
            "z": "14.97482"
          },
          "rotation": {
            "x": "0.00000000006331333",
            "y": "1",
            "z": "-0.00000005960464",
            "w": "-0.00000004371139"
          },
          "linkufurnID": "0",
          "scale": "1",
          "parentID": "0",
          "parentType": "0",
          "scalePicture": "1",
          "frameID": "1",
          "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1"
        }
      }
    ],
    "games": [{
      "ugameID": "6199",
      "gameID": "6",
      "gameName": "RC Car",
      "gameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Game\/RCGame_RCCar.unity3d?v=1",
      "floorArg": "1",
      "ceilArg": "0",
      "furnArg": "1",
      "wallArg": "0",
      "parentID": "0",
      "parentType": "0",
      "gamePhysics": "1",
      "position": {
        "x": "7.536322",
        "y": "0.01335526",
        "z": "2.015244"
      },
      "rotation": {
        "x": "-0.0000003595387",
        "y": "0.7071168",
        "z": "-0.000000485219",
        "w": "-0.7070969"
      }
    }],
    "mails": "",
    "stickyNotes": ""
  },
  "hasNotifications": "true",
  "newMails": 0,
  "newNotes": 0,
  "newGifts": 6
};

fixture({
  "POST https://testing.egowall.com/ajax/rooms": function ( req ) {
    var data = req.data || {};

    if ( data.requestType === "roomLoad" ) {
      if ( data.uroomID.toString() === "659" ) {
        // studio room ( homeID = 1845 )
        return _cloneDeep( roomsResponse659 );
      } else {
        // showroom room ( homeID = 1083 )
        return _cloneDeep( roomsResponse9667 );
      }
    }

    return { isError: true, hasData: false };
  }
});
