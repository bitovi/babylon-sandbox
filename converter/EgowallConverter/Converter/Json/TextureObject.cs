using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EgowallConverter.Converter.Json
{
    class TextureObject
    {
        /*
        {
        "animations": [],
        "coordinatesIndex": 0,
        "coordinatesMode": 0,
        "getAlphaFromRGB": false,
        "hasAlpha": false,
        "isCube": false,
        "isRenderTarget": false,
        "level": 1,
        "name": "data:Colo_Rug_Fab_LtBrown_001_Tex0_Diff.png",
        "uAng": 0,
        "uOffset": 0,
        "uScale": 1,
        "vAng": 0,
        "vOffset": 0,
        "vScale": 1,
        "wAng": 0,
        "wrapU": true,
        "wrapV": true
      }
      */
        public List<string> animations { get; set; } = new List<string>();
        public int coordinatesIndex { get; set; } = 0;
        public int coordinatesMode { get; set; } = 0;
        public bool getAlphaFromRGB { get; set; } = false;
        public bool hasAlpha { get; set; } = false;
        public bool isCube { get; set; } = false;
        public bool isRenderTarget { get; set; } = false;
        public int level { get; set; } = 1;
        public string name { get; set; } = "";
        public int uAng { get; set; } = 0;
        public int uOffset { get; set; } = 0;
        public int uScale { get; set; } = 1;
        public int vAng { get; set; } = 0;
        public int vOffset { get; set; } = 0;
        public int vScale { get; set; } = 1;
        public int wAng { get; set; } = 0;
        public bool wrapU { get; set; } = true;
        public bool wrapV { get; set; } = true;
    }
}
