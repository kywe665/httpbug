/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";
  var http = require('http')
    , url = require('url')
    , browserSocket
    , timeoutMap = {}
    , pollFlag = {}
    , activeRequest = {}
    ;

  function init(path, interval, id, first, reopen) {
    if(path.substring(0,7) !== 'http://'){
      path = 'http://'+path;
    }
    makeRequest(url.parse(path, true), interval, id, first, reopen, path);
  }

  function makeRequest(options, interval, id, first, reopen, path) {
    console.log('polling', options.host, interval);
    var timeSent = Date.now()
      , reqId = timeSent
      , req
      ;
    if(first) {
      activeRequest[id] = {};
    }
    activeRequest[id][reqId] = true;
    calculateLatency(interval, timeSent, id, reqId);
    req = http.request(options, function(res) {
      var responseMsg = '';
      if(first) {
        pollFlag[id] = true;
        if(!reopen){
          browserSocket.emit('pollTab', id, path, interval);
        }
      }
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        responseMsg += chunk;
      });
      res.on('end', function () {
        var timeout = calculateTimeout(interval, timeSent);
        console.log('timeout:', timeout);
        browserSocket.emit('pollData', id, res.statusCode, res.headers, responseMsg, null);
        timeoutMap[id] = setTimeout(pollAgain, timeout, options, interval, id, reqId);
        delete activeRequest[id][reqId];
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ', e);
      delete activeRequest[id][reqId];
      if(first){
        var err = 'Check your url and try again: ';
        browserSocket.emit('pollData', 'default', null, null, null, err);
        return;
      }
      browserSocket.emit('pollData', 'default', null, null, null, e);
      browserSocket.emit('pollData', id, null, null, null, e);
      timeoutMap[id] = setTimeout(pollAgain, interval, options, interval, id, reqId);
    });

    req.on('socket', function(socket) {
      socket.on('error', function(error) {
        delete activeRequest[id][reqId];
        console.log('ERROR: ');
        console.log(error);
        browserSocket.emit('pollData', 'default', null, null, null, error);
        browserSocket.emit('pollData', id, null, null, null, error);
      });
    });

    req.end();
  }
  
  function pollAgain(options, interval, id, reqId) {
    if(pollFlag[id]){
      makeRequest(options, interval, id);
    }
    else{
      clearTimeout(timeoutMap[id]);
      delete activeRequest[id][reqId];
    }
  }
  
  function calculateTimeout(interval, timeSent) {
    var timeFinished = Date.now()
      , timeElapsed = timeFinished - timeSent
      ;
    //calculateLatency(interval, timeSent);
    console.log('time elapsed:', timeElapsed);
    if(timeElapsed < interval){
      return (interval - timeElapsed);
    }
    return 0;
  }
  
  function calculateLatency(interval, timeSent, id, reqId) {
    var timeElapsed = Date.now() - timeSent;
    console.log('current latency', timeElapsed);
    if(timeElapsed > interval*2){
      alertLatency();
      delete activeRequest[id][reqId];
    }
    if(activeRequest[id][reqId]){
      setTimeout(calculateLatency, 5, interval, timeSent, id, reqId);
    }
  }
  
  function alertLatency() {
    console.log('ALERT SLOW NETWORK');
  }

  function stopPoll(id) {
    if(id === 'all') {
      Object.keys(timeoutMap).forEach(function(key){
        console.log('stopped polling ' + key);
        clearTimeout(timeoutMap[key]);
        pollFlag[key] = false;
      });
      return;
    }
    console.log('stopped polling ' + id);
    clearTimeout(timeoutMap[id]);
    Object.keys(activeRequest[id]).forEach(function(reqIds){
      delete activeRequest[id][reqIds];
    });
    pollFlag[id] = false;
  }

  function assignSocket (socket) {
    browserSocket = socket;
  }

  module.exports.init = init;
  module.exports.assignSocket = assignSocket;
  module.exports.stopPoll = stopPoll;
}());


