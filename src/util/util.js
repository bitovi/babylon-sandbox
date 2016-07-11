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

