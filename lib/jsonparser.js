var _ = require('underscore'),
    path = require('path'),
    reporterOptions;

//create a namespace for these functions, so they do not conflict with other scripts
var phssr = phssr ? phssr : {};

phssr.makeScriptTag = function(){
    var scrpTag = "<script type='text/javascript'>";
    scrpTag +="function showTrace(event){";
    scrpTag +="event.target.parentElement.getElementsByClassName('traceinfo')[0].className = 'traceinfo visible';}";
    scrpTag +="function closeTraceModal(event){";
    scrpTag +="event.target.parentElement.parentElement.className = 'traceinfo';}";
    scrpTag +="function openModal(imageSource){";
    scrpTag +="var myWindow = window.open('','screenshotWindow');";
    scrpTag +="myWindow.document.write('<img src=\"' +imageSource + '\" alt=\"screenshot\" />');}";
    scrpTag += "</script>";
    return scrpTag;
};

phssr.makeHardCodedStyleTag = function(reporterOptions){
    var styleTag = "<style>";
    styleTag+= "body{font-family:Arial};";
    styleTag+= "ul,li{margin-left:0;padding-left:0;width:100%;font-weight:bold;}";
    styleTag+= "table{width:95%;text-align:left;border-spacing:0;border-collapse: separate;margin-bottom:5px;}";
    styleTag+= "li{font-weight:bold;padding-left:5px;list-style:none;}";
    styleTag+= "ul table li{font-weight: normal}";
    styleTag+= "th,td{padding: 10px;border: 1px solid #000;}";
    styleTag+= "td.desc-col{width:400px;}th.desc-col{width: 390px;}";
    styleTag+= "td.status-col{width:75px;}th.status-col{width: 75px;}";
    styleTag+= "td.browser-col{width:345px;}th.browser-col{width: 345px;}";
    styleTag+= "td.os-col{width:100px;}th.os-col{width: 100px;}";
    styleTag+= "td.msg-col{width:135px;}th.msg-col{width: 135px;}";
    styleTag+= "table.header{background-color: gray; color: #fff;margin-left:20px;}";
    styleTag+= ".traceinfo{position: fixed;top: 0; bottom: 0;left: 0;right:0;background: rgba(0,0,0,0.8);z-index: 99999;opacity:0;-webkit-transition: opacity 400ms ease-in;transition: opacity 400ms ease-in;pointer-events: none;}";
    styleTag+= ".traceinfo.visible{opacity:1;pointer-events: auto;}";
    styleTag+= ".traceinfo > div{width: 400px;position: relative;margin: 10% auto;padding: 5px 20px 13px 20px;background: #fff;}";
    styleTag+= ".traceinfo .close{background: #606061;color: #FFFFFF;line-height: 25px;position: absolute;right: -12px;text-align: center;top: -10px;width: 24px;text-decoration: none;font-weight: bold;}";
    styleTag+= ".traceinfo .close:hover{background: #00d9ff;}";
    styleTag+= "</style>";

    //Can override all styles with a CSS file
    if(reporterOptions.cssOverrideFile){
         styleTag = '<link href="' + reporterOptions.cssOverrideFile + '" rel="stylesheet" type="text/css"/>';
    }

    return styleTag;
}

phssr.makeHTMLPage = function(tableHtml, reporterOptions){
    var styleTag = phssr.makeHardCodedStyleTag(reporterOptions);
    var scrpTag = phssr.makeScriptTag();

    var staticHTMLContentprefix = "<html><head><meta charset='utf-8'/>";

    //Add title if it was in config setup
    if (typeof (reporterOptions.docTitle) !== 'undefined' && _.isString(reporterOptions.docTitle) ){
        staticHTMLContentprefix += "<title>" + reporterOptions.docTitle + "</title>";
    } else {
        staticHTMLContentprefix += "<title></title>";
    }

    staticHTMLContentprefix +=  styleTag + scrpTag + " </head><body>";
    staticHTMLContentprefix +=  "<h1>" + reporterOptions.docHeader + "</h1><table class='header'>";
    staticHTMLContentprefix +=  "<tr><th class='desc-col'>Description</th><th class='status-col'>Passed</th>";
    staticHTMLContentprefix +=  "<th class='browser-col'>Browser</th>";
    staticHTMLContentprefix +=  "<th class='os-col'>OS</th><th class='msg-col'>Message</th>";
    staticHTMLContentprefix +=  "<th class='img-col'>Screenshot</th></tr></table>";

    var staticHTMLContentpostfix = "</body></html>";
    var htmlComplete = staticHTMLContentprefix + tableHtml + staticHTMLContentpostfix;

    return htmlComplete;
}


var passCount=0, failCount=0, loopCount=0;
function generateHTML(data){
    data.passed? passCount++: failCount++;
    var str = '<table><tr>';
    str +=  '<td class="desc-col">' + data.desc + '</td>';
    var bgColor = data.passed? 'green': 'red';
    str +=  '<td class="status-col" style="color:#fff;background-color: '+ bgColor+'">' + data.passed + '</td>';
    str +=  '<td class="browser-col">' + data.browser.name+ ':' +data.browser.version + '</td>';
    str +=  '<td class="os-col">' + data.os + '</td>';
    var stackTraceInfo = data.passed? '': '<br/><a onclick="showTrace(event)" href="#trace-modal'+loopCount+'">View Stack Trace Info</a><br/> <div id="#trace-modal'+loopCount+'" class="traceinfo"><div><a href="#close" onclick="closeTraceModal(event)" title="Close" class="close">X</a>' + data.trace + '</div></div>';

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

    var tableHtml = "";
    formattedJson.forEach(function (element) {
        jsonStr = "";
        tableHtml += parseJSON(element);
        tableHtml += new Array(element.depth-1).join('</ul></li>');

    });
    tableHtml = '<ul>' + tableHtml + '</ul>';
    tableHtml += "<div><h2><u>Results summary</u></h2>";
    tableHtml += "<b>Total tests passed</b>: "+ passCount +" <br/> <b>Total tests failed</b>: "+ failCount +" <br/> This report generated on "+new Date()+" </div>";

    // //updating the document title
    // var docTitleRegex = new RegExp('{{reportTitle}}');
    // staticHTMLContentprefix =  staticHTMLContentprefix.replace(docTitleRegex, reporterOptions.docTitle);
    // return staticHTMLContentprefix + tableHtml + staticHTMLContentpostfix;
    var finalHtml = phssr.makeHTMLPage(tableHtml, reporterOptions);
    return finalHtml;
}

module.exports = {
    processJson: processJson
};
