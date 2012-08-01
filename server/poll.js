/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";
  var http = require('http')
    , url = require('url')
    , browserSocket
    , timeoutMap = {}
    , pollFlag = {}
    , activeRequest = {}
    , avgLatency = {}
    ;

  function init(path, interval, id, protocol, first, reopen) {
    if(path.substring(0,7) !== 'http://'){
      path = 'http://'+path;
    }
    makeRequest(url.parse(path, true), interval, id, protocol, first, reopen, path);
  }

  function makeRequest(options, interval, id, protocol, first, reopen, path) {
    console.log('polling', options.host, interval, protocol);
    var timeSent = Date.now()
      , reqId = timeSent
      , req
      ;
    if(first) {
      activeRequest[id] = {};
      avgLatency[id] = [0, 0, 0, 0, 0];
    }
    activeRequest[id][reqId] = true;
    currentLatency(interval, timeSent, id, reqId);
    req = http.request(options, function(res) {
      var responseMsg = '';
      if(first) {
        pollFlag[id] = true;
        if(!reopen){
          browserSocket.emit('pollTab', id, path, interval, protocol);
        }
      }
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        responseMsg += chunk;
      });
      res.on('end', function () {
        var timeout = calculateTimeout(interval, timeSent, id);
        browserSocket.emit('pollData', id, protocol, res.statusCode, res.headers, responseMsg, null);
        timeoutMap[id] = setTimeout(pollAgain, timeout, options, interval, id, protocol, reqId);
        delete activeRequest[id][reqId];
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ', e);
      delete activeRequest[id][reqId];
      if(first){
        var err = 'Check your url and try again: ';
        browserSocket.emit('pollData', 'default', protocol, null, null, null, err);
        return;
      }
      browserSocket.emit('pollData', 'default', protocol, null, null, null, e);
      browserSocket.emit('pollData', id, protocol, null, null, null, e);
      timeoutMap[id] = setTimeout(pollAgain, interval, options, interval, id, protocol, reqId);
    });

    req.on('socket', function(socket) {
      socket.on('error', function(error) {
        delete activeRequest[id][reqId];
        console.log('ERROR: ');
        console.log(error);
        browserSocket.emit('pollData', 'default', protocol, null, null, null, error);
        browserSocket.emit('pollData', id, protocol, null, null, null, error);
      });
    });

    req.end();
  }
  
  function pollAgain(options, interval, id, protocol, reqId) {
    if(pollFlag[id]){
      makeRequest(options, interval, id, protocol);
    }
    else{
      clearTimeout(timeoutMap[id]);
      delete activeRequest[id][reqId];
    }
  }
  
  function calculateTimeout(interval, timeSent, id) {
    var timeFinished = Date.now()
      , timeElapsed = timeFinished - timeSent
      ;
    manageLatency(id, timeElapsed, interval);
    console.log('time elapsed:', timeElapsed);
    if(timeElapsed < interval){
      return (interval - timeElapsed);
    }
    return 0;
  }
  
  function manageLatency(id, timeElapsed, interval) {
    avgLatency[id].shift();
    avgLatency[id].push(timeElapsed);
    var avg = getAvgLatency(id);
    console.log('avg', avg);
    if(avg < interval) {
      browserSocket.emit('latencyStable', id, avg);
    }
  }
  
  function currentLatency(interval, timeSent, id, reqId) {
    var timeElapsed = Date.now() - timeSent;
    //console.log('current latency', timeElapsed);
    if(timeElapsed > interval) {
      alertLatency(id, interval);
    }
    if(timeElapsed > interval*4) {
      alertLatency(id, interval, true);
      delete activeRequest[id][reqId];
    }
    if(activeRequest[id][reqId]){
      setTimeout(currentLatency, 5, interval, timeSent, id, reqId);
    }
  }
  
  function alertLatency(id, interval, force) {
    var avg = getAvgLatency(id);
    if(force || avg > interval) {
      browserSocket.emit('latency', id, avg);
    }
  }
  
  function getAvgLatency(id) {
    var avg = 0;
    avgLatency[id].forEach(function(val) {
      avg += val;
    });
    avg = avg/avgLatency[id].length;
    return avg;
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


