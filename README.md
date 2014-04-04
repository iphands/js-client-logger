js-client-logger
================

A script that logs client side JavaScript messages to a server for persistence.<br/>
By default window.onerror and JQuery ajaxErrors are intercepted, logged and then left to do their own thing.<br/>
This lets you see what errors clients run into without teaching them about various JavaScript consoles.

##Simple Usage
~~
js_client_logger.init({
    logger_url: "/services/logger/log"
});
~~

##A logger that blacklists a User Agent
~~
js_client_logger.init({
    logger_url: "/services/logger/log",
    shouldSkip: function () {
        // example of how to skip certain user agents
        // anything that returns true will be skipped
        if (navigator.userAgent.indexOf('spider') !== -1) {
            return true;
        }
    }
});
~~

##What the payload to the server looks like
~~
{
  "message": {
    "error_message": "Uncaught TypeError: Cannot read property 'bar' of undefined",
    "script_url": "https://localhost/js-client-logger/example.html",
    "line_number": 26,
    "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
  },
  "path": "https://localhost/js-client-logger/example.html",
  "page_log_count": 1
}
~~