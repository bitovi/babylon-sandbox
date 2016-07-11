import Component from 'can/component/';
import Map from 'can/map/';
import 'can/map/define/';
import './info-tooltip.less!';
import template from './info-tooltip.stache!';

export const ViewModel = Map.extend({
  define: {
    name: {
      value: ""
    },
    title: {
      value: ""
    },
    icon: {
      value: ""
    },
    description: {
      value: ""
    },
    left: {
      value: -200,
      set ( val, last ) {
        var $el = this.attr( "$el" );
        var el = $el && $el[ 0 ];
        if ( !el ) {
          return last;
        }
        el.style.left = val + "px";
        return val;
      }
    },
    top: {
      value: 200,
      set ( val, last ) {
        var $el = this.attr( "$el" );
        var el = $el && $el[ 0 ];
        if ( !el ) {
          return last;
        }
        el.style.top = val + "px";
        return val;
      }
    }
  },
  set ( name, title, icon, description, left, top ) {
    this.attr({
      name: name || "",
      title: title || "",
      icon: icon || "",
      description: description || "",
      left: left || 0,
      top: top || 0
    });
  },
  position ( left, top ) {
    this.attr({
      left,
      top
    });
  },
  clear ( onlyIfNameIsThis ) {
    if ( typeof onlyIfNameIsThis === "string" && this.attr( "name" ) !== onlyIfNameIsThis ) {
      return;
    }
    this.attr({
      name: "",
      title: "",
      icon: "",
      description: "",
      left: -200,
      top: 200
    });
  }
});

export default Component.extend({
  tag: 'info-tooltip',
  viewModel: ViewModel,
  template,
  events: {
    init () {
      this.viewModel.attr( "$el", this.element );
    }
  }
});
