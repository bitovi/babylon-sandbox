import can from 'can';
import 'can/map/define/define';

import $ from "jquery";
import connect from "can-connect";
import "can-connect/constructor/";
import "can-connect/can/map/";
import "can-connect/can/";
import "can-connect/constructor/store/";
import "can-connect/constructor/callbacks-once/";
import "can-connect/data/callbacks/";
import "can-connect/data/parse/";
import "can-connect/data/url/";

export const Homes = can.Map.extend({
  define: {
  }
});

Homes.List = can.List.extend({
  Map: Homes
}, {});

var behaviors = [
  "constructor",
  "can-map",
  "constructor-store",
  "data-callbacks",
  "data-parse",
  "data-url",
  {
    parseInstanceData ( resp ) {
      var rd = resp.homes || {};
      delete resp[ "homes" ];

      rd.statusInfo = resp;

      return rd;
    }
  },
  "constructor-callbacks-once"
];

var options = {
  ajax: $.ajax,
  url: { 
    getData: function ( set ) {
      var postData = {
        requestType: set.requestType || "homeLoad",
        format: set.format || "json",
        homeID: parseInt( set.homeID, 10 ) || 0,
        time: 110000
      };

      return $.ajax({
        url: "https://testing.egowall.com/ajax/homes",
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
  Map: Homes,
  List: Homes.List,
  name: "homes"
};

export const homesConnection = connect( behaviors, options );

//tag( "homes-model", homesConnection );

export default Homes;
