
function def(e, r) {
  return void 0 != e && null != e ? void 0 != r && null != r ? e : !0 : r != _null ? void 0 != r && null != r ? r : !1 : null
}

function _cs(e) {
  return -1 == e.toString().indexOf(".") ? e + "." : e.toString()
}
var _null = "set null anyway",
  red = 0,
  yellow = 1,
  white = 2,
  cyan = 4,
  blue = 5,
  pink = 6,
  black = 7,
  green = 8,
  cnrm = "nrm",
  sundir = "sundir(9.0,18.0,vec3(0.,10.,0.))",
  False = !1,
  True = !0;
String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/gm, "")
}, String.prototype.replaceAll = function(e, r, s) {
  return this.replace(new RegExp(e.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), s ? "gi" : "g"), "string" == typeof r ? r.replace(/\$/g, "$$$$") : r)
};
var shader_global = function() {
    var e = new Date,
      r = 1e4 * e.getFullYear() + 100 * e.getMonth() + e.getDay(),
      s = 1e4 * e.getHours() + 100 * e.getMinutes() + e.getSeconds(),
      t = 0,
      a = 0;
    return {
      x: r,
      y: s,
      z: t,
      w: a
    }
  },
  eash = {
    globalOption: {},
    textureReferences: {},
    ind: 0,
    shdrIndex: 0,
    defShader: function(e, r) {
      function s(e, s) {
        if (e) {
          a = s;
          var t;
          if (e.dy) {
            var n = e.dy.toDataURL("image/jpeg");
            t = new BABYLON.Texture(n, r)
          } else t = e.embed ? new BABYLON.Texture(e.embed, r, !0, !0, BABYLON.Texture.BILINEAR_SAMPLINGMODE, null, null, e.embed, !0) : new BABYLON.Texture(e, r);
          shaderMaterial.setTexture(a, t), (e.r || e.rx && e.ry) && e.r && (e.rx = e.r, e.ry = e.r)
        }
      }

      function t(e, s) {
        if (e) {
          a = s;
          var t;
          e && (t = new BABYLON.CubeTexture(e, r), t.coordinatesMode = BABYLON.Texture.PLANAR_MODE), shaderMaterial.setTexture(a, t), shaderMaterial.setMatrix("refmat", t.getReflectionTextureMatrix())
        }
      }
      def(eash.globalOption) && (eash.globalOption.alpha = def(eash.globalOption.alpha, def(eash.globalOption.alpha, !1)), eash.globalOption.back = def(eash.globalOption.back, def(eash.globalOption.back, !1)), eash.globalOption.wire = def(eash.globalOption.wire, def(eash.globalOption.wire, !1))), shaderMaterial = new BABYLON.ShaderMaterial(def(e.name, "eash_shader"), r, {
        vertexElement: e.shader.vtx,
        fragmentElement: e.shader.frg
      }, e.shader.u);
      var a = "";
      return def(eash.TextureReferences) && (def(eash.TextureReferences.ref1) && s(eash.TextureReferences.ref1, "ref1"), def(eash.TextureReferences.ref2) && s(eash.TextureReferences.ref2, "ref2"), def(eash.TextureReferences.ref3) && s(eash.TextureReferences.ref3, "ref3"), def(eash.TextureReferences.ref4) && s(eash.TextureReferences.ref4, "ref4"), def(eash.TextureReferences.ref5) && s(eash.TextureReferences.ref5, "ref5"), def(eash.TextureReferences.ref6) && s(eash.TextureReferences.ref6, "ref6"), def(eash.TextureReferences.ref7) && s(eash.TextureReferences.ref7, "ref7"), def(eash.TextureReferences.ref8) && s(eash.TextureReferences.ref8, "ref8"), def(eash.TextureReferences.refc1) && t(eash.TextureReferences.refc1, "refc1"), def(eash.TextureReferences.refc2) && t(eash.TextureReferences.refc2, "refc2"), def(eash.TextureReferences.refc3) && t(eash.TextureReferences.refc3, "refc3")), eash.globalOption.alpha ? shaderMaterial.needAlphaBlending = function() {
        return !0
      } : shaderMaterial.needAlphaBlending = function() {
        return !1
      }, eash.globalOption.back || (eash.globalOption.back = !1), shaderMaterial.needAlphaTesting = function() {
        return !0
      }, shaderMaterial.setFloat("time", 0), shaderMaterial.setVector3("camera", BABYLON.Vector3.Zero()), shaderMaterial.setVector2("mouse", BABYLON.Vector2.Zero()), shaderMaterial.setVector2("screen", BABYLON.Vector2.Zero()), shaderMaterial.backFaceCulling = !eash.globalOption.back, shaderMaterial.wireframe = eash.globalOption.wire, shaderMaterial.onCompiled = function() {}, shaderMaterial.onError = function(e, r) {}, shaderMaterial
    },
    normals: {
      nrm: "nrm",
      not_nrm: "-1.0*nrm",
      flat: "normalize(cross(dFdx(pos*-1.),dFdy(pos)))"
    },
    shaderBase: {
      vertex: function(e, r, s, t, a) {
        return s = def(s, [eash.sh_global(), r, eash.sh_uniform(), eash.sh_varing(), eash.sh_tools(), eash.sh_main_vertex(e, t, a)]), s.join("\n")
      },
      fragment: function(e, r, s, t, a) {
        return s = def(s, [eash.sh_global(), r, eash.sh_uniform(), eash.sh_varing(), eash.sh_tools(), eash.sh_main_fragment(e, t, a)]), s.join("\n")
      },
      shader: function(e) {
        e && !e.u && (e.u = {
          attributes: ["position", "normal", "uv"],
          uniforms: ["view", "world", "worldView", "viewProjection", "worldViewProjection"]
        }), eash.shdrIndex++;
        var r = e.vtx,
          s = e.frg;
        e.vtx = "sh_v_" + eash.shdrIndex, e.frg = "sh_f_" + eash.shdrIndex;
        var t = document.createElement("Script");
        t.setAttribute("id", e.vtx), t.setAttribute("type", "x-shader/x-vertex"), t.innerHTML = eash.shaderBase.vertex(r, e.helper, e.vtxops, def(e.id, 0), def(e.sysId, 0)), document.getElementById("shaders").appendChild(t);
        var a = document.createElement("Script");
        return a.setAttribute("id", e.frg), a.setAttribute("type", "x-shader/x-fragment"), a.innerHTML = eash.shaderBase.fragment(s, e.helper, e.frgops, def(e.id, 0), def(e.sysId, 0)), document.getElementById("shaders").appendChild(a), {
          shader: e
        }
      }
    },
    postProcessBase: {
      vertex: function(e, r, s, t, a) {
        return s = def(s, [eash.sh_global(), r, eash.sh_uniform_postProcess(), eash.sh_tools(), eash.sh_main_vertex_postprocess(e, t, a)]), s.join("\n")
      },
      fragment: function(e, r, s, t, a) {
        return s = def(s, [eash.sh_global(), r, eash.sh_uniform_postProcess(), eash.sh_tools(), eash.sh_main_fragment(e, t, a)]), s.join("\n")
      },
      postProcess: function(e) {
        e && !e.u && (e.u = {
          attributes: ["position"],
          uniforms: ["view", "world", "worldView", "viewProjection", "worldViewProjection"]
        }), eash.shdrIndex++;
        var r = e.vtx,
          s = e.frg;
        return e.vtx = "sh_v_" + eash.shdrIndex, e.frg = "sh_f_" + eash.shdrIndex, BABYLON.Effect.ShadersStore[e.frg + "PixelShader"] = eash.postProcessBase.fragment(s, e.helper, e.frgops, def(e.id, 0), def(e.sysId, 0)).replace("#extension GL_OES_standard_derivatives : enable", " ").replaceAll("\n", "  ").replaceAll("	", "    "), BABYLON.Effect.ShadersStore.postprocessVertexShader = eash.postProcessBase.vertex(r, e.helper, e.vtxops, def(e.id, 0), def(e.sysId, 0)).replaceAll("\n", "  ").replaceAll("	", "    "), e.frg
      }
    },
    isDebug: !1,
    sh_global: function() {
      return ["precision highp float;", "uniform mat4 worldViewProjection;", "uniform mat4 worldView;          ", "uniform mat4 world; "].join("\n")
    },
    sh_uniform: function() {
      return ["uniform vec3 camera;", "uniform vec2 mouse; ", "uniform float time; ", "uniform vec2 screen; ", "uniform vec3 glb; ", "uniform vec3 center; ", "uniform samplerCube refc1; ", "uniform samplerCube refc2; ", "uniform samplerCube refc3; ", "uniform sampler2D ref1; ", "uniform sampler2D ref2; ", "uniform sampler2D ref3; ", "uniform sampler2D ref4; ", "uniform sampler2D ref5; ", "uniform sampler2D ref6; ", "uniform sampler2D ref7; ", "uniform sampler2D ref8; ", "uniform vec3 vrefi; ", "uniform mat4 refmat; ", "uniform mat4 view;"].join("\n")
    },
    sh_uniform_postProcess: function() {
      return ["uniform sampler2D textureSampler; ", "uniform vec3 camera;", "uniform vec2 mouse; ", "uniform float time; ", "uniform vec2 screen; ", "uniform vec3 glb; ", "uniform vec3 center; ", "uniform sampler2D ref1; ", "uniform sampler2D ref2; ", "uniform sampler2D ref3; ", "uniform sampler2D ref4; ", "uniform sampler2D ref5; ", "uniform sampler2D ref6; ", "uniform sampler2D ref7; ", "varying vec2 uv;    "].join("\n")
    },
    sh_varing: function() {
      return ["varying vec3 pos;  ", "varying vec3 _pos;  ", "varying vec3 nrm;  ", "varying vec3 _nrm;  ", "varying vec2 u;    ", "varying vec2 u2;    ", "varying mat4 wvp;  ", def(eash.globalOption) ? def(eash.globalOption.hlp_Varying, "") : ""].join("\n")
    },
    sh_tools: function() {
      return ["vec3 random3(vec3 c) {   float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));   vec3 r;   r.z = fract(512.0*j); j *= .125;  r.x = fract(512.0*j); j *= .125; r.y = fract(512.0*j);  return r-0.5;  } ", "float rand(vec2 co){   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); } ", "const float F3 =  0.3333333;const float G3 =  0.1666667;", "float simplex3d(vec3 p) {   vec3 s = floor(p + dot(p, vec3(F3)));   vec3 x = p - s + dot(s, vec3(G3));  vec3 e = step(vec3(0.0), x - x.yzx);  vec3 i1 = e*(1.0 - e.zxy);  vec3 i2 = 1.0 - e.zxy*(1.0 - e);   vec3 x1 = x - i1 + G3;   vec3 x2 = x - i2 + 2.0*G3;   vec3 x3 = x - 1.0 + 3.0*G3;   vec4 w, d;    w.x = dot(x, x);   w.y = dot(x1, x1);  w.z = dot(x2, x2);  w.w = dot(x3, x3);   w = max(0.6 - w, 0.0);   d.x = dot(random3(s), x);   d.y = dot(random3(s + i1), x1);   d.z = dot(random3(s + i2), x2);  d.w = dot(random3(s + 1.0), x3);  w *= w;   w *= w;  d *= w;   return dot(d, vec4(52.0));     }  ", "float noise(vec3 m) {  return   0.5333333*simplex3d(m)   +0.2666667*simplex3d(2.0*m) +0.1333333*simplex3d(4.0*m) +0.0666667*simplex3d(8.0*m);   } ", "float dim(vec3 p1 , vec3 p2){   return sqrt((p2.x-p1.x)*(p2.x-p1.x)+(p2.y-p1.y)*(p2.y-p1.y)+(p2.z-p1.z)*(p2.z-p1.z)); }", "vec2  rotate_xy(vec2 pr1,vec2  pr2,float alpha) {vec2 pp2 = vec2( pr2.x - pr1.x,   pr2.y - pr1.y );return  vec2( pr1.x + pp2.x * cos(alpha*3.14159265/180.) - pp2.y * sin(alpha*3.14159265/180.),pr1.y + pp2.x * sin(alpha*3.14159265/180.) + pp2.y * cos(alpha*3.14159265/180.));} \n vec3  r_y(vec3 n, float a,vec3 c) {vec3 c1 = vec3( c.x,  c.y,   c.z );c1.x = c1.x;c1.y = c1.z;vec2 p = rotate_xy(vec2(c1.x,c1.y), vec2( n.x,  n.z ), a);n.x = p.x;n.z = p.y;return n; } \n vec3  r_x(vec3 n, float a,vec3 c) {vec3 c1 = vec3( c.x,  c.y,   c.z );c1.x = c1.y;c1.y = c1.z;vec2 p = rotate_xy(vec2(c1.x,c1.y), vec2( n.y,  n.z ), a);n.y = p.x;n.z = p.y;return n; } \n vec3  r_z(vec3 n, float a,vec3 c) {  vec3 c1 = vec3( c.x,  c.y,   c.z );vec2 p = rotate_xy(vec2(c1.x,c1.y), vec2( n.x,  n.y ), a);n.x = p.x;n.y = p.y;return n; }", "vec3 sundir(float da,float db,vec3 ps){ float h = floor(floor(glb.y/100.)/100.);float m =     floor(glb.y/100.) - h*100.;float s =      glb.y  - h*10000. -m*100.;float si = s *100./60.;float mi = m*100./60.;float hi = h+mi/100.+si/10000.;float dm = 180./(db-da); vec3  gp = vec3(ps.x,ps.y,ps.z);gp = r_z(gp," + (eash.isDebug ? "time*3.0" : " dm* hi -da*dm -90. ") + ",vec3(0.));gp = r_x(gp,40. ,vec3(0.)); gp.x = gp.x*-1.; gp.z = gp.z*-1.; return gp; }"].join("\n")
    },
    sh_main_vertex: function(e, r, s) {
      return ["attribute vec3 position; ", "attribute vec3 normal;   ", "attribute vec2 uv;       ", "attribute vec2 uv2;       ", "void main(void) { ", "   vec4 result; vec4  ref; result = vec4(position.x,position.y,position.z,1.0) ;", "   pos = vec3(position.x,position.y,position.z);", "   nrm = vec3(normal.x,normal.y,normal.z);", "   result = vec4(pos,1.0);", e, "   ", "   gl_Position = worldViewProjection * vec4( result );", "   pos = result.xyz;", "   _pos = vec3(world * vec4(pos, 1.0));", "   _nrm = normalize(vec3(world * vec4(nrm, 0.0)));", "   u = uv;", "   u2 = uv2;", def(eash.globalOption) ? def(eash.globalOption.hlp_Vertex, "") : "", "}"].join("\n")
    },
    sh_main_vertex_postprocess: function(e, r, s) {
      return [" attribute vec2 position; ", "                                ", " void main(void) {	                            ", "     uv = position*0.5+vec2(0.5,0.5);        ", "     gl_Position = vec4(position,0., 1.0);     ", " } "].join("  ")
    },
    sh_main_fragment: function(e, r, s) {
      return ["#extension GL_OES_standard_derivatives : enable", "void main(void) { ", "   vec4 result;vec4  ref; result = vec4(1.,0.,0.,0.);", "   float fw = (gl_FragCoord.x-screen.x/2.0)/(screen.x/2.0) ;", "   float fh = (gl_FragCoord.y-screen.y/2.0)/(screen.y/2.0) ;", "   float mw = (mouse.x-screen.x/2.0)/(screen.x/2.0) ;", "   float mh = (mouse.y-screen.y/2.0)/(screen.y/2.0) ;", "   ", e, "   gl_FragColor = vec4( result );", "}"].join("\n")
    },
    shader: function(e, r) {
      kg = {
        r: 0,
        g: 0,
        b: 0
      };
      var s = 0,
        t = 0;
      aia = 0, eash.globalOption = def(eash.globalOption, {}), eash.globalOption.id = s, eash.globalOption.sysId = t, eash.globalOption.cands = [], eash.globalOption.vtx = def(eash.globalOption) && def(eash.globalOption.vtx) ? eash.globalOption.vtx : null, eash.globalOption.frg = def(eash.globalOption) && def(eash.globalOption.frg) ? eash.globalOption.frg : null;
      var a = eash.defShader(eash.shaderBase.shader({
        vtx: def(eash.globalOption) && def(eash.globalOption.vtx) ? eash.globalOption.vtx : "result = vec4(pos ,1.0);",
        frg: e,
        helper: ""
      }), r);
      return a.isEashMaterial = !0, a
    },
    linerPostProcess: function(e, r, s) {
      var t = eash.postProcessBase.postProcess({
        frg: e,
        helper: ""
      });
      eash.ind++;
      var a = new BABYLON.PostProcess("name" + eash.ind, t, ["camera", "mouse", "time", "screen", "glb", "center", "ref1", "ref2", "ref3", "ref4", "ref5", "ref6", "ref7"], null, def(s, 1), r, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
      return a.onApply = function(e) {
        e.setFloat("time", time), e.setVector2("screen", {
          x: a.width,
          y: a.height
        }), e.setVector3("camera", r.position)
      }, a
    }
  };
eash.fback = "!gl_FrontFacing", eash.ffront = "gl_FrontFacing", eash.discard = "discard";
var shcolor = function(e, r, s, t) {
  var a = {
    r: 0,
    g: 0,
    b: 0,
    a: 0
  };
  if (!(e >= 0) || null != s && void 0 != s || null != t && void 0 != t) return e.length >= 3 ? (a.r = 1 * e[0], a.g = 1 * e[1], a.b = 1 * e[2], a.a = 1 * def(e[3], 1), a) : (a.r = null == e || void 0 == e ? 0 : 1 * e, a.g = null == r || void 0 == r ? 0 : 1 * r, a.b = null == s || void 0 == s ? 0 : 1 * s, a.a = null == t || void 0 == t ? 0 : 1 * t, a);
  var n = Color(e);
  return (null == r || void 0 == r) && (r = 1), a.r = 1 * n.r, a.g = 1 * n.g, a.b = 1 * n.b, a.a = r, a
};
var c = shcolor,
  cs = function(e, r, s, t) {
    var a = c(e, r, s, t);
    return {
      r: _cs(a.r),
      g: _cs(a.g),
      b: _cs(a.b),
      a: _cs(a.a)
    }
  },
  cs256 = function(e, r, s, t) {
    var a = c(e, r, s, t);
    return {
      r: _cs(256 * a.r),
      g: _cs(256 * a.g),
      b: _cs(256 * a.b),
      a: _cs(a.a)
    }
  },
  Color = function(e) {
    return 3 === arguments.length ? this.setRGB(arguments[0], arguments[1], arguments[2]) : ColorPs.set(e)
  },
  recolor = function(e, r) {
    var s;
    return r = def(r, 1), s = def(e.r) && def(e.g) && def(e.b) ? cs(e.r, e.g, e.b, r) : cs(e, r)
  };
ColorPs = {
  constructor: Color,
  r: 1,
  g: 1,
  b: 1,
  set: function(e) {
    return "number" == typeof e ? this.setHex(e) : "string" == typeof e && this.setStyle(e), this
  },
  setHex: function(e) {
    return e = Math.floor(e), this.r = (e >> 16 & 255) / 255, this.g = (e >> 8 & 255) / 255, this.b = (255 & e) / 255, this
  },
  setRGB: function(e, r, s) {
    return this.r = e, this.g = r, this.b = s, this
  },
  setHSL: function(e, r, s) {
    if (0 === r) this.r = this.g = this.b = s;
    else {
      var t = function(e, r, s) {
          return 0 > s && (s += 1), s > 1 && (s -= 1), 1 / 6 > s ? e + 6 * (r - e) * s : .5 > s ? r : 2 / 3 > s ? e + 6 * (r - e) * (2 / 3 - s) : e
        },
        a = .5 >= s ? s * (1 + r) : s + r - s * r,
        n = 2 * s - a;
      this.r = t(n, a, e + 1 / 3), this.g = t(n, a, e), this.b = t(n, a, e - 1 / 3)
    }
    return this
  },
  setStyle: function(e) {
    if (/^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.test(e)) {
      var r = /^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.exec(e);
      return this.r = Math.min(255, parseInt(r[1], 10)) / 255, this.g = Math.min(255, parseInt(r[2], 10)) / 255, this.b = Math.min(255, parseInt(r[3], 10)) / 255, this
    }
    if (/^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.test(e)) {
      var r = /^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.exec(e);
      return this.r = Math.min(100, parseInt(r[1], 10)) / 100, this.g = Math.min(100, parseInt(r[2], 10)) / 100, this.b = Math.min(100, parseInt(r[3], 10)) / 100, this
    }
    if (/^\#([0-9a-f]{6})$/i.test(e)) {
      var r = /^\#([0-9a-f]{6})$/i.exec(e);
      return this.setHex(parseInt(r[1], 16)), this
    }
    if (/^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.test(e)) {
      var r = /^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(e);
      return this.setHex(parseInt(r[1] + r[1] + r[2] + r[2] + r[3] + r[3], 16)), this
    }
  },
  copy: function(e) {
    return this.r = e.r, this.g = e.g, this.b = e.b, this
  },
  copyGammaToLinear: function(e) {
    return this.r = e.r * e.r, this.g = e.g * e.g, this.b = e.b * e.b, this
  },
  copyLinearToGamma: function(e) {
    return this.r = Math.sqrt(e.r), this.g = Math.sqrt(e.g), this.b = Math.sqrt(e.b), this
  },
  convertGammaToLinear: function() {
    var e = this.r,
      r = this.g,
      s = this.b;
    return this.r = e * e, this.g = r * r, this.b = s * s, this
  },
  convertLinearToGamma: function() {
    return this.r = Math.sqrt(this.r), this.g = Math.sqrt(this.g), this.b = Math.sqrt(this.b), this
  },
  getHex: function() {
    return 255 * this.r << 16 ^ 255 * this.g << 8 ^ 255 * this.b << 0
  },
  getHexString: function() {
    return ("000000" + this.getHex().toString(16)).slice(-6)
  },
  getHSL: function(e) {
    var r, s, t = e || {
          h: 0,
          s: 0,
          l: 0
        },
      a = this.r,
      n = this.g,
      o = this.b,
      i = Math.max(a, n, o),
      c = Math.min(a, n, o),
      l = (c + i) / 2;
    if (c === i) r = 0, s = 0;
    else {
      var f = i - c;
      switch (s = .5 >= l ? f / (i + c) : f / (2 - i - c), i) {
        case a:
          r = (n - o) / f + (o > n ? 6 : 0);
          break;
        case n:
          r = (o - a) / f + 2;
          break;
        case o:
          r = (a - n) / f + 4
      }
      r /= 6
    }
    return t.h = r, t.s = s, t.l = l, t
  },
  getStyle: function() {
    return "rgb(" + (255 * this.r | 0) + "," + (255 * this.g | 0) + "," + (255 * this.b | 0) + ")"
  },
  offsetHSL: function(e, r, s) {
    var t = this.getHSL();
    return t.h += e, t.s += r, t.l += s, this.setHSL(t.h, t.s, t.l), this
  },
  add: function(e) {
    return this.r += e.r, this.g += e.g, this.b += e.b, this
  },
  addColors: function(e, r) {
    return this.r = e.r + r.r, this.g = e.g + r.g, this.b = e.b + r.b, this
  },
  addScalar: function(e) {
    return this.r += e, this.g += e, this.b += e, this
  },
  multiply: function(e) {
    return this.r *= e.r, this.g *= e.g, this.b *= e.b, this
  },
  multiplyScalar: function(e) {
    return this.r *= e, this.g *= e, this.b *= e, this
  },
  lerp: function(e, r) {
    return this.r += (e.r - this.r) * r, this.g += (e.g - this.g) * r, this.b += (e.b - this.b) * r, this
  },
  equals: function(e) {
    return e.r === this.r && e.g === this.g && e.b === this.b
  },
  fromArray: function(e) {
    return this.r = e[0], this.g = e[1], this.b = e[2], this
  },
  toArray: function() {
    return [this.r, this.g, this.b]
  }
}, eash.solid = function(e, r) {
  e = def(e, 0), r = def(r, 1);
  var s = recolor(e);
  return s.a = r, " result = vec4(" + _cs(s.r) + ", " + _cs(s.g) + ", " + _cs(s.b) + ", " + _cs(s.a) + ");"
}, eash.light = function(e) {
  e = def(e, {}), e.color = def(e.color, 16777215);
  var r = recolor(e.color);
  def(e.dark, !1) && (r.r = 1 - r.r, r.g = 1 - r.g, r.b = 1 - r.b, e.c = -1 * def(e.c, .5));
  var s = eash.ind++;
  return ["  vec3 dir_" + s + "_ =normalize(" + def(e.pos, "_pos") + "- " + def(e.dir, "camera") + ");", "  dir_" + s + "_ =r_x(dir_" + s + "_ ," + _cs(def(e.rx, 0)) + ",vec3(0.0));", "  dir_" + s + "_ =r_y(dir_" + s + "_ ," + _cs(def(e.ry, 0)) + ",vec3(0.0));", "  dir_" + s + "_ =r_z(dir_" + s + "_ ," + _cs(def(e.rz, 0)) + ",vec3(0.0));", "  vec4 p1_" + s + "_ = vec4(" + def(e.dir, "camera") + ",.0);                                ", "  vec4 c1_" + s + "_ = vec4(" + _cs(r.r) + "," + _cs(r.g) + "," + _cs(r.b) + ",0.0);                                ", "                                                                ", "  vec3 vnrm_" + s + "_ = normalize(vec3(world * vec4(" + def(e.nrm, "nrm") + ", 0.0)));          ", "  vec3 l_" + s + "_= normalize(p1_" + s + "_.xyz- " + def(e.pos, "_pos") + ");                             ", "  vec3 vw_" + s + "_= normalize(camera- " + def(e.pos, "_pos") + ");                             ", "  vec3 aw_" + s + "_= normalize(vw_" + s + "_+ l_" + s + "_);                                    ", "  float sc_" + s + "_= max(0., dot(vnrm_" + s + "_, aw_" + s + "_));                             ", "  sc_" + s + "_= pow(sc_" + s + "_, " + _cs(def(e.s_p, 222)) + ")/" + _cs(def(e.s_n, .3)) + " ;                                       ", "  float ndl_" + s + "_ = max(0., dot(vnrm_" + s + "_, l_" + s + "_));                            ", "  float ls_" + s + "_ = " + (def(e.f, !1) ? "" : "1.0-") + "max(0.0,min(1.0, sc_" + s + "_*" + _cs(def(e.s, .5)) + "  +ndl_" + s + "_*" + _cs(def(e.p, .5)) + ")) ;         ", "  result  += vec4( c1_" + s + "_.xyz*(1.0-ls_" + s + "_)*" + _cs(def(e.c, 1)) + "  ,1.0-ls_" + s + "_);                    "].join("\n")
}, eash.flash = function(e) {
  var r = eash.ind++;
  return e = def(e, {}), ["  vec4 _nc_" + r + "_ = vec4(floor(abs(sin(pos.x+pos.y+pos.z+time*0.8)*2.)-0.1)); ", " result = result + _nc_" + r + "_*0.12 ;"].join("\n")
}, eash.phonge = function(e, r, s, t) {
  return t = def(t, sundir), r = def(r, 16777198), e = def(e, 2), s = def(s, 1118464), eash.light({
    dir: t,
    effect: "pr/" + _cs(e),
    color: r
  }) + eash.light({
    dir: nat(t),
    effect: "pr/" + _cs(e),
    color: s
  })
}, eash.spec = function(e, r, s, t) {
  return t = def(t, sundir), s = def(s, 16777198), r = def(r, 10), e = def(e, 90), eash.light({
    dir: avg(t, avg(camera, "nrm")),
    effect: intensive(e, r),
    color: s
  })
}, eash.multi = function(e, r) {
  for (var s = eash.ind++, t = "", a = ["", "", "", ""], n = 0, o = 0; o < e.length; o++) def(e[o].r) || (e[o] = {
    r: e[o],
    e: 1
  }), t += " vec4 result_" + s + "_" + o + ";result_" + s + "_" + o + " = vec4(0.,0.,0.,0.); float rp_" + s + "_" + o + " = " + _cs(e[o].e) + "; \n", t += e[o].r + "\n", t += " result_" + s + "_" + o + " = result; \n", a[0] += (0 == o ? "" : " + ") + "result_" + s + "_" + o + ".x*rp_" + s + "_" + o, a[1] += (0 == o ? "" : " + ") + "result_" + s + "_" + o + ".y*rp_" + s + "_" + o, a[2] += (0 == o ? "" : " + ") + "result_" + s + "_" + o + ".z*rp_" + s + "_" + o, a[3] += (0 == o ? "" : " + ") + "result_" + s + "_" + o + ".w*rp_" + s + "_" + o, n += e[o].e;
  return 1 == def(r, 0) && (a[0] = "(" + a[0] + ")/" + _cs(n), a[1] = "(" + a[1] + ")/" + _cs(n), a[2] = "(" + a[2] + ")/" + _cs(n), a[3] = "(" + a[3] + ")/" + _cs(n)), t += "result = vec4(" + a[0] + "," + a[1] + "," + a[2] + "," + a[3] + ");"
}, eash.alpha = function() {
  return eash.globalOption = def(eash.globalOption, {}), eash.globalOption.alpha = !0, ""
}, eash.back = function(e) {
  return eash.globalOption = def(eash.globalOption, {}), eash.globalOption.back = !0, "if(" + eash.fback + "){" + def(e, "discard") + ";}"
}, eash.front = function(e) {
  return eash.globalOption = def(eash.globalOption, {}), eash.globalOption.back = !0, "if(" + eash.ffront + "){" + def(e, "discard") + ";}"
}, eash.wire = function(e) {
  return eash.globalOption = def(eash.globalOption, {}), eash.globalOption.wire = !0, ""
}, eash.range = function(e) {
  var r = eash.ind++;
  return e = def(e, {}), e.pos = def(e.pos, "_pos"), e.point = def(e.point, "camera"), e.start = def(e.start, 50.1), e.end = def(e.end, 75.1), e.mat1 = def(e.mat1, "result = vec4(1.0,0.,0.,1.);"), e.mat2 = def(e.mat2, "result = vec4(0.0,0.,1.,1.);"), ["float s_r_dim_" + r + "_ = " + (def(e.dir) ? e.dir : " dim(" + e.pos + "," + e.point + ")") + ";", "if(s_r_dim_" + r + "_ > " + _cs(e.end) + "){", e.mat2, "}", "else { ", e.mat1, "   vec4 mat1_" + r + "_; mat1_" + r + "_  = result;", "   if(s_r_dim_" + r + "_ > " + _cs(e.start) + "){ ", e.mat2, "       vec4 mati2_" + r + "_;mati2_" + r + "_ = result;", "       float s_r_cp_" + r + "_  = (s_r_dim_" + r + "_ - (" + _cs(e.start) + "))/(" + _cs(e.end) + "-" + _cs(e.start) + ");", "       float s_r_c_" + r + "_  = 1.0 - s_r_cp_" + r + "_;", "       result = vec4(mat1_" + r + "_.x*s_r_c_" + r + "_+mati2_" + r + "_.x*s_r_cp_" + r + "_,mat1_" + r + "_.y*s_r_c_" + r + "_+mati2_" + r + "_.y*s_r_cp_" + r + "_,mat1_" + r + "_.z*s_r_c_" + r + "_+mati2_" + r + "_.z*s_r_cp_" + r + "_,mat1_" + r + "_.w*s_r_c_" + r + "_+mati2_" + r + "_.w*s_r_cp_" + r + "_);", "   }", "   else { result = mat1_" + r + "_; }", "}"].join("\n")
}, eash.fresnel = function(e) {
  return e = def(e, {}), eash.light({
    f: !0,
    dark: def(e.dark, !0),
    color: def(e.color, 0),
    c: def(e.c, .3),
    nrm: def(e.nrm, "nrm"),
    p: def(e.p, 1.7)
  })
}, eash.map = function(e) {
  e = def(e, {});
  var r = eash.ind++;
  e.uv = def(e.uv, "u"), e.na = def(e.na, 1), e.n1 = def(e.n1, e.na), e.n2 = def(e.n2, e.na), e.t1 = def(e.t1, 1), e.t2 = def(e.t2, 1), e.rx = def(e.rx, 0), e.ry = def(e.ry, 0), e.rz = def(e.rz, 0), e.n = def(e.n, 0), e.p1 = def(e.p1, "y"), e.p2 = def(e.p2, "z"), e.p3 = def(e.p3, "x"), e.ignore = def(e.ignore, "vec4(0.0,0.,0.,1.0);"), e.ref = "", eash.TextureReferences = def(eash.TextureReferences, {}), def(e.ref1) && (eash.TextureReferences.ref1 = e.ref1, e.ref = "ref1"), def(e.ref2) && (eash.TextureReferences.ref2 = e.ref2, e.ref = "ref2"), def(e.ref3) && (eash.TextureReferences.ref3 = e.ref3, e.ref = "ref3"), def(e.ref4) && (eash.TextureReferences.ref4 = e.ref4, e.ref = "ref4"), def(e.ref5) && (eash.TextureReferences.ref5 = e.ref5, e.ref = "ref5"), def(e.ref6) && (eash.TextureReferences.ref6 = e.ref6, e.ref = "ref6"), def(e.ref7) && (eash.TextureReferences.ref7 = e.ref7, e.ref = "ref7"), def(e.ref8) && (eash.TextureReferences.ref8 = e.ref8, e.ref = "ref8"), e.uv_ind = def(e.uv_ind, -1), e.uv_count = def(e.uv_count, 3);
  var s = "uv" == e.uv ? "uv" : "u",
    t = "face" == e.uv ? ["vec3 centeri_" + r + "_ = vec3(0.);", "vec3 ppo_" + r + "_ = r_z( pos," + _cs(e.rz) + ",centeri_" + r + "_);  ", " ppo_" + r + "_ = r_y( ppo_" + r + "_," + _cs(e.ry) + ",centeri_" + r + "_);  ", " ppo_" + r + "_ = r_x( ppo_" + r + "_," + _cs(e.rx) + ",centeri_" + r + "_);  ", "vec3 nrm_" + r + "_ = r_z( " + def(e.nrm, "_nrm") + "," + _cs(e.rz) + ",centeri_" + r + "_);  ", " nrm_" + r + "_ = r_y( nrm_" + r + "_," + _cs(e.ry) + ",centeri_" + r + "_);  ", " nrm_" + r + "_ = r_x( nrm_" + r + "_," + _cs(e.rx) + ",centeri_" + r + "_);  ", "vec4 color_" + r + "_ = texture2D(" + e.ref + ", vec2((ppo_" + r + "_." + e.p1 + "/" + _cs(e.n1) + ")+" + _cs(e.t1) + ",(ppo_" + r + "_." + e.p2 + "/" + _cs(e.n2) + ")+" + _cs(e.t2) + "));  ", def(e.befor) ? " color_" + r + "_ =" + e.effect.befor("pr", "rc_" + r + "_") + ";" : "", def(e.effect) ? " color_" + r + "_.x=" + e.effect.replaceAll("pr", "color_" + r + "_.x") + ";" : "", def(e.effect) ? " color_" + r + "_.y=" + e.effect.replaceAll("pr", "color_" + r + "_.y") + ";" : "", def(e.effect) ? " color_" + r + "_.z=" + e.effect.replaceAll("pr", "color_" + r + "_.z") + ";" : "", "if(nrm_" + r + "_." + e.p3 + "  <  " + _cs(e.n) + "  )                                                    ", "    color_" + r + "_ = " + e.ignore + ";                                              ", " result = color_" + r + "_; "].join("\n") : ["vec3 centeri_" + r + "_ = vec3(0.);", "vec3 ppo_" + r + "_ = r_z( vec3(" + s + ".x ," + s + ".y ,0.0)," + _cs(e.rz) + ",centeri_" + r + "_);  ", " ppo_" + r + "_ = r_y( ppo_" + r + "_," + _cs(e.ry) + ",centeri_" + r + "_);  ", " ppo_" + r + "_ = r_x( ppo_" + r + "_," + _cs(e.rx) + ",centeri_" + r + "_);  ", "vec4 color_" + r + "_ = texture2D(" + e.ref + ", vec2((ppo_" + r + "_." + e.p3 + "/" + _cs(e.n1) + ")+" + _cs(e.t1) + ",(ppo_" + r + "_." + e.p1 + "/" + _cs(e.n2) + ")+" + _cs(e.t2) + "));  ", def(e.effect) ? " color_" + r + "_.x=" + e.effect.replaceAll("pr", "color_" + r + "_.x") + ";" : "", def(e.effect) ? " color_" + r + "_.y=" + e.effect.replaceAll("pr", "color_" + r + "_.y") + ";" : "", def(e.effect) ? " color_" + r + "_.z=" + e.effect.replaceAll("pr", "color_" + r + "_.z") + ";" : "", " result = color_" + r + "_; "].join("\n");
  return t
}, eash.noise = function(e) {
  e = def(e, {});
  var r = eash.ind++;
  return e.pos = def(e.pos, "pos"), ["float i5_" + r + "_  =   noise(" + e.pos + ") ;", def(e.effect) ? "  i5_" + r + "_  =  " + e.effect.replaceAll("pr", "float i5_" + r + "_") + "  ;" : "", "result = vec4(i5_" + r + "_);"].join("\n")
}, eash.effect = function(e) {
  e = def(e, {});
  var r = eash.ind++;
  return ["vec4 res_" + r + "_ = vec4(0.);", "res_" + r + "_.x = " + (def(e.px) ? e.px.replaceAll("px", "result.x").replaceAll("py", "result.y").replaceAll("pz", "result.z").replaceAll("pw", "result.w") + ";" : " result.x;"), "res_" + r + "_.y = " + (def(e.py) ? e.py.replaceAll("px", "result.x").replaceAll("py", "result.y").replaceAll("pz", "result.z").replaceAll("pw", "result.w") + ";" : " result.y;"), "res_" + r + "_.z = " + (def(e.pz) ? e.pz.replaceAll("px", "result.x").replaceAll("py", "result.y").replaceAll("pz", "result.z").replaceAll("pw", "result.w") + ";" : " result.z;"), "res_" + r + "_.w = " + (def(e.pw) ? e.pw.replaceAll("px", "result.x").replaceAll("py", "result.y").replaceAll("pz", "result.z").replaceAll("pw", "result.w") + ";" : " result.w;"), "res_" + r + "_  = " + (def(e.pr) ? " vec4(" + e.pr.replaceAll("pr", "res_" + r + "_.x") + "," + e.pr.replaceAll("pr", "res_" + r + "_.y") + "," + e.pr.replaceAll("pr", "res_" + r + "_.z") + "," + e.pr.replaceAll("pr", "res_" + r + "_.w") + ");" : " res_" + r + "_*1.0;"), "result = res_" + r + "_ ;"].join("\n")
}, eash.vertex = function(e) {
  return eash.globalOption = def(eash.globalOption, {}), eash.globalOption.vtx = e, ""
}, eash.cameraShot = function(e) {
  return "result = vec4(texture2D(textureSampler, " + def(e.uv, "uv") + ").xyz,1.0) ;"
}, eash.filters = {
  glassWave: function(e) {
    return e = def(e, {}), e.radius = def(e.radius, .5), e.dispersion = def(e.dispersion, .005), e.r = def(e.r, e.radius), e.d = def(e.d, e.dispersion), "uv+vec2(cos(gl_FragCoord.x*" + _cs(e.r) + "  )+sin(gl_FragCoord.y*" + _cs(e.r) + "  ),cos(gl_FragCoord.y*" + _cs(e.r) + " )+sin(gl_FragCoord.x*" + _cs(e.r) + "))*" + _cs(e.d)
  }
}, eash.pointedBlur = function(e) {
  return e = def(e, {}), e.l = def(e.l, .55), e.dir1 = def(e.dir1, "vec2(-" + _cs(e.l) + ",-" + _cs(e.l) + ")"), e.dir2 = def(e.dir2, "vec2(" + _cs(e.l) + "," + _cs(e.l) + ")"), e.dir3 = def(e.dir3, "vec2(" + _cs(e.l) + ",-" + _cs(e.l) + ")"), e.dir4 = def(e.dir4, "vec2(-" + _cs(e.l) + "," + _cs(e.l) + ")"), e.r = def(e.r, 4.5), e.d = def(e.d, .001), eash.multi([eash.cameraShot({
    uv: eash.filters.glassWave(e)
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.005*" + e.dir1
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.01 *" + e.dir1
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.015*" + e.dir1
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.02 *" + e.dir1
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.025*" + e.dir1
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.005*" + e.dir2
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.01 *" + e.dir2
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.015*" + e.dir2
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.02 *" + e.dir2
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.025*" + e.dir2
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.005*" + e.dir3
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.01 *" + e.dir3
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.015*" + e.dir3
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.02 *" + e.dir3
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.025*" + e.dir3
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.005*" + e.dir4
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.01 *" + e.dir4
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.015*" + e.dir4
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.02 *" + e.dir4
  }), eash.cameraShot({
    uv: eash.filters.glassWave(e) + "+ 0.025*" + e.dir4
  })], !0)
};