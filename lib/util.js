var fs = require('fs')
	, path = require('path')
	, crypto = require('crypto');



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

/**
 * Writes a new _report.html file from the jsonData.
 * @param jsonData combined.json
 * @param baseName
 * @param options
 */
function addHTMLReport(jsonData, baseName, options){
	var basePath = path.dirname(baseName),
		// Output files
		htmlFile = path.join(basePath, options.docName),
		jsFile = path.join(basePath, 'app.js'),
		// Input files
		htmlInFile = path.join(__dirname, 'index.html'),
		appPreFile = path.join(__dirname, 'app.js.pre'),
		appPostFile = path.join(__dirname, 'app.js.post'),
		stream;

	// Create a copy of the report template.
	fs.createReadStream(htmlInFile).pipe(fs.createWriteStream(htmlFile));

	// Construct app.js
	stream = fs.createWriteStream(jsFile);

	stream.write(fs.readFileSync(appPreFile));
	stream.write(JSON.stringify(jsonData));
	stream.write(fs.readFileSync(appPostFile));

	stream.end();
}

/**
 * Adds the metaData JSON to combined.json
 * combined.json is a JSON list, containing all metaData.
 * @param metaData the metaData to add to the combined JSON list
 * @param baseName
 * @param descriptions
 * @param options
 */
function addMetaData(metaData, baseName, descriptions, options){
	var json,
		stream,
		basePath = path.dirname(baseName),
		file = path.join(basePath,'combined.json');
	try {
		metaData.description = descriptions.join('|');
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

		addHTMLReport(json, baseName, options);
	} catch(e) {
		console.error('Could not save meta data' + e);
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
		console.error('Could not save meta data for ' + file);
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

function removeDirectory(dirPath){
	try { var files = fs.readdirSync(dirPath); }
      catch(e) { return; }
      if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
          var filePath = dirPath + '/' + files[i];
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
          else
            removeDirectory(filePath);
        }
      fs.rmdirSync(dirPath);
}

module.exports = {
	storeScreenShot: storeScreenShot
	, storeMetaData: storeMetaData
	, gatherDescriptions: gatherDescriptions
	, generateGuid: generateGuid
	, addMetaData: addMetaData
	, removeDirectory: removeDirectory
};
