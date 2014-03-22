var _ = require('underscore');

var scriptToAddInHtml = "<script type='text/javascript'>";
scriptToAddInHtml +="function openModal(imageSource){";
scriptToAddInHtml +="var myWindow = window.open('','screenshotWindow');";
scriptToAddInHtml +="myWindow.document.write('<img src=\"' +imageSource + '\" alt=\"screenshot\" />');}";
scriptToAddInHtml += "</script>";

var staticHTMLContentprefix = "<html><head><title>Test file reporter generated</title>"+scriptToAddInHtml+" </head><body style='font-family:Arial;'>";

staticHTMLContentprefix +=  "<h1>Test Results</h1><table cellpadding='10' cellspacing='0' border='1' style='text-align:left'>";
staticHTMLContentprefix +=  "<tr><th>Description</th><th>Passed</th><th>Browser</th><th>OS</th><th>Message</th><th>Screenshot</th></tr></table>";

var staticHTMLContentpostfix = "</body></html>";

function generateHTML(data){
    var str = '<table><tr>';
    str +=  '<td>' + data.description + '</td>';
    var bgColor = data.passed? 'green': 'red';
    str +=  '<td style="color:#fff;background-color: '+ bgColor+'">' + data.passed + '</td>';
    str +=  '<td>' + data.browser.name+ ':' +data.browser.version + '</td>';
    str +=  '<td>' + data.os + '</td>';
    str +=  '<td>' + data.message+ '</td>';

    str +=  '<td><a href="#" onclick="openModal(\'' + path.basename(data.screenShotFile)+ '\')">View </a></td>';
    str += '</tr></table>';

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
            if (match(val)) {
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
        var lastValueWithContent = {
            desc: descArr[currentFormattedDataIndex],
            level: currentFormattedDataIndex,
            value: element.name
        };
        var parentDataForFinalValue = findDeep(formattedJson, {
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
                var parentData = findDeep(formattedJson, {
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

function processJson(jsonData){
    _.each(data, function (value, key) {
        var descArr = value.description.split('|').reverse();
        if (descArr.length > 0) {
            formatData(value, descArr);
        }
    });

    var jsonStr = "<ul>";
    var totalCounter=0;

    function parseJSON(element) {
        if(element.children){
            jsonStr += '<li>'+element.desc+ '<ul>';
            element.children.forEach(function (child, index, childArr) {
                if (child.children) {
                    totalCounter++;
                    parseJSON(child);
                }else{
                    jsonStr +=  generateHTML(child);
                    if(index == childArr.length-1){
                        jsonStr += '</ul></li>';
                    }
                }
            });
            return jsonStr;
        }
        
    };

    var str = "";
    var recurringEndStr = "";
    formattedJson.forEach(function (element, index, currentJsonArr) {
        jsonStr = "";
        str += parseJSON(element);
        str += new Array(element.depth-1).join('</ul></li>');
        totalCounter = 0;

    });
    str = '<ul>' + str + '</ul>';
    return staticHTMLContentprefix + str + staticHTMLContentpostfix;

}

module.exports = {
    processJson: processJson    
};

