/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true devel:true*/
/*
 * BROWSER
 */

(function () {
  "use strict";
  var ender = require('ender')
    , $ = ender
    , reqwest = require('reqwest')
    , window = require('window')
    , document = window.document
    , location = window.location
    , uiTabs = require('./ui-tabs')
    , io = require('socket.io-browser')
    , socket
    , pd = require('pretty-data').pd
    , pure = require('./pure-inject')
    , visual = require('./visual')
    , tabs = require('./newTab')
    , poll = require('./poll-browser')
    ;
  
  $(document).ready(function() {
    var options = {};
    options.protocol = 'all';
    options.body = '';
    openSocket(options);
    uiTabs.create('body', '.js-ui-tab a', '.js-ui-tab', '.js-ui-tab-view', 'http/default');
  });
  
  //EVENT LISTENERS ALL
  $('.container').on('.js-all-stream pre', 'click', function(){
    $(this).toggleClass('css-hl-block');
  });
  $('.container').on('.js-ui-tab-view .js-close-tab', 'click', function(){
   var protocol = $(this).parent().attr('data-protocol')
      , port = $(this).parent().find('a').html()
      ;
    socket.emit('kill' + protocol, port);
    tabs.closeTab(port, this);
    if(port.indexOf('poll') !== -1){
      socket.emit('stopPoll', port);
    }
	});
  $('.container').on('.js-ui-tab-view:not(.css-active) .js-portNum', 'keypress', function(e){
    if(e.keyCode === 13){
      $('.js-openSocket.js-'+$(this).attr('data-protocol')).trigger('click');
    }
  });
  $('.container').on('.js-scroll', 'change', function(){
    scrollLock({
      protocol: $(this).attr('data-protocol')
    }, $(this).closest('.js-ui-tab-view').attr('data-name'));
  });
  $('.container').on('.js-clear', 'click', function(){
    $(this).closest('.js-ui-tab-view').find('.js-'+$(this).attr('data-protocol')+'-stream').html('');
  });
  $('.container').on('.js-ui-tab-view:not(.css-inactive) .js-log', 'click', function(){
    if($(this).attr('data-protocol') === 'http'){
      var port = $(this).closest('.js-ui-tab-view').attr('data-name');
      socket.emit('log' + $(this).attr('data-protocol'), port);
      $(this).toggleClass('activeLog');
    }
    else{
      socket.emit('log' + $(this).attr('data-protocol'));
      $(this).toggleClass('activeLog');
    }
  });
  $('.container').on('.js-poll-button', 'click', function(){
    var url = $('.js-poll-url').val()
      , interval = parseInt($('.js-poll-interval').val(), 10) || 1000
      , id = poll.getId()
      ;
    if(!url){
      injectMessage({
        "protocol": "http",
        "body": "Please enter a url to poll.",
        "cssClass": "css-streamError"
      }, 'default');
      return;
    }
    socket.emit('poll', url, interval, id, true);
  });

  //EVENT LISTENERS HTTP
  $('.container').on('.js-include-headers', 'change', function(){
    socket.emit('includeHeaders', $('.js-include-headers').attr('checked'));
  });
 
//SOCKET COMMUNICATION WITH SERVER 
  function openSocket(options) {
    socket = io.connect('http://'+window.location.hostname+':34541');
    socket.on('connect', function () {
      socket.send('hi');
      socket.on('pollData', function (id, respStatus, headers, body, error) {
        poll.formatMsg(id, respStatus, headers, body, error);
      });
      socket.on('pollTab', function(id) {
        tabs.makeNew('http', id);
      });
      socket.on('seperateFiles', function (protocol, port, id) {
        if($('.js-'+protocol+'-multifile').attr('checked')) {
          socket.emit('writeFile', protocol, port, id);
        }
      });
      socket.on('disconnect', function () { 
        console.log('Browser-Disconnected socket');
        options.cssClass = 'css-streamError';
        options.body = 'NetBug Server Down';
        options.protocol = 'all';
        injectMessage(options);
        options.active = false;
        $('.js-log.activeLog').trigger('click');
        visual.stateChange('all');
      });
    });
  }

  function scrollLock(options, port) {
    var portName = port || options.protocol
      , selector = '.js-ui-tab-view[data-name="'+portName+'"]'
      ;
    if($(selector +' .js-scroll.js-'+options.protocol).attr('checked') && $(selector +' .js-'+options.protocol+'-stream')[0].scrollHeight !== 0){
      $(selector + ' .js-'+options.protocol+'-stream')[0].scrollTop = $(selector +' .js-'+options.protocol+'-stream')[0].scrollHeight;
    }
    if($(selector +' .js-'+options.protocol+'-stream').children().length > 9){
      //console.log('cleared space: '+portName);
      $(selector +' .js-'+options.protocol+'-stream span').first().remove();
      $(selector +' .js-'+options.protocol+'-stream span').first().remove();
    }
  }

  function injectMessage(options, port) {
    pure.injectMessage(options.protocol, {
      'message': options.body,
      'class': options.cssClass
    }, port);
    scrollLock(options, port);
  }

  function injectCode(protocol, options, port) {
    var data = {};      
    data.code = options.headers || '';
    data = processBody(options, data);
    pure.injectCode(protocol, data, port);
    options.protocol = protocol;
    scrollLock(options, port);
    visual.highlightMsg(options);
  }
  
  function processBody(options, data) {
    var xml
      , xml_pp
      , json_pp
      ;
    //if xml
    if(options.body.substring(0,3) === '<?x'){
      xml_pp = pd.xml(options.body);
      xml = xml_pp.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
      data.xml = xml;
    }
    //if json
    else if(options.body.charAt(0) === '{'){
      json_pp = JSON.parse(options.body);
      json_pp = JSON.stringify(json_pp, null, '  ');
      json_pp = visual.syntaxHighlight(json_pp);
      data.code += json_pp;
    }
    else{
      data.code += options.body;
    }
    return data;
  }
}());

