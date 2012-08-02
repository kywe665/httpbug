/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";
  var pure = require('./pure-inject')
    , visual = require('./visual')
    , ender = require('ender')
    , $ = ender
    , pd = require('pretty-data').pd
    ;

  function formatMsg(id, protocol, respStatus, headers, body, error){
    var msg = 'STATUS: ' + respStatus + '\r\n'
      , data = processBody(body)
      ;
    if(error){
      pure.injectMessage(protocol, {
        "message": prettyJson(error),
        "class": "css-streamError"
      }, 'default');
      pure.injectMessage(protocol, {
        "message": prettyJson(error),
        "class": "css-streamError"
      }, id);
    }
    else{
      msg += 'HEADERS: \r\n' + prettyJson(headers) + '\r\n';
      if(data.code){
        msg += 'BODY: \r\n' + data.code + '\r\n';
      }
      pure.injectCode(protocol, {'code': msg, 'xml': data.xml}, id);
    }
    visual.scrollLock({'protocol': protocol}, id);
    visual.scrollLock({'protocol': protocol}, 'default');
    visual.highlightMsg({"protocol": protocol});
  }

  function alertLatency(id, msg) {
    $('.js-ui-tab-view[data-name="'+id+'"] .js-connection-status').addClass('css-latency');
    $('.js-ui-tab-view[data-name="'+id+'"] .js-avg-latency').html(msg);
  }

  function latencyStable(id, msg) {
    $('.js-ui-tab-view[data-name="'+id+'"] .js-connection-status').removeClass('css-latency');
    $('.js-ui-tab-view[data-name="'+id+'"] .js-avg-latency').html(msg);
  }

  function prettyJson (json) {
    var json_pp = json;
    //TODO add try catch in case it's not JSON
    json_pp = JSON.stringify(json, null, '  ');
    json_pp = visual.syntaxHighlight(json_pp);
    return json_pp;
  }

  function processBody(body) {
    var xml
      , xml_pp
      , json_pp
      , data = {}
      ;
    if(typeof body !== 'string'){
      try{
        body = JSON.stringify(body);
      }
      catch(e){
        if(typeof body.toString() === 'string'){
          body = body.toString();
        }
        else{
          console.log('body not a string, unresolved datatype!');
          data.code = body;
          return data;
        }
      }
    }
    //if xml or html
    if(body.substring(0,1) === '<'){
      xml_pp = pd.xml(body);
      xml = xml_pp.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
      data.xml = xml;
    }
    //if json
    else if(body.charAt(0) === '{'){
      json_pp = JSON.parse(body);
      json_pp = JSON.stringify(json_pp, null, '  ');
      json_pp = visual.syntaxHighlight(json_pp);
      data.code += json_pp;
    }
    else{
      return {
        'code': body.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
      };
    }
    return data;
  }
  
  module.exports.formatMsg = formatMsg;
  module.exports.alertLatency = alertLatency;
  module.exports.latencyStable = latencyStable;
}());
