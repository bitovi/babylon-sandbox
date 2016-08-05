import can from 'can';
//import superMap from 'can-connect/can/super-map/';
//import tag from 'can-connect/can/tag/';
import 'can/map/define/define';

import $ from "jquery";
import connect from "can-connect";
import "can-connect/constructor/";
import "can-connect/can/map/";
import "can-connect/can/";
import "can-connect/constructor/store/";
import "can-connect/constructor/callbacks-once/";
import "can-connect/data/callbacks/";
//import "can-connect/data/callbacks-cache/";
//import "can-connect/data/combine-requests/";
//import "can-connect/data/inline-cache/";
//import "can-connect/data/localstorage-cache/";
import "can-connect/data/parse/";
import "can-connect/data/url/";
//import "can-connect/fall-through-cache/";
//import "can-connect/real-time/";

export const Constants = can.Map.extend({
  define: {
    /*
      isError: {
        set ( val ) {
          if ( typeof val === "string" ) {
            // if string specifically looks "truthy": "yes", "true", "1" then return true.
            // "false", "no", and "0" return false
            return /^[ty1]/i.test( val );
          }
          return val;
        }
      },
      hasData: {
        set ( val ) {
          if ( typeof val === "string" ) {
            // if string specifically looks "truthy": "yes", "true", "1" then return true.
            // "false", "no", and "0" return false
            return /^[ty1]/i.test( val );
          }
          return val;
        }
      },

      //

      hasNotifications: {
        set ( val ) {
          if ( typeof val === "string" ) {
            // if string specifically looks "truthy": "yes", "true", "1" then return true.
            // "false", "no", and "0" return false
            return /^[ty1]/i.test( val );
          }
          return val;
        }
      },
      newMails: { type: "number" },
      newNotes: { type: "number" },
      newGifts: { type: "number" }
    */
  }
});

Constants.List = can.List.extend({
  Map: Constants
}, {});

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
  {
    parseInstanceData ( resp ) {
      var obj = {};
      var respList = resp.materials || [];

      delete resp[ "materials" ];

      obj.materials = respList;
      obj.statusInfo = resp;

      return obj;
    }
  },
  "constructor-callbacks-once"
];

var options = {
  ajax: $.ajax,
  url: { 
    getData: function ( set ) {
      var postData = {
        requestType: set.requestType || "materialList",
        format: set.format || "json"
      };

      if ( set.sceneID ) {
        postData.sceneID = set.sceneID;
      }

      return $.ajax({
        url: "https://testing.egowall.com/ajax/constants",
        type: "POST",
        data: can.param( postData ),
        dataType: "json",
        xhrFields: {
          withCredentials: true
        },
        cache: false
      });
    }
  },
  idProp: "id",
  Map: Constants,
  List: Constants.List,
  name: "constants"
};

export const constantsConnection = connect( behaviors, options );

//tag( "constants-model", constantsConnection );

export default Constants;
