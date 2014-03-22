var _ = require('underscore'),
    path = require('path');

var scriptToAddInHtml = "<script type='text/javascript'>";
scriptToAddInHtml +="function openModal(imageSource){";
scriptToAddInHtml +="var myWindow = window.open('','screenshotWindow');";
scriptToAddInHtml +="myWindow.document.write('<img src=\"' +imageSource + '\" alt=\"screenshot\" />');}";
scriptToAddInHtml += "</script>";

var stylesToAddInHtml = "<style>";
stylesToAddInHtml+= "ul,li{margin-left:0;padding-left:0;width:100%;font-weight:bold;}";
stylesToAddInHtml+= "table{width:95%;text-align:left;border-spacing:0;border-collapse: separate;margin-bottom:5px;}";
stylesToAddInHtml+= "li{font-weight:bold;padding-left:5px;list-style:none;}";
stylesToAddInHtml+= "ul table li{font-weight: normal}";
stylesToAddInHtml+= "th,td{padding: 10px;border: 1px solid #000;}";
stylesToAddInHtml+= "td.desc-col{width:400px;}th.desc-col{width: 390px;}";
stylesToAddInHtml+= "td.status-col{width:75px;}th.status-col{width: 75px;}";
stylesToAddInHtml+= "td.browser-col{width:345px;}th.browser-col{width: 345px;}";
stylesToAddInHtml+= "td.os-col{width:100px;}th.os-col{width: 100px;}";
stylesToAddInHtml+= "td.msg-col{width:135px;}th.msg-col{width: 135px;}";
stylesToAddInHtml+= "table.header{background-color: gray; color: #fff;margin-left:20px;}";
stylesToAddInHtml+= "</style>";

var staticHTMLContentprefix = "<html><head><title>Test file reporter generated</title>"+stylesToAddInHtml+scriptToAddInHtml+" </head><body style='font-family:Arial;'>";

staticHTMLContentprefix +=  "<h1>Test Results</h1><table class='header'>";
staticHTMLContentprefix +=  "<tr><th class='desc-col'>Description</th><th class='status-col'>Passed</th>";
staticHTMLContentprefix +=  "<th class='browser-col'>Browser</th>";
staticHTMLContentprefix +=  "<th class='os-col'>OS</th><th class='msg-col'>Message</th>";
staticHTMLContentprefix +=  "<th class='img-col'>Screenshot</th></tr></table>";

var staticHTMLContentpostfix = "</body></html>";

function generateHTML(data){
    var str = '<table><tr>';
    str +=  '<td class="desc-col">' + data.desc + '</td>';
    var bgColor = data.passed? 'green': 'red';
    str +=  '<td class="status-col" style="color:#fff;background-color: '+ bgColor+'">' + data.passed + '</td>';
    str +=  '<td class="browser-col">' + data.browser.name+ ':' +data.browser.version + '</td>';
    str +=  '<td class="os-col">' + data.os + '</td>';
    str +=  '<td class="msg-col">' + data.message+ '</td>';

    str +=  '<td class="img-col"><a href="#" onclick="openModal(\'' + path.basename(data.screenShotFile)+ '\')">View </a></td>';
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
            description: element.description,
            passed: element.passed,
            os: element.os,
            browser: element.browser,
            message: element.message,
            screenShotFile: element.screenShotFile
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
    var jsonStr = "<ul>";
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

            jsonStr += '<li>'+element.desc+ '<ul>';
            element.children.forEach(function (child, index, childArr) {
                if (child.children) {
                    parseJSON(child);
                }else{
                    var ss = generateHTML(child);
                    jsonStr += '<li>' + ss +'</li>';
                    if(index === childArr.length-1){
                        jsonStr += '</ul></li>';
                    }
                }
            });
            return jsonStr;
        }
        
    }

    var str = "";
    formattedJson.forEach(function (element) {
        jsonStr = "";
        str += parseJSON(element);
        str += new Array(element.depth-1).join('</ul></li>');

    });
    str = '<ul>' + str + '</ul>';
    return staticHTMLContentprefix + str + staticHTMLContentpostfix;

}

module.exports = {
    processJson: processJson
};