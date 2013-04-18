var webdriver = require("wd"),
  debug = require("debug"),
  _ = require("underscore");

function emptyFunction() {}

function getFlexBrowser(options, callback) {
  var flex_browser = webdriver.remote(options.selenium.host, options.selenium.port, options.selenium.username, options.selenium.accessKey);

  function logCommand(method, path) {
    debug(method.yellow, path.grey);
  }

  function logStatus(info) {
    debug(info.blue);
  }

  flex_browser.on("status", logStatus);
  flex_browser.on("command", logCommand);

  flex_browser.done = function (callback) {

    flex_browser.quit(function () {
      if (options.selenium.instance) {
        debug("[info] Shutting down selenium");
        options.selenium.instance.kill();
      }
      if (options.app) {
        debug("[info] Shutting down local browser");
        options.app.close();
      }

      if (options.debug) {
        debug("[info] Done %s browser session".green, options.name);
      }
      if (callback) {
        callback(null);
      }
    });
    return flex_browser;
  };

  flex_browser.log = options.log;


  flex_browser = addDelayedClickFunctionsToBrowser(flex_browser);

  flex_browser.setPageLoadTimeout(options.pageLoadTimeout, emptyFunction);
  flex_browser.setImplicitWaitTimeout(options.waitTimeout, emptyFunction);


  function makeJsFunction(functionName, args) {
    return "return " + "document.Administrator." + command + "(" + args.join(',') + ");";
  }

  flex_browser.executeJS = function (code, timeout, cb) {
    if (_.isFunction(timeout)) {
      cb = timeout;
      timeout = 5000;
    }
    cb = cb || emptyFunction;
    flex_browser.executeAsync(code, cb);
  };


  flex_browser.waitForElementVisibleByFlexSelector = function (flex_selector, timeout, cb) {
    var _this = this,
      endTime = Date.now() + timeout,
      poll = function () {
        _this.executeJS(makeJsFunction("doFlexWaitForElementVisible", [flex_selector, timeout]), timeout, function (err, visible) {
          debug("[info] Waiting for \"%s\" selector to become visible", flex_selector);
          if (err) {
            return cb(new Error("couldn't wait for visible element: " + err.message));
          }

          if (visible) {
            cb(null);
          } else {
            if (Date.now() > endTime) {
              cb(new Error("Element didn't become visible"));
            } else {
              setTimeout(poll, 200);
            }
          }
        });
      };
    if (_.isFunction(timeout)) {
      cb = timeout;
      timeout = 5000;
    }
    timeout = timeout || 5000;
    poll();
  };


  //doFlexClick
  flex_browser.waitAndClickByFlexSelector = function (flex_selector, timeout, cb) {
    if (_.isFunction(timeout)) {
      cb = timeout;
      timeout = 5000;
    }
    timeout = timeout || 5000;
    waitForElementVisibleByFlexSelector(flex_selector, timeout, function (err) {
      if (err) {
        return cb(new Error("couldn't wait for visible element: " + err.message));
      }
      executeJS(makeJsFunction("doFlexClick", [flex_selector, timeout]), function (err, result) {
        if (err) {
          return cb(new Error("error clicking element: " + err.message));
        }
        cb(err, el);
      });
    });
  };

  //doFlexClick
  flex_browser.waitAndsetTextByFlexSelector = function (flex_selector, text, timeout, cb) {
    if (_.isFunction(timeout)) {
      cb = timeout;
      timeout = 5000;
    }
    timeout = timeout || 5000;
    waitForElementVisibleByFlexSelector(flex_selector, timeout, function (err) {
      if (err) {
        return cb(new Error("couldn't wait for visible element: " + err.message));
      }
      executeJS(makeJsFunction("doFlexType", [flex_selector, text, timeout]), function (err, result) {
        if (err) {
          return cb(new Error("error clicking element: " + err.message));
        }
        cb(err, el);
      });
    });
  };
  flex_browser.init(browserSelection.getBrowserCapabilities(options), function () {
    if (options.url) {
      flex_browser.get(options.url, function () {
        callback(null, flex_browser);
      });
    } else {
      callback(null, flex_browser);
    }
  });
}

module.exports = function (options, callback) {

  if (options.webServer.runLocally) {
    launchLocalServer(options.webServer, function (err, app, port) {
      if (err) {
        return callback(err);
      }
      options.webServer.app = app;
      options.webServer.port = port;

      getSeleniumAndBrowserInstance(options, function (err, browser, options) {
        return callback(null, browser, options);
      });
    });
  } else {
    getSeleniumAndBrowserInstance(options, function (err, browser, options) {
      return callback(null, browser, options);
    });
  }
};