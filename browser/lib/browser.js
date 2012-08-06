/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true devel:true*/
/*
 * BROWSER
 */

(function () {
  "use strict";
  var ender = require('ender')
    , window = require('window')
    , $ = ender//window.jQuery/////////TODO
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
    /*setupCombo();
    $('.background').html('<div class="ui-widget"><label>Your preferred programming language: </label><select id="combobox"><option value="">Select one...</option><option value="ActionScript">ActionScript</option><option value="AppleScript">AppleScript</option><option value="Asp">Asp</option><option value="BASIC">BASIC</option><option value="C">C</option><option value="C++">C++</option><option value="Clojure">Clojure</option><option value="COBOL">COBOL</option><option value="ColdFusion">ColdFusion</option><option value="Erlang">Erlang</option><option value="Fortran">Fortran</option><option value="Groovy">Groovy</option><option value="Haskell">Haskell</option><option value="Java">Java</option><option value="JavaScript">JavaScript</option><option value="Lisp">Lisp</option><option value="Perl">Perl</option><option value="PHP">PHP</option><option value="Python">Python</option><option value="Ruby">Ruby</option><option value="Scala">Scala</option><option value="Scheme">Scheme</option></select></div>');
    setTimeout(function(){
      console.log('combo', $, window.jQuery, ender);
      window.jQuery( "#combobox" ).combobox();
      $( "#toggle" ).click(function() {
			$( "#combobox" ).toggle();
		});
    }, 1000);*/
    var options = {};
    options.protocol = 'all';
    options.body = '';
    openSocket(options);
    uiTabs.create('body', '.js-ui-tab a', '.js-ui-tab', '.js-ui-tab-view', 'get/default');
  });/*

  function setupCombo() {
    (function( $ ) {
		$.widget( "ui.combobox", {
			_create: function() {
				var input,
					self = this,
					select = this.element.hide(),
					selected = select.children( ":selected" ),
					value = selected.val() ? selected.text() : "",
					wrapper = this.wrapper = $( "<span>" )
						.addClass( "ui-combobox" )
						.insertAfter( select );

				input = $( "<input>" )
					.appendTo( wrapper )
					.val( value )
					.addClass( "ui-state-default ui-combobox-input" )
					.autocomplete({
						delay: 0,
						minLength: 0,
						source: function( request, response ) {
							var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
							response( select.children( "option" ).map(function() {
								var text = $( this ).text();
								if ( this.value && ( !request.term || matcher.test(text) ) )
									return {
										label: text.replace(
											new RegExp(
												"(?![^&;]+;)(?!<[^<>]*)(" +
												$.ui.autocomplete.escapeRegex(request.term) +
												")(?![^<>]*>)(?![^&;]+;)", "gi"
											), "<strong>$1</strong>" ),
										value: text,
										option: this
									};
							}) );
						},
						select: function( event, ui ) {
							ui.item.option.selected = true;
							self._trigger( "selected", event, {
								item: ui.item.option
							});
						},
						change: function( event, ui ) {
							if ( !ui.item ) {
								var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
									valid = false;
								select.children( "option" ).each(function() {
									if ( $( this ).text().match( matcher ) ) {
										this.selected = valid = true;
										return false;
									}
								});
								if ( !valid ) {
									// remove invalid value, as it didn't match anything
									$( this ).val( "" );
									select.val( "" );
									input.data( "autocomplete" ).term = "";
									return false;
								}
							}
						}
					})
					.addClass( "ui-widget ui-widget-content ui-corner-left" );

				input.data( "autocomplete" )._renderItem = function( ul, item ) {
					return $( "<li></li>" )
						.data( "item.autocomplete", item )
						.append( "<a>" + item.label + "</a>" )
						.appendTo( ul );
				};

				$( "<a>" )
					.attr( "tabIndex", -1 )
					.attr( "title", "Show All Items" )
					.appendTo( wrapper )
					.button({
						icons: {
							primary: "ui-icon-triangle-1-s"
						},
						text: false
					})
					.removeClass( "ui-corner-all" )
					.addClass( "ui-corner-right ui-combobox-toggle" )
					.click(function() {
						// close if already visible
						if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
							input.autocomplete( "close" );
							return;
						}

						// work around a bug (likely same cause as #5265)
						$( this ).blur();

						// pass empty string as value to search for, displaying all results
						input.autocomplete( "search", "" );
						input.focus();
					});
			},

			destroy: function() {
				this.wrapper.remove();
				this.element.show();
				$.Widget.prototype.destroy.call( this );
			}
		});
	})( jQuery );
  }*/
  
  //EVENT LISTENERS ALL
  $('.container').on('.js-all-stream pre', 'click', function(){
    $(this).toggleClass('css-hl-block');
  });
  $('.container').on('.js-ui-tab-view .js-close-tab', 'click', function(){
    var port = $(this).parent().find('a').html()
      , protocol = $(this).parent().attr('data-protocol')
      ;
    tabs.closeTab(port, this, protocol);
    socket.emit('stopPoll', port, protocol);
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
    startPoll(this);
  });
  $('.container').on('.js-poll-form input', 'keypress', function(e){
    if(e.keyCode === 13){
      $(this).closest('.js-ui-tab-view').find('.js-poll-button').trigger('click');
    }
  });
  $('.container').on('.js-toggle-poll', 'click', function(){
    var id = $(this).closest('.js-ui-tab-view').attr('data-name')
      , url = $(this).attr('data-url')
      , interval = parseInt($(this).attr('data-interval'), 10)
      , protocol = $(this).attr('data-protocol')
      ;
    if($(this).closest('.js-ui-tab-view').hasClass('css-active')) {
      socket.emit('stopPoll', id, protocol);
      visual.stateChange(protocol, id, false);
    }
    else{
      socket.emit('poll'+protocol, url, interval, id, true);
      visual.stateChange(protocol, id, true);
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

  function startPoll(that){
    var url = $(that).closest('.js-ui-tab-view').find('.js-poll-url').val()
      , interval = parseInt($(that).closest('.js-ui-tab-view').find('.js-poll-interval').val(), 10) || 1000
      , id = 'poll' + ( parseInt($(that).attr('data-count'), 10)+1 )
      , protocol = $(that).attr('data-protocol')
      , data = $(that).closest('.js-ui-tab-view').find('.js-poll-data').val()
      ;
    if(!url){
      visual.injectMessage({
        "protocol": protocol,
        "body": "Please enter a url to poll.",
        "cssClass": "css-streamError"
      }, 'default');
      return;
    }
    if(protocol === 'post'){
      try{
        JSON.parse(data);
      }
      catch(e){
        visual.injectMessage({
          "protocol": protocol,
          "body": "Invalid JSON.",
          "cssClass": "css-streamError"
        }, 'default');
        console.log(data);
        window.open('http://jsonlint.com/?json='+data, '_blank');
        return;
      }
    }
    socket.emit('poll'+protocol, url, interval, id, false, data);
  }
 
//SOCKET COMMUNICATION WITH SERVER 
  function openSocket(options) {
    socket = io.connect('http://'+window.location.hostname+':34541');
    socket.on('connect', function () {
      socket.send('hi');
      socket.on('pollData', function (id, protocol, respStatus, headers, body, error) {
        poll.formatMsg(id, protocol, respStatus, headers, body, error);
      });
      socket.on('pollTab', function(id, url, interval, protocol) {
        var current = parseInt($('.js-ui-tab-view[data-name="'+protocol+'"] .js-poll-button').attr('data-count'), 10);
        $('.js-ui-tab-view[data-name="'+protocol+'"] .js-poll-button').attr('data-count', current+1);
        tabs.makeNew(protocol, id, url, interval);
        visual.stateChange(protocol, id, true);
      });
      socket.on('latency', poll.alertLatency);
      socket.on('latencyStable', poll.latencyStable);
      socket.on('disconnect', function () { 
        console.log('Server Down');
        options.cssClass = 'css-streamError';
        options.body = 'HTTPBug Server Down';
        options.protocol = 'all';
        visual.injectMessage(options, 'default');
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

