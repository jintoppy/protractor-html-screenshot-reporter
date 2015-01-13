# HTML Reporter with Screenshots for Protractor

This is built on top of Screenshot Reporter for Protractor https://github.com/swissmanu/protractor-screenshot-reporter


## Usage
The `protractor-html-screenshot-reporter` module is available via npm:

```bash
$ npm install protractor-html-screenshot-reporter --save-dev
```

In your Protractor configuration file, register `protractor-html-screenshot-reporter` in Jasmine:

```javascript
var HtmlReporter = require('protractor-html-screenshot-reporter');

exports.config = {
   // your config here ...

   onPrepare: function() {
      // Add a screenshot reporter and store screenshots to `/tmp/screnshots`:
      jasmine.getEnv().addReporter(new HtmlReporter({
         baseDirectory: '/tmp/screenshots'
      }));
   }
}
```

## Configuration
### Base Directory (mandatory)
You have to pass a directory path as parameter when creating a new instance of
the screenshot reporter:

```javascript
var reporter = new HtmlReporter({
   baseDirectory: '/tmp/screenshots'
});
```

If the given directory does not exists, it is created automatically as soon as a screenshot needs to be stored.

### Path Builder (optional)
The function passed as second argument to the constructor is used to build up paths for screenshot files:

```javascript
var path = require('path');

new HtmlReporter({
   baseDirectory: '/tmp/screenshots'
   , pathBuilder: function pathBuilder(spec, descriptions, results, capabilities) {
      // Return '<browser>/<specname>' as path for screenshots:
      // Example: 'firefox/list-should work'.
      return path.join(capabilities.caps_.browser, descriptions.join('-'));
   }
});
```
If you omit the path builder, a [GUID](http://de.wikipedia.org/wiki/Globally_Unique_Identifier) is used by default instead.


### Meta Data Builder (optional)
You can modify the contents of the JSON meta data file by passing a function `metaDataBuilder` function as third constructor parameter:

```javascript
new HtmlReporter({
   baseDirectory: '/tmp/screenshots'
   , metaDataBuilder: function metaDataBuilder(spec, descriptions, results, capabilities) {
      // Return the description of the spec and if it has passed or not:
      return {
         description: descriptions.join(' ')
         , passed: results.passed()
      };
   }
});
```

If you omit the meta data builder, the default implementation is used


### Report for skipped test cases (optional)
You can define if you want report from skipped test cases using the `takeScreenShotsForSkippedSpecs` option:

```javascript
new HtmlReporter({
   baseDirectory: '/tmp/screenshots'
   , takeScreenShotsForSkippedSpecs: true
});
```
Default is `false`.

### Screenshots only for failed test cases (optional)
 Also you can define if you want capture screenshots only from failed test cases using the `takeScreenShotsOnlyForFailedSpecs:` option:
 
 ```javascript
 new HtmlReporter({
    baseDirectory: '/tmp/screenshots'
    , takeScreenShotsOnlyForFailedSpecs: true
 });
 ```
 If you set the value to `true`, the reporter for the passed test will still be generated, but, there will be no screenshot.
 
 Default is `false`.


### Add title for the html report (optional)
 Also you can define a document title for the html report generated using the `docTitle:` option:
 
 ```javascript
 new HtmlReporter({
    baseDirectory: '/tmp/screenshots'
    , docTitle: 'my reporter'
 });
 ```

Default is `Generated test report`.

### Change html report file name (optional)
 Also you can change document name for the html report generated using the `docName:` option:
 
 ```javascript
 new HtmlReporter({
    baseDirectory: '/tmp/screenshots'
    , docName: 'index.html'
 });
 ```
Default is `report.html`.

### Option to override CSS file used in reporter (optional)
 You can change stylesheet used for the html report generated using the `cssOverrideFile:` option:
 
 ```javascript
 new HtmlReporter({
    baseDirectory: '/tmp/screenshots'
    , cssOverrideFile: 'css/style.css'
 });
 ```

### Preserve base directory (optional)
 You can preserve the base directory using `preserveDirectory:` option:
 
 ```javascript
 new HtmlReporter({
    baseDirectory: '/tmp/screenshots'
    , preserveDirectory: true
 });
 ```
Default is `false`.

## HTML Reporter

On running the task via grunt, screenshot reporter will be generating json and png files for each test.

Now, you will also get a summary report, Stack trace information also. 

With this postprocessing, you will get a json which has all the metadata, and also an html page showing the results. 


![test report in html](https://raw.githubusercontent.com/jintoppy/protractor-html-screenshot-reporter/master/testreporter.png "test report")

Please see the examples folder for a sample usage. 

For running the sample, do the following commands in the examples folder

```bash

$ npm install
$ grunt install
$ grunt test:e2e
```

After the test run, you can see that, a screenshots folder will be created with all the reports generated. 


## License
Copyright (c) 2014 Jinto Jose <jintoppy@gmail.com>
Copyright (c) 2014 Manuel Alabor <manuel@alabor.me>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
