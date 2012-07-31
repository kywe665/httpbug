/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true devel:true*/
/*
 * BROWSER
 */

(function () {
  "use strict";
  var ender = require('ender')
    , $ = ender
    , window = require('window')
    , document = window.document
    , location = window.location
    , uiTabs = require('./ui-tabs')
    , io = require('socket.io-browser')
    , socket
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
   var port = $(this).parent().find('a').html();
    tabs.closeTab(port, this);
    socket.emit('stopPoll', port);
	});
  $('.container').on('.js-scroll', 'change', function(){
    visual.scrollLock({
      protocol: $(this).attr('data-protocol')
    }, $(this).closest('.js-ui-tab-view').attr('data-name'));
  });
  $('.container').on('.js-clear', 'click', function(){
    $(this).closest('.js-ui-tab-view').find('.js-'+$(this).attr('data-protocol')+'-stream').html('');
  });
  $('.container').on('.js-poll-button', 'click', function(){
    var url = $('.js-poll-url').val()
      , interval = parseInt($('.js-poll-interval').val(), 10) || 1000
      , id = 'poll' + ( parseInt($(this).attr('data-count'), 10)+1 )
      ;
    if(!url){
      visual.injectMessage({
        "protocol": "http",
        "body": "Please enter a url to poll.",
        "cssClass": "css-streamError"
      }, 'default');
      return;
    }
    socket.emit('poll', url, interval, id, true);
  });
  $('.container').on('.js-ui-tab-view:not(.css-active) .js-poll-form input', 'keypress', function(e){
    if(e.keyCode === 13){
      $('.js-poll-button').trigger('click');
    }
  });
  $('.container').on('.js-toggle-poll', 'click', function(){
    var id = $(this).closest('.js-ui-tab-view').attr('data-name')
      , url = $(this).attr('data-url')
      , interval = parseInt($(this).attr('data-interval'), 10)
      ;
    if($(this).closest('.js-ui-tab-view').hasClass('css-active')) {
      socket.emit('stopPoll', id);
      visual.stateChange('http', id, false);
    }
    else{
      socket.emit('poll', url, interval, id, true, true);
      visual.stateChange('http', id, true);
    }
  });
  /*$('.container').on('.js-ui-tab-view:not(.css-inactive) .js-log', 'click', function(){
    if($(this).attr('data-protocol') === 'http'){
      var port = $(this).closest('.js-ui-tab-view').attr('data-name');
      socket.emit('log' + $(this).attr('data-protocol'), port);
      $(this).toggleClass('activeLog');
    }
    else{
      socket.emit('log' + $(this).attr('data-protocol'));
      $(this).toggleClass('activeLog');
    }
  });*/
 
//SOCKET COMMUNICATION WITH SERVER 
  function openSocket(options) {
    socket = io.connect('http://'+window.location.hostname+':34541');
    socket.on('connect', function () {
      socket.send('hi');
      socket.on('pollData', function (id, respStatus, headers, body, error) {
        poll.formatMsg(id, respStatus, headers, body, error);
      });
      socket.on('pollTab', function(id, url, interval) {
        var current = parseInt($('.js-poll-button').attr('data-count'), 10);
        $('.js-poll-button').attr('data-count', current+1);
        tabs.makeNew('http', id, url, interval);
        visual.stateChange('http', id, true);
      });
      socket.on('disconnect', function () { 
        console.log('Browser-Disconnected socket');
        options.cssClass = 'css-streamError';
        options.body = 'NetBug Server Down';
        options.protocol = 'all';
        visual.injectMessage(options);
        options.active = false;
        $('.js-log.activeLog').trigger('click');
        visual.stateChange('all');
      });
    });
    /*socket.on('seperateFiles', function (protocol, port, id) {
      if($('.js-'+protocol+'-multifile').attr('checked')) {
        socket.emit('writeFile', protocol, port, id);
      }
    });*/
  }

}());

