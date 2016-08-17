import fixture from 'can-fixture';
import _cloneDeep from 'lodash/cloneDeep.js';

var homesResponse1845 = {
  "isError": false,
  "hasData": true,
  "homes": {
    "homeID": "1845",
    "homeName": "Mountain Lot",
    "ownerVisitCount": "98",
    "visitorVisitCount": "0",
    "ownerFirstName": "James",
    "ownerLastName": "Atherton",
    "ownerUserID": "244",
    "defaultHome": 1,
    "ownerProfilePicFullURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Profile\/profile_male.png",
    "ownerProfilePicURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Profile\/profile_male.png",
    "ownerProfilePicThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Profile\/profile_male.png",
    "livingStyleID": "2",
    "livingStyleName": "Contemporary",
    "publicHome": "0",
    "livingSpaceID": "18",
    "floorCount": "1",
    "egoCount": "0",
    "furnCount": "18",
    "gameCount": "1",
    "frameID": "1",
    "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1",
    "frontviewID": "7",
    "frontviewURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/FrontView\/LS_15_frontview_1.unity3d?v=1",
    "interiorID": "7",
    "interiorURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Interior\/LS_15_interior_1.unity3d?v=1",
    "exteriorID": "7",
    "exteriorURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Exterior\/LS_15_exterior_1.unity3d?v=1",
    "frontDoorID": "1845",
    "defaultRoomID": "659",
    "clouds": {
      "cloudName": "clouds_1000",
      "cloudAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Skydome\/clouds_1000.unity3d?v=1"
    },
    "skyboxes": {
      "skyboxName": "Skybox_Sunny_001",
      "skyboxAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Skybox\/Skybox_Sunny_001.unity3d?v=1"
    },
    "mailbox": {
      "mailboxURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Mailbox\/LS_15_mailbox_1.unity3d?v=1",
      "mailCount": "0"
    },
    "lightmaps": {
      "lightmapName": "LS_18_lightmap_1400",
      "lightmapAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Lightmaps\/LS_18_lightmap_1400.unity3d?v=0"
    },
    "kitchenID": "7",
    "kitchenURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Kitchen\/LS_15_kitchen_1.unity3d?v=1",
    "miniMapURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Minimap\/LS_18_Minimap.unity3d?v=1",
    "frontDoorBundleURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/FrontDoor\/LS_15_Door_Front_1.unity3d?v=1",
    "frontDoorFacadeURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/FrontDoor\/?v=0",
    "terrainURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Terrain\/LS_18_Terrain_001.unity3d?v=1",
    "giftboxID": "1",
    "giftboxBundleURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Box\/giftbox.unity3d?v=1",
    "furnboxID": "2",
    "furnboxBundleURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Box\/furniture_box_1.unity3d?v=1",
    "userType": "1",
    "floorPlanBundles": [{
      "fpID": "1",
      "fpAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Home\/LS_18.unity3d?v=1",
      "fpMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Home\/LS_18-mat.unity3d?v=1"
    }],
    "roomBundles": [{
        "roomID": "53",
        "roomAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Room\/LS_18_LivingRoom_001.unity3d"
      },
      {
        "roomID": "54",
        "roomAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Room\/LS_18_Balcony_001.unity3d"
      }
    ],
    "roomStatus": [
      {
        "roomID": "53",
        "uroomID": "659",
        "roomName": "Studio",
        "roomTypeID": "3",
        "roomTypeName": "Living Room",
        "status": "0",
        "egoCount": "0",
        "furnCount": "18",
        "gameCount": "1",
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
        "isUserAllowed": "true"
      },
      {
        "roomID": "54",
        "uroomID": "660",
        "roomName": "Balcony",
        "roomTypeID": "14",
        "roomTypeName": "Balcony",
        "status": "0",
        "egoCount": "0",
        "furnCount": "0",
        "gameCount": "0",
        "meshes": [
          {
            "meshID": "1",
            "materialID": "19"
          },
          {
            "meshID": "2",
            "materialID": "17"
          },
          {
            "meshID": "3",
            "materialID": "17"
          },
          {
            "meshID": "4",
            "materialID": "17"
          },
          {
            "meshID": "5",
            "materialID": "17"
          },
          {
            "meshID": "6",
            "materialID": "17"
          },
          {
            "meshID": "7",
            "materialID": "17"
          }
        ],
        "isUserAllowed": "true"
      }
    ],
    "limits": {
      "containerEgoLimit": 50
    }
  },
  "ptsRewarded": 10,
  "eventName": "Entered One of Your Own Living Spaces",
  "hasNotifications": "true",
  "newMails": 0,
  "newNotes": 0,
  "newGifts": 3
};

