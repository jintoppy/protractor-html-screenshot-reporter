var _ = require('underscore'),
    path = require('path'), 
    reporterOptions;

var scriptToAddInHtml = "<script type='text/javascript'>";
scriptToAddInHtml +="function showTrace(e){";
scriptToAddInHtml +="window.event.srcElement.parentElement.getElementsByClassName('traceinfo')[0].className = 'traceinfo visible';}";
scriptToAddInHtml +="function closeTraceModal(e){";
scriptToAddInHtml +="window.event.srcElement.parentElement.parentElement.className = 'traceinfo';}";
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
stylesToAddInHtml+= ".traceinfo{position: fixed;top: 0; bottom: 0;left: 0;right:0;background: rgba(0,0,0,0.8);z-index: 99999;opacity:0;-webkit-transition: opacity 400ms ease-in;transition: opacity 400ms ease-in;pointer-events: none;}";
stylesToAddInHtml+= ".traceinfo.visible{opacity:1;pointer-events: auto;}";
stylesToAddInHtml+= ".traceinfo > div{width: 400px;position: relative;margin: 10% auto;padding: 5px 20px 13px 20px;background: #fff;}";
stylesToAddInHtml+= ".traceinfo .close{background: #606061;color: #FFFFFF;line-height: 25px;position: absolute;right: -12px;text-align: center;top: -10px;width: 24px;text-decoration: none;font-weight: bold;}";
stylesToAddInHtml+= ".traceinfo .close:hover{background: #00d9ff;}";
stylesToAddInHtml+= "</style>";

var staticHTMLContentprefix = "<html><head><meta charset='utf-8'/><title>{{reportTitle}}</title>"+stylesToAddInHtml+scriptToAddInHtml+" </head><body style='font-family:Arial;'>";

staticHTMLContentprefix +=  "<h1>Test Results</h1><table class='header'>";
staticHTMLContentprefix +=  "<tr><th class='desc-col'>Description</th><th class='status-col'>Passed</th>";
staticHTMLContentprefix +=  "<th class='browser-col'>Browser</th>";
staticHTMLContentprefix +=  "<th class='os-col'>OS</th><th class='msg-col'>Message</th>";
staticHTMLContentprefix +=  "<th class='img-col'>Screenshot</th></tr></table>";

var staticHTMLContentpostfix = "</body></html>";

var passCount=0, failCount=0, loopCount=0;
function generateHTML(data){
    data.passed? passCount++: failCount++;
    var str = '<table><tr>';
    str +=  '<td class="desc-col">' + data.desc + '</td>';
    var bgColor = data.passed? 'green': 'red';
    str +=  '<td class="status-col" style="color:#fff;background-color: '+ bgColor+'">' + data.passed + '</td>';
    str +=  '<td class="browser-col">' + data.browser.name+ ':' +data.browser.version + '</td>';
    str +=  '<td class="os-col">' + data.os + '</td>';
    var stackTraceInfo = data.passed? '': '<br/><a onclick="showTrace()" href="#trace-modal'+loopCount+'">View Stack Trace Info</a><br/> <div id="#trace-modal'+loopCount+'" class="traceinfo"><div><a href="#close" onclick="closeTraceModal()" title="Close" class="close">X</a>' + data.trace + '</div></div>';

    str +=  '<td class="msg-col">' + data.message+ stackTraceInfo+ '</td>';

    if(!(reporterOptions.takeScreenShotsOnlyForFailedSpecs && data.passed)) {
        str +=  '<td class="img-col"><a href="#" onclick="openModal(\'' + path.basename(data.screenShotFile)+ '\')">View </a></td>';    
    }
    else{
        str +=  '<td class="img-col"></td>';   
    }
    
    str += '</tr></table>';
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
        var lastValueWithContent = {
            desc: descArr[currentFormattedDataIndex],
            level: currentFormattedDataIndex,
            description: element.description,
            passed: element.passed,
            os: element.os,
            browser: element.browser,
            message: element.message,
            trace: element.trace,
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

function processJson(jsonData, options){
    passCount=0;
    failCount = 0;
    reporterOptions = options;
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
    str += "<div><h2><u>Results summary</u></h2>";
    str += "<b>Total tests passed</b>: "+ passCount +" <br/> <b>Total tests failed</b>: "+ failCount +" <br/> This report generated on "+new Date()+" </div>";

    //updating the document title
    var docTitleRegex = new RegExp('{{reportTitle}}');
    staticHTMLContentprefix =  staticHTMLContentprefix.replace(docTitleRegex, reporterOptions.docTitle);
    return staticHTMLContentprefix + str + staticHTMLContentpostfix;

}

module.exports = {
    processJson: processJson
};
