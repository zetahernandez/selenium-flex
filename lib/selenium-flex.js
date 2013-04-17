var webdriver = require("wd");

function emptyFunction() {}

function getBrowserInstance(options, callback) {
  var flexBrowser = webdriver.remote(options.selenium.host, options.selenium.port, options.selenium.username, options.selenium.accessKey),
    browserCapabilities = options.browserCapabilities;

  function logCommand(method, path) {
    debug(method.yellow, path.grey);
  }

  function logStatus(info) {
    debug(info.blue);
  }

  flexBrowser.on("status", logStatus);
  flexBrowser.on("command", logCommand);

  flexBrowser.done = function (callback) {

    flexBrowser.quit(function () {
      if (options.selenium.instance) {
        debug("[info] Shutting down selenium");
        options.selenium.instance.kill();
      }
      if (options.app) {
        debug("[info] Shutting down local flexBrowser");
        options.app.close();
      }

      if (options.debug) {
        debug("[info] Done %s flexBrowser session".green, options.name);
      }
      if (callback) {
        callback(null);
      }
    });
    return flexBrowser;
  };

  flexBrowser.log = options.log;


  // browser = addDelayedClickFunctionsToBrowser(browser);

  flexBrowser.setPageLoadTimeout(options.pageLoadTimeout, emptyFunction);
  flexBrowser.setImplicitWaitTimeout(options.waitTimeout, emptyFunction);

  flexBrowser.executeJS = function (code, timeout, cb) {
    if (_.isFunction(timeout)) {
      cb = timeout;
      timeout = 5000;
    }
    cb = cb || emptyFunction;
    flexBrowser.execute(code, cb);
  };

  flexBrowser.init(browserCapabilities, function () {
    if (options.url) {
      flexBrowser.get(options.url, function () {
        callback(null, browser);
      });
    } else {
      callback(null, browser);
    }
  });

}