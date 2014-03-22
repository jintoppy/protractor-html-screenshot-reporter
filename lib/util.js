var fs = require('fs')
	, path = require('path')
	, mkdirp = require('mkdirp')
	, crypto = require('crypto');


var scriptToAddInHtml = "<script type='text/javascript'>";
scriptToAddInHtml +="function openModal(imageSource){";
scriptToAddInHtml +="var myWindow = window.open('','screenshotWindow');";
scriptToAddInHtml +="myWindow.document.write('<img src=\"' +imageSource + '\" alt=\"screenshot\" />');}";
scriptToAddInHtml += "</script>";

var staticHTMLContentprefix = "<html><head><title>Test file reporter generated</title>"+scriptToAddInHtml+" </head><body style='font-family:Arial;'>";

staticHTMLContentprefix +=  "<table cellpadding='10' cellspacing='0' border='1' style='text-align:left'>"
staticHTMLContentprefix +=  "<tr><th>Description</th><th>Passed</th><th>Browser</th><th>OS</th><th>Message</th><th>Screenshot</th></tr>";




var	staticHTMLContentpostfix = "</table></body></html>";


/** Function: storeScreenShot
 * Stores base64 encoded PNG data to the file at the given path.
 *
 * Parameters:
 *     (String) data - PNG data, encoded in base64
 *     (String) file - Target file path
 */
function storeScreenShot(data, file) {
	var stream = fs.createWriteStream(file);

	stream.write(new Buffer(data, 'base64'));
	stream.end();
}




function generateHTML(data){
	var str = '<tr>';
	str += 	'<td>' + data.description + '</td>';
	var bgColor = data.passed? 'green': 'red';
	str += 	'<td style="color:#fff;background-color: '+ bgColor+'">' + data.passed + '</td>';
	str += 	'<td>' + data.browser.name+ ':' +data.browser.version + '</td>';
	str += 	'<td>' + data.os + '</td>';
	str += 	'<td>' + data.message+ '</td>';

	str += 	'<td><a href="#" onclick="openModal(\'' + path.basename(data.screenShotFile)+ '\')">View </a></td>';
	str += '</tr>';

	return str;

}


function addHTMLReport(jsonData, baseName){
	var basePath = path.dirname(baseName),
		htmlFile = path.join(basePath, 'reporter.html'),
		stream;
	var totalCount = jsonData.length, i = totalCount, dynamicData = '<h1>Test Results</h1>';

	while(--i >= 0){
		dynamicData += generateHTML(jsonData[i]);
	}


	
	stream = fs.createWriteStream(htmlFile);
	stream.write(staticHTMLContentprefix + dynamicData + staticHTMLContentpostfix);
	stream.end();
	
}

function addMetaData(metaData, baseName){
	var json,
		stream,
		basePath = path.dirname(baseName),
		file = path.join(basePath,'combined.json');
	try {
		json = metaData;
		var currentData;
		try{
			currentData = JSON.parse(fs.readFileSync(file, {
				encoding: 'utf8'
			}));
			if(currentData.length && currentData.length>0){
				currentData.push(json);
			}
			json = currentData;
		}catch(e){
			json = [json];
		}

		stream = fs.createWriteStream(file);
		stream.write(JSON.stringify(json));
		stream.end();
		addHTMLReport(json, baseName);
	} catch(e) {
		console.error('Could not save meta data');
	}

}

/** Function: storeMetaData
 * Converts the metaData object to a JSON string and stores it to the file at
 * the given path.
 *
 * Parameters:
 *     (Object) metaData - Object to save as JSON
 *     (String) file - Target file path
 */
function storeMetaData(metaData, file) {
	var json
		, stream;

	try {
		json = JSON.stringify(metaData);
		stream = fs.createWriteStream(file);

		stream.write(json);
		stream.end();
	} catch(e) {
		console.error('Could not save meta data for ' + screenShotFile);
	}
}

/** Function: gatherDescriptions
 * Traverses the parent suites of a test spec recursivly and gathers all
 * descriptions. Finally returns them as an array.
 *
 * Example:
 * If your test file has the following structure, this function returns an
 * array like ['My Tests', 'Module 1', 'Case A'] when executed for `Case A`:
 *
 *     describe('My Tests', function() {
 *         describe('Module 1', function() {
 *             it('Case A', function() { /* ... * / });
 *         });
 *     });
 *
 * Parameters:
 *     (Object) suite - Test suite
 *     (Array) soFar - Already gathered descriptions. On first call, pass an
 *                     array containing the specs description itself.
 *
 * Returns:
 *     (Array) containing the descriptions of all parental suites and the suite
 *             itself.
 */
function gatherDescriptions(suite, soFar) {
	soFar.push(suite.description);

	if(suite.parentSuite) {
		return gatherDescriptions(suite.parentSuite, soFar);
	} else {
		return soFar;
	}
}

/** Function: generateGuid
 * Generates a GUID using node.js' crypto module.
 *
 * Returns:
 *     (String) containing a guid
 */
function generateGuid() {
    var buf = new Uint16Array(8);
    buf = crypto.randomBytes(8);
    var S4 = function(num) {
            var ret = num.toString(16);
            while(ret.length < 4){
                    ret = "0"+ret;
            }
            return ret;
    };

    return (
            S4(buf[0])+S4(buf[1])+"-"+S4(buf[2])+"-"+S4(buf[3])+"-"+
            S4(buf[4])+"-"+S4(buf[5])+S4(buf[6])+S4(buf[7])
    );
}

module.exports = {
	storeScreenShot: storeScreenShot
	, storeMetaData: storeMetaData
	, gatherDescriptions: gatherDescriptions
	, generateGuid: generateGuid
	, addMetaData: addMetaData
	, addHTMLReport: addHTMLReport
};