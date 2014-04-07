/*global define, console, document, window, require*/
/*jslint browser: true*/

(function () {
	"use strict";

	function create_logger ($) {
		var logger_tries = 0,
			opts = {
				max_message_length: 150,
				max_tries: 50
			},
			private_functions = {},
			public_functions = {};

		private_functions.try_console = function (message) {
			if (typeof console !== 'undefined') {
				console.log(message);
			}
		};

		private_functions.try_ie_post = function (log_url, server_data) {
			var xdr;

			// jquery msie hack incase the plugin is not loaded
			if ($.browser === undefined) {
				$.browser = {};
				if (navigator.userAgent.indexOf('MSIE') === -1) {
					$.browser.msie = false;
				} else {
					$.browser.msie = true;
				}
			}

			if ($.browser.msie && window.XDomainRequest) {
				try {
					// Use Microsoft XDR
					xdr = new window.XDomainRequest();
					xdr.open("POST", log_url);
					xdr.send(server_data);
					xdr.onerror = function () {
						private_functions.try_console("js-client-logger: Unable to contact server to log client message, we even tried using XDomainRequest");
					};
				} catch (e) {
					private_functions.try_console("js-client-logger: Error before sending XDomainRequest: " + e);
				}
			} else {
				// If we can't contact the logging service, log to console instead
				private_functions.try_console("js-client-logger: Unable to contact server to log client message");
			}
		};

		private_functions.do_remote_log = function (message, sev, server_only) {
			var object, log_url, server_data;

			try {
				// trim the message if it is too large
				message = message.substring(0, opts.max_message_length);
			} catch (e) {
			}

			object = {
				message: message,
				path: window.location.href
			};

			// Log the number of logs we've submitted on this page
			if (typeof logger_tries !== 'undefined') {
				object.page_log_count = logger_tries;
			}

			// prep the url and data
			log_url = opts.logger_url  + '?sev=' + sev;
			server_data = JSON.stringify(object);

			if (typeof opts.logger_url !== 'undefined') {
				$.ajax({
					beforeSend: function (xhr) {
						xhr.withCredentials = true;
					},
					crossDomain: true,
					global: false,
					async: true,
					type: "POST",
					url: log_url,
					data: server_data,
					contentType: 'application/json',
					error: function (e) {
						private_functions.try_ie_post($, log_url, server_data);
					}
				});
			}
		};

		public_functions.log = function (message, sev, server_only) {
			var server_data, log_url;

			if (server_only !== true) {
				private_functions.try_console(message);
			}

			if (typeof sev !== 'undefined') {

				if (typeof opts.skip_function === 'function') {
					if (opts.skip_function()) {
						// Exit early!
						return;
					}
				}

				// try and end the logging if there were to many per page
				if (logger_tries > opts.max_tries) {
					private_functions.try_console('js-client-logger: Reached server side logging limit for this page. Refusing to try again!');
					return;
				} else {
					logger_tries = logger_tries + 1;
				}

				// run the user supplied collect info code
				if (typeof opts.collect_info === 'function') {
					opts.collect_info(message);
				}

				try {
					private_functions.do_remote_log(message, sev, server_only);
				} catch (e) {
					private_functions.try_console('js-client-logger: Error when trying to log server side: ' + e);
				}
			}
		};

		public_functions.init = function (user_opts) {

			$.extend(true, opts, user_opts);

			// Log all JavaScript errors
			window.onerror = function clientLoggerHandler(mess, url, lineNum, colNum, e) {

				var obj = {
					error_message: mess,
					script_url: url,
					line_number: lineNum,
					user_agent: navigator.userAgent
				};

				if (typeof colNum !== 'undefined') {
					obj.column_number = colNum;
				}

				if (typeof e !== 'undefined') {
					obj.error_obj = e;
				}

				public_functions.log(obj, 'error', true);
			};

			$(document).ajaxError(function (event, jq_xhr, ajax_settings, thrown_error) {
				// STOP IF WE GET HERE WITH THE logger_url!
				if (ajax_settings.url.indexOf(opts.logger_url) !== -1) {
					console.log('TEST');
					return;
				}

				public_functions.log({
					error_message: "js-client-logger jQuery.ajax error: '" + thrown_error + "'",
					error_code: 'HTTP ' + jq_xhr.status,
					service_url: ajax_settings.url,
					user_agent: window.navigator.userAgent
				}, 'error', true);
			});
		};
		return public_functions;
	}

	if (typeof define === 'function') {
		define('js-client-logger', ['jquery'], function ($) {
			"use strict";
			return create_logger($);
		});
	} else {
		var logger = create_logger(window.jQuery);
		window.js_client_logger = logger;
	}
}());