var homesResponse1083 = {
  "isError": false,
  "hasData": true,
  "homes": {
    "homeID": "1083",
    "homeName": "Contemporary Showroom 2",
    "ownerVisitCount": "11",
    "visitorVisitCount": "0",
    "ownerFirstName": "dm",
    "ownerLastName": "ewtesting00",
    "ownerUserID": "123",
    "defaultHome": 1,
    "ownerProfilePicFullURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Profile\/profile_male.png",
    "ownerProfilePicURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Profile\/profile_male.png",
    "ownerProfilePicThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Profile\/profile_male.png",
    "livingStyleID": "2",
    "livingStyleName": "Contemporary",
    "publicHome": "1",
    "livingSpaceID": "27",
    "floorCount": "1",
    "egoCount": "10",
    "furnCount": "10",
    "gameCount": "1",
    "frameID": "1",
    "frameURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Frame\/Cont_Frame_Met_Black_001.unity3d?v=1",
    "frontviewID": "7",
    "frontviewURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/FrontView\/LS_15_frontview_1.unity3d?v=1",
    "interiorID": "7",
    "interiorURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Interior\/LS_15_interior_1.unity3d?v=1",
    "exteriorID": "7",
    "exteriorURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Exterior\/LS_15_exterior_1.unity3d?v=1",
    "frontDoorID": "1083",
    "defaultRoomID": "9667",
    "clouds": {
      "cloudName": "clouds_1000",
      "cloudAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Skydome\/clouds_1000.unity3d?v=1"
    },
    "skyboxes": {
      "skyboxName": "skybox_1400",
      "skyboxAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Skybox\/skybox_1400.unity3d?v=1"
    },
    "mailbox": {
      "mailboxURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Mailbox\/LS_15_mailbox_1.unity3d?v=1",
      "mailCount": "0"
    },
    "lightmaps": {
      "lightmapName": "LS_27_lightmap_1400",
      "lightmapAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Lightmaps\/LS_27_lightmap_1400.unity3d?v=0"
    },
    "kitchenID": "7",
    "kitchenURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Kitchen\/LS_15_kitchen_1.unity3d?v=1",
    "miniMapURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Minimap\/LS_27_Minimap.unity3d?v=1",
    "frontDoorBundleURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/FrontDoor\/LS_15_Door_Front_1.unity3d?v=1",
    "frontDoorFacadeURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/FrontDoor\/?v=0",
    "terrainURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Terrain\/LS_27_Terrain_001.unity3d?v=1",
    "giftboxID": "1",
    "giftboxBundleURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Box\/giftbox.unity3d?v=1",
    "furnboxID": "2",
    "furnboxBundleURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Box\/furniture_box_1.unity3d?v=1",
    "userType": "1",
    "floorPlanBundles": [{
      "fpID": "1",
      "fpAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Home\/LS_27.unity3d?v=1",
      "fpMatURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Home\/LS_27-mat.unity3d?v=1"
    }],
    "roomBundles": [{
      "roomID": "63",
      "roomAssetURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Room\/LS_27_ShowRoom_001.unity3d"
    }],
    "roomStatus": [{
      "roomID": "63",
      "uroomID": "9667",
      "roomName": "Showroom",
      "roomTypeID": "16",
      "roomTypeName": "Showroom",
      "status": "0",
      "egoCount": "10",
      "furnCount": "10",
      "gameCount": "1",
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
          //, "color": {
          //  "r": "0.435",
          //  "g": "0.439",
          //  "b": "0.435",
          //  "a": "1"
          //}
        },
        {
          "meshID": "5",
          "materialID": "43"
          //, "color": {
          //  "r": "0.435",
          //  "g": "0.439",
          //  "b": "0.435",
          //  "a": "1"
          //}
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
          //, "color": {
          //  "r": "0.973",
          //  "g": "0.616",
          //  "b": "0.176",
          //  "a": "1"
          //}
        }
      ],
      "isUserAllowed": "true"
    }],
    "limits": {
      "containerEgoLimit": 50
    }
  },
  "ptsRewarded": 10,
  "eventName": "Entered One of Your Own Living Spaces",
  "hasNotifications": "true",
  "newMails": 0,
  "newNotes": 0,
  "newGifts": 6
};

fixture({
  "POST https://testing.egowall.com/ajax/homes": function ( req ) {
    var data = req.data || {};
    /*
      POST DATA
      requestType=homeLoad
      format=json
      homeID=1845
      time=110000
    */

    if ( data.requestType === "homeLoad" ) {
      if ( data.homeID.toString() === "1845" ) {
        return _cloneDeep( homesResponse1845 );
      } else {
        return _cloneDeep( homesResponse1083 );
      }
    }

    return { isError: true, hasData: false };
  }
});
