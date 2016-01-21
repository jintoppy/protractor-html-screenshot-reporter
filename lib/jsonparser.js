var
  _ = require('underscore'),
  path = require('path'),
  reporterOptions,
  result = '';

var phssr = phssr ? phssr : {};

phssr.makeScriptTag = function(){
  var scrpTag = "";
  return scrpTag;
};

phssr.makeHardCodedStyleTag = function(reporterOptions){
  var styleTag = styleTag = '<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet" type="text/css"/> \n';
  if(reporterOptions.cssOverrideFile){
    styleTag = '<link href="' + reporterOptions.cssOverrideFile + '" rel="stylesheet" type="text/css"/> \n';
  }
  return styleTag;
}

phssr.makeHTMLPage = function(tableHtml, reporterOptions){
  var styleTag = phssr.makeHardCodedStyleTag(reporterOptions);
  var scrpTag = phssr.makeScriptTag();
  var staticHTMLContentprefix =
    '<!doctype html> \n' +
    '<html> \n' +
      '<head> \n';
  if (typeof (reporterOptions.docTitle) !== 'undefined' && _.isString(reporterOptions.docTitle) ){
    staticHTMLContentprefix += '<title>' + reporterOptions.docTitle + '</title> \n';
  } else {
    staticHTMLContentprefix += '<title></title> \n';
  }
  staticHTMLContentprefix +=  styleTag + scrpTag +
  //'<meta="Content-Security-Policy" content="default-src \'none\'; script-src \'self\'; connect-src \'self\'; img-src \'self\'; style-src \'self\';"> \n'
  '<meta charset="utf-8"> \n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1"> \n' +
  '</head> \n <body> \n <div class="container-fluid">\n <div class="row"> \n';
  var staticHTMLContentpostfix =
    '</div> \n </div> \n </body> \n' +
    '</html> \n';
  var htmlComplete = staticHTMLContentprefix + result + tableHtml + staticHTMLContentpostfix;
  return htmlComplete;
}

var
  passCount = 0,
  failCount = 0,
  loopCount = 0,
  clazz = '';
function generateHTML(data){
    if(data.passed) {
      passCount++
      clazz = 'success';
    } else {
      failCount++;
      clazz = 'danger';
    }
    var str =
      '<table class="table table-bordered table-hover"> \n' +
        '<tr class="' + clazz + '"> \n' +
          '<td style="width: 25%;"><span>' + data.desc + '</span></td> \n' +
          '<td style="width: 20%;"><span>' + data.passed + '</span></td> \n' +
          '<td style="width: 15%;"><span>' + data.browser.name + ' : ' + data.browser.version + '</span></td> \n' +
          '<td style="width: 10%;"><span>' + data.sessionId + '</span></td> \n' +
          '<td style="width: 10%;"><span>' + data.os + '</span></td> \n';
    if(!(reporterOptions.takeScreenShotsOnlyForFailedSpecs && data.passed)) {
      str +=
        '<td style="width: 10%; overflow: hidden; text-align: center;">' +
          '<a target="_blank" href="' + path.basename(data.screenShotFile) + '">screenshot</a>' +
        '</td> \n';
    }
    else {
      str +=  '<td style="width: 10%;">&nbsp;</td> \n';
    }
    str += '</tr> \n' +
    '</table> \n';
    loopCount++;
    return str;
}

function findDeep(items, attrs) {

    function match(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) {
          return false;
        }
      }
      return true;
    }

    function traverse(value) {
      var result;
      _.forEach(value, function (val) {
        if (val && match(val)) {
          result = val;
          return false;
        }
        if (_.isObject(val) || _.isArray(val)) {
          result = traverse(val);
        }
        if (result) {
            return false;
        }
      });
      return result;
    }
    return traverse(items);
}

var formattedJson = [];
var currentFormattedDataIndex = 0;

function formatData(element, descArr) {
    if (currentFormattedDataIndex === descArr.length - 1) {
      var
        lastValueWithContent = {
        desc: descArr[currentFormattedDataIndex],
        level: currentFormattedDataIndex,
        description: element.description,
        passed: element.passed,
        sessionId: element.sessionId,
        os: element.os,
        browser: element.browser,
        message: element.message,
        trace: element.trace,
        screenShotFile: element.screenShotFile
      };
      var
        parentDataForFinalValue = findDeep(formattedJson, {
        desc: descArr[currentFormattedDataIndex - 1],
        level: currentFormattedDataIndex - 1
      });
      if (parentDataForFinalValue) {
        parentDataForFinalValue.children = parentDataForFinalValue.children || [];
        parentDataForFinalValue.children.push(lastValueWithContent);
      }
      currentFormattedDataIndex = 0;
    } else {
      var currentdata = {
          desc: descArr[currentFormattedDataIndex],
          level: currentFormattedDataIndex
      };
      var existingDataWithSameConf = findDeep(formattedJson, currentdata);
      if (!existingDataWithSameConf) {
        if (currentFormattedDataIndex === 0) {
          currentdata.depth = descArr.length;
          formattedJson.push(currentdata);
        } else {
          var
            parentData = findDeep(formattedJson, {
              desc: descArr[currentFormattedDataIndex - 1],
              level: currentFormattedDataIndex - 1
            });
          if (parentData) {
            parentData.children = parentData.children || [];
            parentData.children.push(currentdata);
          }
        }
      }
      currentFormattedDataIndex++;
      formatData(element, descArr);
    }
}

function processJson(jsonData, options){
  passCount = 0;
  failCount = 0;
  reporterOptions = options;
  var jsonStr = '<ul>';
  formattedJson = [];
  currentFormattedDataIndex = 0;

  _.each(jsonData, function (value) {
    var descArr = value.description.split('|').reverse();
    if (descArr.length > 0) {
      formatData(value, descArr);
    }
  });

  function parseJSON(element, isChild) {
    if(element.children){
      if(isChild) {
        jsonStr +=
          '<li class="list-group-item"> \n' +
          '<h3>' + element.desc +'</h3> \n';
      } else {
        jsonStr +=
          '<li> \n' +
          '<h2>' + element.desc +'</h2> \n';
      }
      jsonStr +=
        '<ul class="list-group"> \n';
      element.children.forEach(function (child, index, childArr) {
        if (child.children) {
          parseJSON(child, true);
        } else {
          jsonStr += '<li class="list-group-item">' + generateHTML(child) + '</li> \n';
          if(index === childArr.length-1) {
            jsonStr += '</ul></li>';
          }
        }
      });
      return jsonStr;
    }
  }

  var tableHtml = '';
  formattedJson.forEach(function (element) {
    jsonStr = '';
    tableHtml += parseJSON(element, false);
    tableHtml += new Array(element.depth-1).join('</ul></li>');
  });
  tableHtml = '<ul>' + tableHtml + '</ul>';
  result =
    '<div class="jumbotron"> \n' +
      '<h1>Protractor report</h1> \n' +
      '<p><span class="label label-success">' + passCount + ' tests passed</span></p> \n' +
      '<p><span class="label label-danger">' + failCount + ' tests failed</span></p>\n' +
      '<p>This report generated on' + new Date() + '</p> \n' +
    '</div>';
  var finalHtml = phssr.makeHTMLPage(tableHtml, reporterOptions);
  return finalHtml;
}

module.exports = {
  processJson: processJson
};
