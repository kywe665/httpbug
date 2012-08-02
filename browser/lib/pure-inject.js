/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function () {
  "use strict";
  var ender = require('ender')
    , $ = ender
    , pure = require('./pure').$p
    , messageDir
    , messageTemplate
    , codeDir
    , codeTemplate
    , timestampDir
    , timestampTemplate
    , tabDir
    , tabTemplate
    , tabContainerDir
    , tabContainerTemplate
    ;
  messageDir = {
    'span': 'message',
    '@class': 'class'
  };
  codeDir = {
    'span': 'code',
    'code': 'xml'
  };
  timestampDir = {
    'div': 'time'
  };
  tabDir = {
    'li@class+': 'class',
    'li@data-protocol': 'protocol',
    'a@href': 'tabLink',
    'a': 'portNum'
  };
  /*tabContainerDir = {
    'a.js-log@class': 'class-protocol',
    //'a.js-log@data-protocol': 'protocol',
    //'div.js-closeSocket@class': 'class-protocol',
    //'div.js-closeSocket@data-protocol': 'protocol',
    //'div.js-clear@class': 'class-protocol',
    //'div.js-clear@data-protocol': 'protocol',
    'div.js-scroll@class+': 'class-protocol',
    //'div.js-ui-tab-view@data-name': 'port-num',
    'div.js-scroll@data-protocol': 'protocol'
  };*/

  timestampTemplate = pure('.js-timestamp-template').compile(timestampDir);
  messageTemplate = pure('.js-message-template').compile(messageDir);
  codeTemplate = pure('.js-code-template').compile(codeDir);
  tabTemplate = pure('.js-tab-template').compile(tabDir);
  tabContainerTemplate = pure('.js-tab-container-template').compile(tabContainerDir);

  function injectMessage(protocol, data, port) {
    if(protocol === 'all') {
      $('.js-'+protocol+'-stream').append(addTime() + messageTemplate(data));
    }
    $('.js-ui-tab-view[data-name="'+protocol+'"] .js-ui-tab-view[data-name="'+port+'"] .js-'+protocol+'-stream').append(addTime() + messageTemplate(data));
  }
  
  function injectCode(protocol, data, port) {
    $('.js-ui-tab-view[data-name="'+protocol+'"] .js-ui-tab-view[data-name="'+port+'"] .js-'+protocol+'-stream').append(addTime() + codeTemplate(data));
  }
  
  function addTime () {
    return timestampTemplate({'time': new Date().toString()});
  }
  function injectNewTab(tab, container){
    $('.js-ui-tab-view[data-name='+tab.protocol+'] '+'.js-tab-bar').append(tabTemplate(tab));
    //console.log(container);
    //$('.js-ui-tab-view[data-name='+tab.protocol+'] '+'.js-tab-container').append(tabContainerTemplate(container));
  }

  module.exports.injectCode = injectCode;
  module.exports.injectMessage = injectMessage;
  module.exports.injectNewTab = injectNewTab;
}());
