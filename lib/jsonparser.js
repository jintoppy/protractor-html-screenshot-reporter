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
  var styleTag = "<!--style></style-->";
  if(reporterOptions.cssOverrideFile){
    styleTag = '';
  }
  return styleTag;
}

phssr.makeHTMLPage = function(tableHtml, reporterOptions){
  var styleTag = phssr.makeHardCodedStyleTag(reporterOptions);
  var scrpTag = phssr.makeScriptTag();
  var staticHTMLContentprefix =
    '<!doctype html> \n' +
    '<html> \n' +
      '<head> \n' +
        '<meta="Content-Security-Policy" content="default-src \'none\'; script-src \'self\'; connect-src \'self\'; img-src \'self\'; style-src \'self\';" /> \n'
        '<meta charset="utf-8"> \n' +
      '</head>' +
      '<body>';
  //Add title if it was in config setup
  if (typeof (reporterOptions.docTitle) !== 'undefined' && _.isString(reporterOptions.docTitle) ){
    staticHTMLContentprefix += '<title>' + reporterOptions.docTitle + '</title> \n';
  } else {
    staticHTMLContentprefix += '<title></title> \n';
  }
  var staticHTMLContentpostfix =
    '</body> \n' +
  '</html> \n';
  var htmlComplete = result + staticHTMLContentprefix + tableHtml + staticHTMLContentpostfix;
  return htmlComplete;
}

var
  passCount = 0,
  failCount = 0,
  loopCount = 0;
function generateHTML(data){
    data.passed? passCount++ : failCount++;
    var color = data.passed? 'green': 'red';
    var str =
      '<table style="clear: both; width: 100%;"> \n' +
        '<tr> \n' +
          '<td style="width: 25%; overflow: hidden; text-align: center; color: '+ color + '">' + data.desc + '</td> \n' +
          '<td style="width: 20%; overflow: hidden; text-align: center; color: '+ color + '"><strong>' + data.passed + '</strong></td> \n' +
          '<td style="width: 15%; overflow: hidden;">' + data.browser.name + ' : ' + data.browser.version + '</td> \n' +
          '<td style="width: 10%; overflow: hidden;">' + data.sessionId + '</td> \n' +
          '<td style="width: 10%; overflow: hidden;">' + data.os + '</td> \n';
    if(!(reporterOptions.takeScreenShotsOnlyForFailedSpecs && data.passed)) {
      str +=  '<td style="width: 10%; overflow: hidden; text-align: center;">' +
        '<a target="_blank" href="' + path.basename(data.screenShotFile) + '">screenshot</a>' +
      '</td> \n';
    }
    else {
      str +=  '<td style="width: 10%; overflow: hidden;">&nbsp;</td> \n';
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
  passCount=0;
  failCount = 0;
  reporterOptions = options;
  var jsonStr = '<ul style="clear: both; width: 100%; padding: 0px; margin: 0px;">';
  formattedJson = [];
  currentFormattedDataIndex = 0;

  _.each(jsonData, function (value) {
    var descArr = value.description.split('|').reverse();
    if (descArr.length > 0) {
      formatData(value, descArr);
    }
  });

  function parseJSON(element) {
    if(element.children){
      jsonStr +=
        '<li style="padding: 15px 0 0 0; margin: 0; width: 100%;">' +
          element.desc +
          '<ul style="clear: both; width: 100%; padding: 0px; margin: 0px;">';
      element.children.forEach(function (child, index, childArr) {
        if (child.children) {
          parseJSON(child);
        } else {
          var ss = generateHTML(child);
          jsonStr += '<li style="padding: 0px; margin: 0; list-style-type: none;">' + ss + '</li>';
          if(index === childArr.length-1){
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
    tableHtml += parseJSON(element);
    tableHtml += new Array(element.depth-1).join('</ul></li>');
  });
  tableHtml =
    '<ul> \n' +
      tableHtml +
    '</ul> \n' +
    '<h2>Results summary</h2> \n' +
    'Total tests passed: <span style="color: red;">' + passCount + ' </span> \n' +
    '<br /> \n' +
    'Total tests failed: <span style="color: green;">' + failCount + ' </span> \n' +
    '<br /> \n' +
    'This report generated on' + new Date() + ' \n';

  var finalHtml = phssr.makeHTMLPage(tableHtml, reporterOptions);
  return finalHtml;
}

module.exports = {
  processJson: processJson
};
