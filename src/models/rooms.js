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

export const Rooms = can.Map.extend({
  define: {
  }
});

Rooms.List = can.List.extend({
  Map: Rooms
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
      var rd = resp.rooms || {};
      delete resp[ "rooms" ];

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
        requestType: set.requestType || "roomLoad",
        format: set.format || "json",
        uroomID: parseInt( set.uroomID, 10 ) || 0
      };

      return $.ajax({
        url: "https://testing.egowall.com/ajax/rooms",
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
  idProp: "uroomID",
  Map: Rooms,
  List: Rooms.List,
  name: "rooms"
};

export const roomsConnection = connect( behaviors, options );

//tag( "rooms-model", roomsConnection );

export default Rooms;
