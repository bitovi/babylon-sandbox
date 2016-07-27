import $ from 'jquery';

export var childVM = function ( tagName ) {
  var $el = this.attr( "$el" );
  var $mm = $el && $el.find( tagName );
  var mmVM = $mm && $mm.viewModel && $mm.viewModel();
  
  return mmVM || null;
};

export var getControls = function () {
  var $el = $( "game-controls" );
  var gcVM = $el && $el.viewModel && $el.viewModel();
  
  return gcVM || null;
};

export var getTooltip = function () {
  var $el = $( "info-tooltip" );
  var ttVM = $el && $el.viewModel && $el.viewModel();
  
  return ttVM || null;
};

/*
  anyTruthy(    1    ); // true
  anyTruthy(   "1"   ); // true
  anyTruthy(    0    ); // false
  anyTruthy(   "0"   ); // false

  anyTruthy(  true   ); // true
  anyTruthy(  false  ); // false

  anyTruthy( "true"  ); // true
  anyTruthy( "false" ); // false
  anyTruthy( "TRUE"  ); // true
  anyTruthy(   "t"   ); // true
  anyTruthy( "FALSE" ); // false

  anyTruthy(  "yes"  ); // true
  anyTruthy(  "no"   ); // false
  anyTruthy(   "Y"   ); // true
  anyTruthy(   "n"   ); // false

  anyTruthy(   []    ); // false
  anyTruthy(   {}    ); // false
  anyTruthy(   [1]   ); // true
  anyTruthy(   ""    ); // false
*/
export var anyTruthy = function ( any ) {
  return /^[ty1]/i.test( any );
};
