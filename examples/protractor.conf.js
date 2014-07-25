var HtmlReporter = require('protractor-html-screenshot-reporter');
var path = require('path');
// A reference configuration file.
exports.config = {
  // ----- How to setup Selenium -----
  //
  // There are three ways to specify how to use Selenium. Specify one of the
  // following:
  //
  // 1. seleniumServerJar - to start Selenium Standalone locally.
  // 2. seleniumAddress - to connect to a Selenium server which is already
  //    running.
  // 3. sauceUser/sauceKey - to use remote Selenium servers via SauceLabs.

  // The location of the selenium standalone server .jar file.
  seleniumServerJar: 'node_modules/protractor/selenium/selenium-server-standalone-2.37.0.jar',
  // The port to start the selenium server on, or null if the server should
  // find its own unused port.
  seleniumPort: null,
  // Chromedriver location is used to help the selenium standalone server
  // find chromedriver. This will be passed to the selenium jar as
  // the system property webdriver.chrome.driver. If null, selenium will
  // attempt to find chromedriver using PATH.
  chromeDriver: 'node_modules/protractor/selenium/chromedriver',
  // Additional command line options to pass to selenium. For example,
  // if you need to change the browser timeout, use
  // seleniumArgs: ['-browserTimeout=60'],
  seleniumArgs: [],

  // If sauceUser and sauceKey are specified, seleniumServerJar will be ignored.
  // The tests will be run remotely using SauceLabs.
  sauceUser: null,
  sauceKey: null,

  // ----- What tests to run -----
  //
  // Spec patterns are relative to the location of this config.
  specs: [
    './specs/*.js'
  ],

  // ----- Capabilities to be passed to the webdriver instance ----
  //
  // For a full list of available capabilities, see
  // https://code.google.com/p/selenium/wiki/DesiredCapabilities
  // and
  // https://code.google.com/p/selenium/source/browse/javascript/webdriver/capabilities.js
  capabilities: {
    'browserName': 'chrome'
  },

  // A base URL for your application under test. Calls to protractor.get()
  // with relative paths will be prepended with this.
  baseUrl: 'http://localhost:9999',

  // Selector for the element housing the angular app - this defaults to
  // body, but is necessary if ng-app is on a descendant of <body>  
  rootElement: 'body',

  onPrepare: function() {
      // Add a screenshot reporter:
      jasmine.getEnv().addReporter(new HtmlReporter({
         baseDirectory: 'screenshots',
         takeScreenShotsOnlyForFailedSpecs: true,
         pathBuilder: function pathBuilder(spec, descriptions, results, capabilities) {
          
            var monthMap = {
              "1": "Jan",
              "2": "Feb",
              "3": "Mar",
              "4": "Apr",
              "5": "May",
              "6": "Jun",
              "7": "Jul",
              "8": "Aug",
              "9": "Sep",
              "10": "Oct",
              "11": "Nov",
              "12": "Dec"
            };

            var currentDate = new Date(),
                currentHoursIn24Hour = currentDate.getHours(),
                currentTimeInHours = currentHoursIn24Hour>12? currentHoursIn24Hour-12: currentHoursIn24Hour,
                totalDateString = currentDate.getDate()+'-'+ monthMap[currentDate.getMonth()+1]+ '-'+(currentDate.getYear()+1900) + 
                                      '-'+ currentTimeInHours+'h-' + currentDate.getMinutes()+'m';

            return path.join(totalDateString,capabilities.caps_.browserName, descriptions.join('-'));
         }
      }));
  },


  // ----- Options to be passed to minijasminenode -----
  jasmineNodeOpts: {
    // onComplete will be called just before the driver quits.
    onComplete: null,
    // If true, display spec names.
    isVerbose: false,
    // If true, print colors to the terminal.
    showColors: true,
    // If true, include stack traces in failures.
    includeStackTrace: true,
    // Default time to wait in ms before a test fails.
    defaultTimeoutInterval: 10000
  }
};
