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
    , postData = {}
    , tabs = ['get', 'post', 'custom']
    ;
  tabs.forEach(function(protocol){
    timeoutMap[protocol] = {};
    pollFlag[protocol] = {};
    activeRequest[protocol] = {};
    avgLatency[protocol] = {};
  });

  function initGet(path, interval, id, reopen) {
    if(path.substring(0,7) !== 'http://'){
      path = 'http://'+path;
    }
    makeRequest(url.parse(path, true), interval, id, 'get', true, reopen, path);
  }

  function initPost(path, interval, id, reopen, data) {
    var options;
    if(path.substring(0,7) !== 'http://'){
      path = 'http://'+path;
    }
    if(!reopen){
      postData[id] = data;
    }
    options = url.parse(path, true);
    options.method = 'POST';
    makeRequest(options, interval, id, 'post', true, reopen, path);  
  }

  function makeRequest(options, interval, id, protocol, first, reopen, path) {
    console.log('polling', options.host, interval, protocol);
    var timeSent = Date.now()
      , reqId = timeSent
      , req
      ;
    if(first) {
      activeRequest[protocol][id] = {};
      avgLatency[protocol][id] = [interval, interval, interval, interval, interval];
    }
    activeRequest[protocol][id][reqId] = true;
    currentLatency(interval, timeSent, id, reqId, protocol);
    req = http.request(options, function(res) {
      var responseMsg = '';
      if(first) {
        pollFlag[protocol][id] = true;
        if(!reopen){
          browserSocket.emit('pollTab', id, path, interval, protocol);
        }
      }
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        responseMsg += chunk;
      });
      res.on('end', function () {
        var timeout = calculateTimeout(interval, timeSent, id, protocol);
        browserSocket.emit('pollData', id, protocol, res.statusCode, res.headers, responseMsg, null);
        timeoutMap[protocol][id] = setTimeout(pollAgain, timeout, options, interval, id, protocol, reqId);
        delete activeRequest[protocol][id][reqId];
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ', e);
      delete activeRequest[protocol][id][reqId];
      if(first){
        var err = 'Check your url and try again: ';
        browserSocket.emit('pollData', 'default', protocol, null, null, null, err);
        return;
      }
      browserSocket.emit('pollData', 'default', protocol, null, null, null, e);
      browserSocket.emit('pollData', id, protocol, null, null, null, e);
      timeoutMap[protocol][id] = setTimeout(pollAgain, interval, options, interval, id, protocol, reqId);
    });

    req.on('socket', function(socket) {
      socket.on('error', function(error) {
        delete activeRequest[protocol][id][reqId];
        console.log('ERROR: ');
        console.log(error);
        browserSocket.emit('pollData', 'default', protocol, null, null, null, error);
        browserSocket.emit('pollData', id, protocol, null, null, null, error);
      });
    });

    if(protocol === 'post') {
      req.write(postData[id]);
    }

    req.end();
  }
  
  function pollAgain(options, interval, id, protocol, reqId) {
    if(pollFlag[protocol][id]){
      makeRequest(options, interval, id, protocol);
    }
    else{
      clearTimeout(timeoutMap[protocol][id]);
      delete activeRequest[protocol][id][reqId];
    }
  }
  
  function calculateTimeout(interval, timeSent, id, protocol) {
    var timeFinished = Date.now()
      , timeElapsed = timeFinished - timeSent
      ;
    manageLatency(id, timeElapsed, interval, protocol);
    console.log('time elapsed:', timeElapsed);
    if(timeElapsed < interval){
      return (interval - timeElapsed);
    }
    return 0;
  }
  
  function manageLatency(id, timeElapsed, interval, protocol) {
    avgLatency[protocol][id].shift();
    avgLatency[protocol][id].push(timeElapsed);
    var avg = getAvgLatency(id, protocol);
    console.log('avg', avg);
    if(avg < interval) {
      browserSocket.emit('latencyStable', id, ' Latency: '+avg+'ms');
    }
  }
  
  function currentLatency(interval, timeSent, id, reqId, protocol) {
    var timeElapsed = Date.now() - timeSent;
    //console.log('current latency', timeElapsed);
    if(timeElapsed > interval) {
      alertLatency(id, protocol, interval);
    }
    if(timeElapsed > interval*3 && timeElapsed < interval*10) {
      alertLatency(id, protocol, interval, true);
      delete activeRequest[protocol][id][reqId];
    }
    if(timeElapsed >= interval*10) {
      alertLatency(id, protocol, interval, false, true);
      delete activeRequest[protocol][id][reqId];
    }
    if(activeRequest[protocol][id][reqId]){
      setTimeout(currentLatency, 5, interval, timeSent, id, reqId, protocol);
    }
  }
  
  function alertLatency(id, protocol, interval, force, lost) {
    var avg = getAvgLatency(id, protocol);
    if(force || avg > interval) {
      browserSocket.emit('latency', id, ' Latency: '+avg+'ms');
    }
    if(lost){
      browserSocket.emit('latency', id, 'Not responding...');
    }
  }
  
  function getAvgLatency(id, protocol) {
    var avg = 0;
    avgLatency[protocol][id].forEach(function(val) {
      avg += val;
    });
    avg = avg/avgLatency[protocol][id].length;
    return avg;
  }

  function stopPoll(id, protocol) {
    if(id === 'all') {
      Object.keys(timeoutMap).forEach(function(tab) {
        Object.keys(timeoutMap[tab]).forEach(function(key) {
          console.log('stopped polling ' + key);
          clearTimeout(timeoutMap[tab][key]);
          pollFlag[tab][key] = false;
        });
      });
      return;
    }
    console.log('stopped polling ' + id);
    clearTimeout(timeoutMap[protocol][id]);
    Object.keys(activeRequest[protocol][id]).forEach(function(reqIds){
      delete activeRequest[protocol][id][reqIds];
    });
    pollFlag[protocol][id] = false;
  }

  function assignSocket (socket) {
    browserSocket = socket;
  }

  module.exports.initGet = initGet;
  module.exports.initPost = initPost;
  module.exports.assignSocket = assignSocket;
  module.exports.stopPoll = stopPoll;
}());


