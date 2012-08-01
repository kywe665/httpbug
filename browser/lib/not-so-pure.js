/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

  var ender = require('ender')
    , $ = ender
    ;

  function injectTabView(port, protocol, newClass, url, interval){
    var template = 
      '<div data-name="'+port+'" class="js-ui-tab-view css-ui-tab-view js-all css-active">'+
        '<div class="css-connection-info">'+
          '<div class="css-connection-status js-connection-status">Connection Status</div>'+
        '</div>'+
        '<div class="css-top right">'+
          '<a data-protocol="'+protocol+'" class="css-button js-log css-log '+newClass+'"></a>'+
        '</div>'+
        '<div class="js-http-stream js-all-stream css-stream">'+
          '<span class="js-allstream-error"></span>'+
        '</div>'+
        '<div class="css-left css-bottom">'+
          '<a class="css-button css-toggle-poll js-toggle-poll '+newClass+'" data-url="'+url+'" data-interval="'+interval+'"></a>'+
        '</div>'+
        '<div class="css-center css-bottom">'+
          '<a data-protocol="'+protocol+'" class="css-button js-clear '+newClass+'">Clear</a>'+
        '</div>'+
        '<div class="css-right css-bottom">'+
          '<p>Lock scroll to bottom</p>'+
          '<input type="checkbox" checked="true" data-protocol="'+protocol+'" class="js-scroll '+newClass+'">'+
        '</div>'+
      '</span>'+
    '</div>';
    $('.js-ui-tab-view[data-name='+protocol+'] '+'.js-tab-container').append(template);
  }

  module.exports.injectTabView = injectTabView;

}());
