import fixture from 'can-fixture';
import _cloneDeep from 'lodash/cloneDeep.js';

var materialResponse = {
  "isError": false,
  "hasData": true,
  "materials": [
    {
      "categoryID": "1",
      "materialID": "2",
      "materialName": "Arches",
      "internalName": "ArchWay_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/ArchWay_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/ArchWay_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/ArchWay_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "3",
      "materialName": "Bamboo",
      "internalName": "Bamboo_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Bamboo_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Bamboo_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Bamboo_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "4",
      "materialName": "Stone - Cobblestone",
      "internalName": "Brick_Stone_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Brick_Stone_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Brick_Stone_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Brick_Stone_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "5",
      "materialName": "Stone - Ashlar",
      "internalName": "Brick_Stone_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Brick_Stone_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Brick_Stone_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Brick_Stone_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "6",
      "materialName": "Canvas",
      "internalName": "Canvas_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Canvas_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Canvas_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Canvas_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "7",
      "materialName": "Carpet - Berber",
      "internalName": "Carpet_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Carpet_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Carpet_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Carpet_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "9",
      "materialName": "Columns and Dots",
      "internalName": "Column_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Column_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Column_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Column_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "12",
      "materialName": "Concrete - Light",
      "internalName": "Concrete_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Concrete_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Concrete_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Concrete_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "13",
      "materialName": "Concrete - Dark",
      "internalName": "Concrete_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Concrete_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Concrete_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Concrete_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "16",
      "materialName": "Concrete - Medium",
      "internalName": "Concrete_005",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Concrete_005.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Concrete_005.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Concrete_005.png"
    },
    {
      "categoryID": "1",
      "materialID": "17",
      "materialName": "Concrete - Dark Natural",
      "internalName": "Concrete_006",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Concrete_006.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Concrete_006.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Concrete_006.png"
    },
    {
      "categoryID": "1",
      "materialID": "18",
      "materialName": "Concrete - Light Natural",
      "internalName": "Concrete_007",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Concrete_007.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Concrete_007.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Concrete_007.png"
    },
    {
      "categoryID": "1",
      "materialID": "19",
      "materialName": "Concrete - Mottled",
      "internalName": "Concrete_008",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Concrete_008.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Concrete_008.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Concrete_008.png"
    },
    {
      "categoryID": "1",
      "materialID": "20",
      "materialName": "Concrete - Faux Marble",
      "internalName": "Concrete_Rough_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Concrete_Rough_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Concrete_Rough_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Concrete_Rough_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "21",
      "materialName": "Crown Molding",
      "internalName": "CrownMolding_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/CrownMolding_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/CrownMolding_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/CrownMolding_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "22",
      "materialName": "Tile - Decorative Ceiling",
      "internalName": "Decorative_CeilingTile_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Decorative_CeilingTile_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Decorative_CeilingTile_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Decorative_CeilingTile_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "25",
      "materialName": "Fluorescent Light",
      "internalName": "FluorescentLight_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/FluorescentLight_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/FluorescentLight_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/FluorescentLight_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "30",
      "materialName": "Grass",
      "internalName": "Grass_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Grass_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Grass_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Grass_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "34",
      "materialName": "Marble - Bricks",
      "internalName": "Marble_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Marble_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Marble_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Marble_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "35",
      "materialName": "Marble - Smooth",
      "internalName": "Marble_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Marble_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Marble_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Marble_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "36",
      "materialName": "Metropolitan - Black",
      "internalName": "Met_Black_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Met_Black_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Met_Black_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Met_Black_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "37",
      "materialName": "Metropolitan - Stainless",
      "internalName": "Met_StSteel_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Met_StSteel_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Met_StSteel_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Met_StSteel_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "38",
      "materialName": "Metal - Horizontal Panels",
      "internalName": "Metal_Panels_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Metal_Panels_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Metal_Panels_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Metal_Panels_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "39",
      "materialName": "Metal - Vertical Panels",
      "internalName": "Metal_Panels_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Metal_Panels_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Metal_Panels_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Metal_Panels_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "41",
      "materialName": "Parquet",
      "internalName": "Parque_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Parque_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Parque_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Parque_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "42",
      "materialName": "Space Pillar",
      "internalName": "Pillar_Space_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Pillar_Space_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Pillar_Space_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Pillar_Space_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "43",
      "materialName": "Plaster - Light",
      "internalName": "Plaster_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Plaster_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Plaster_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Plaster_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "45",
      "materialName": "Plaster - Light Brick",
      "internalName": "Plaster_003",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Plaster_003.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Plaster_003.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Plaster_003.png"
    },
    {
      "categoryID": "1",
      "materialID": "51",
      "materialName": "Plaster - Dark",
      "internalName": "Plaster_009",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Plaster_009.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Plaster_009.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Plaster_009.png"
    },
    {
      "categoryID": "1",
      "materialID": "52",
      "materialName": "Plaster - Dark Brick",
      "internalName": "Plaster_010",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Plaster_010.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Plaster_010.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Plaster_010.png"
    },
    {
      "categoryID": "1",
      "materialID": "53",
      "materialName": "Plaster - Medium",
      "internalName": "Plaster_011",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Plaster_011.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Plaster_011.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Plaster_011.png"
    },
    {
      "categoryID": "1",
      "materialID": "57",
      "materialName": "Door - SciFi",
      "internalName": "SciFi_Door_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Door_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Door_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Door_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "59",
      "materialName": "Floor - Vertical SciFi",
      "internalName": "SciFi_Floor_003",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Floor_003.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Floor_003.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Floor_003.png"
    },
    {
      "categoryID": "1",
      "materialID": "60",
      "materialName": "Floor - Horizontal SciFi",
      "internalName": "SciFi_Floor_004",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Floor_004.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Floor_004.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Floor_004.png"
    },
    {
      "categoryID": "1",
      "materialID": "62",
      "materialName": "Glow - SciFi",
      "internalName": "SciFi_Glow_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Glow_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Glow_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Glow_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "63",
      "materialName": "Metal - SciFi",
      "internalName": "SciFi_Metal_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Metal_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Metal_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Metal_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "64",
      "materialName": "Metal - Light SciFi",
      "internalName": "SciFi_Metal_Light_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Metal_Light_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Metal_Light_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Metal_Light_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "65",
      "materialName": "Panel - Tile SciFi",
      "internalName": "SciFi_Panel_Tile_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Panel_Tile_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Panel_Tile_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Panel_Tile_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "68",
      "materialName": "Panel - Horizontal SciFi",
      "internalName": "SciFi_Panels_003",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Panels_003.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Panels_003.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Panels_003.png"
    },
    {
      "categoryID": "1",
      "materialID": "69",
      "materialName": "Panel - Honeycomb SciFi",
      "internalName": "SciFi_Panels_004",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Panels_004.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Panels_004.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Panels_004.png"
    },
    {
      "categoryID": "1",
      "materialID": "71",
      "materialName": "Tile - Vertical SciFi",
      "internalName": "SciFi_Tile_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Tile_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Tile_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Tile_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "72",
      "materialName": "Trim - Horizontal SciFi",
      "internalName": "SciFi_Trim_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/SciFi_Trim_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/SciFi_Trim_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/SciFi_Trim_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "74",
      "materialName": "Slate - Shingles",
      "internalName": "Shingles_Slate_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Shingles_Slate_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Shingles_Slate_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Shingles_Slate_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "75",
      "materialName": "Spaceship - Exterior",
      "internalName": "ShipExt_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/ShipExt_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/ShipExt_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/ShipExt_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "78",
      "materialName": "Trim - Spaceship Floor",
      "internalName": "Space_Floor_Trim_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Space_Floor_Trim_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Space_Floor_Trim_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Space_Floor_Trim_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "80",
      "materialName": "Tile - Stone",
      "internalName": "Stone_Tile_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Stone_Tile_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Stone_Tile_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Stone_Tile_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "81",
      "materialName": "Stucco - Light",
      "internalName": "Stucco_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Stucco_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Stucco_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Stucco_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "83",
      "materialName": "Stucco - Medium",
      "internalName": "Stucco_003",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Stucco_003.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Stucco_003.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Stucco_003.png"
    },
    {
      "categoryID": "1",
      "materialID": "86",
      "materialName": "Trim - Thatch",
      "internalName": "Thatch_Trim_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Thatch_Trim_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Thatch_Trim_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Thatch_Trim_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "87",
      "materialName": "Tile - Concrete",
      "internalName": "Tile_Concrete_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Tile_Concrete_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Tile_Concrete_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Tile_Concrete_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "88",
      "materialName": "Tile - Porcelain",
      "internalName": "Tile_Porcelain_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Tile_Porcelain_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Tile_Porcelain_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Tile_Porcelain_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "89",
      "materialName": "Trim - Pattern Decorative",
      "internalName": "Trim_Decorative_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Trim_Decorative_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Trim_Decorative_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Trim_Decorative_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "90",
      "materialName": "Trim - Natural Decorative",
      "internalName": "Trim_Decorative_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Trim_Decorative_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Trim_Decorative_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Trim_Decorative_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "93",
      "materialName": "White",
      "internalName": "White_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/White_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/White_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/White_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "94",
      "materialName": "Panel - Window Accent",
      "internalName": "WindowAcntPnls_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/WindowAcntPnls_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/WindowAcntPnls_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/WindowAcntPnls_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "98",
      "materialName": "Wood - Walnut",
      "internalName": "Wood_004",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_004.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_004.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_004.png"
    },
    {
      "categoryID": "1",
      "materialID": "99",
      "materialName": "Wood - Tigerwood",
      "internalName": "Wood_005",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_005.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_005.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_005.png"
    },
    {
      "categoryID": "1",
      "materialID": "100",
      "materialName": "Wood - Gaboon",
      "internalName": "Wood_006",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_006.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_006.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_006.png"
    },
    {
      "categoryID": "1",
      "materialID": "104",
      "materialName": "Wood - Hickory",
      "internalName": "Wood_010",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_010.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_010.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_010.png"
    },
    {
      "categoryID": "1",
      "materialID": "105",
      "materialName": "Wood - Pine",
      "internalName": "Wood_011",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_011.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_011.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_011.png"
    },
    {
      "categoryID": "1",
      "materialID": "107",
      "materialName": "Wood - Teak",
      "internalName": "Wood_013",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_013.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_013.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_013.png"
    },
    {
      "categoryID": "1",
      "materialID": "108",
      "materialName": "Metropolitan - Dark",
      "internalName": "Met_Brown_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Met_Brown_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Met_Brown_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Met_Brown_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "110",
      "materialName": "Stucco - Dark",
      "internalName": "Stucco_006",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Stucco_006.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Stucco_006.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Stucco_006.png"
    },
    {
      "categoryID": "1",
      "materialID": "111",
      "materialName": "Trim - Wood",
      "internalName": "Trim_Wood_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Trim_Wood_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Trim_Wood_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Trim_Wood_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "112",
      "materialName": "Wood - Chestnut",
      "internalName": "Wood_014",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_014.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_014.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_014.png"
    },
    {
      "categoryID": "1",
      "materialID": "113",
      "materialName": "Wood - Blackwood",
      "internalName": "Wood_015",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_015.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_015.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_015.png"
    },
    {
      "categoryID": "1",
      "materialID": "114",
      "materialName": "Wood - Shutter",
      "internalName": "Wood_Shutter_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_Shutter_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_Shutter_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_Shutter_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "115",
      "materialName": "Wood - Barnwood",
      "internalName": "Wood_Wall_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_Wall_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_Wall_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_Wall_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "116",
      "materialName": "Metropolitan - Light",
      "internalName": "Met_Brown_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Met_Brown_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Met_Brown_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Met_Brown_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "118",
      "materialName": "Smooth Brick - Brown",
      "internalName": "Brick_Smooth_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Brick_Smooth_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Brick_Smooth_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Brick_Smooth_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "119",
      "materialName": "Tile - Boardwalk",
      "internalName": "Tile_Boardwalk_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Tile_Boardwalk_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Tile_Boardwalk_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Tile_Boardwalk_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "129",
      "materialName": "Shoji Screen",
      "internalName": "Shoji_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Shoji_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Shoji_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Shoji_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "130",
      "materialName": "Trim - Light Wood",
      "internalName": "Trim_Wood_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Trim_Wood_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Trim_Wood_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Trim_Wood_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "131",
      "materialName": "Wood - Light",
      "internalName": "Wood_016",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_016.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_016.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_016.png"
    },
    {
      "categoryID": "1",
      "materialID": "132",
      "materialName": "Wood - Horizontal Teak",
      "internalName": "Wood_017",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Wood_017.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Wood_017.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Wood_017.png"
    },
    {
      "categoryID": "1",
      "materialID": "1000",
      "materialName": "Default",
      "internalName": "Default_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Default_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Default_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Default_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "134",
      "materialName": "Organic Wall Panel",
      "internalName": "Decorative_WallPanel_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Decorative_WallPanel_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Decorative_WallPanel_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Decorative_WallPanel_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "133",
      "materialName": "Concrete - Mottled Light",
      "internalName": "Concrete_009",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Concrete_009.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Concrete_009.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Concrete_009.png"
    },
    {
      "categoryID": "1",
      "materialID": "135",
      "materialName": "Marble Narrow Brick ",
      "internalName": "Marble_Brick_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Marble_Brick_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Marble_Brick_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Marble_Brick_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "136",
      "materialName": "Metal - Smooth ",
      "internalName": "Met_Smooth_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Met_Smooth_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Met_Smooth_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Met_Smooth_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "137",
      "materialName": "Decorative Stone Wall",
      "internalName": "Stone_Blocks_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Stone_Blocks_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Stone_Blocks_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Stone_Blocks_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "138",
      "materialName": "Frosted Glass White",
      "internalName": "FrostedGlass_002",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/FrostedGlass_002.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/FrostedGlass_002.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/FrostedGlass_002.png"
    },
    {
      "categoryID": "1",
      "materialID": "141",
      "materialName": "Plaster - Taupe",
      "internalName": "Plaster_014",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Plaster_014.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Plaster_014.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Plaster_014.png"
    },
    {
      "categoryID": "1",
      "materialID": "139",
      "materialName": "Brick - Red",
      "internalName": "Brick_001",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Brick_001.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Brick_001.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Brick_001.png"
    },
    {
      "categoryID": "1",
      "materialID": "140",
      "materialName": "Plaster - Grey",
      "internalName": "Plaster_013",
      "materialURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Assetbundles\/Material\/Plaster_013.unity3d",
      "materialThumbURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/128\/Plaster_013.png",
      "materialImgURL": "https:\/\/cdn.testing.egowall.com\/CDN\/Game\/Images\/Material\/256\/Plaster_013.png"
    }
  ],
  "hasNotifications": "true",
  "newMails": 0,
  "newNotes": 0,
  "newGifts": 3
};

fixture({
  "POST https://testing.egowall.com/ajax/constants": function ( req ) {
    var data = req.data || {};

    if ( data.requestType === "materialList" ) {
      return _cloneDeep( materialResponse );
    }

    return { isError: true, hasData: false };
  }
});
