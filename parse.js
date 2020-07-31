var $ = require('cheerio')
const csv = require('csv-parser');
// csv({ strict: true});
var fs = require('fs')
var async = require('async');
var createHTML = require('create-html')
var path = require('path')
var htmlOutput = "<div>"
var technicalInfoHtml = "<div style='padding:10px;'>"

console.log("PARSE & REPORT: " + process.argv[2])
const moduleToParse = process.argv[2]
const reportType = process.argv[3]

let rawdata = fs.readFileSync('config.json');
let files = JSON.parse(rawdata);

var htmlTitle= '<h1>REPORT FOR ' + files.root[moduleToParse].moduleName + '</h1>';
var elementsFoundWOhooks = ''
var elementsFoundWithHooks = ''
var htmlOutputJsFound = ''
if(reportType == 'f' || reportType == 'd'){
	elementsFoundWOhooks = '<h2>Semantic Elements has been found in html files without js selectors</h2></br>'
	elementsFoundWithHooks = '<h2>Semantic Elements has been found in html files with js selectors</h2></br>'
	elementsFoundWOhooks += '<table><tr><th>FILE PATH</th><th>SELECTOR</th><th>ROW</th><th>TYPE</th><th>CLASSES</th></tr>'
	elementsFoundWithHooks += '<table><tr><th>FILE PATH</th><th>SELECTOR</th><th>JS SELECTOR</th><th>ROW</th><th>TYPE</th><th>CLASSES</th></tr>'
}
if(reportType == 'f' || reportType == 'c'){
htmlOutputJsFound = '<h2>Html files that contain js-selectors</h2>'
htmlOutputJsFound += '<table><tr><th>FILE PATH</th><th>JS SELECTOR</th><th>ROW</th></tr>'
}
// htmlOutput += '<h2>REPORT FOR ' + files.root[moduleToParse].moduleName + '</h2>'

var arrayOfPaths = [];
var arrayOfPathsTransformed = [];
for (var i = 0; i < files.root.viewPathList.length; i++) {
	arrayOfPaths.push(files.root.viewPathList[i].viewPath);
	viewPathTransformed = files.root.viewPathList[i].viewPath.replace(files.root.moduleViewsPath, '')
	viewPathTransformed = viewPathTransformed.replace("/", '')
	arrayOfPathsTransformed.push(viewPathTransformed);
}

//GET SIMANTIC ELEMENTS FROM CONFIG FILE
var elementsToSearch = '';
var elementsToSearchArray = [];
for (var i = 0; i < files.root.semanticSelectorsArray.length; i++) {
	elementsToSearchArray.push(files.root.semanticSelectorsArray[i].element)
	if (i == files.root.semanticSelectorsArray.length - 1) {
		elementsToSearch += files.root.semanticSelectorsArray[i].element
	} else {
		elementsToSearch += files.root.semanticSelectorsArray[i].element + ','
	}
}

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'report.csv',
  header: [
    {id: 'filepath', title: 'FILE PATH'},
    {id: 'jsselector', title: 'JS SELECTOR'},
    {id: 'row', title: 'ROW'},
	{id: 'type', title: 'TYPE'},
	{id: 'classes', title: 'CLASSES'},
	{id: 'trvalues', title: 'TRANSLATIONS STRINGS'}
  ]
});


let csvData = [];

//FIND DYNAMICLY ALL HTML FILES IN LOCATION
function fromDir(startPath, filter) {

	if (!fs.existsSync(startPath)) {
		console.log("moduleViewsPath in config file is not correct", startPath);
		return;
	}

	var htmlfiles = fs.readdirSync(startPath);
	// technicalInfoHtml += '<h2>Technical Info</h2></br>TOTAL HTML PAGES FOUND IN "'+startPath+'": <b>' + files.length + '</b></br>'
	// technicalInfoHtml += 'TOTAL HTML PAGES DECLARED IN CONFIG FILE: <b>' + arrayOfPaths.length + '</b></br></br>'
	// console.log('HTML PAGES FOUND IN '+startPath+' -----> '+files.length)
	for (var x = 0; x < htmlfiles.length; x++) {
		var filename = path.join(startPath, htmlfiles[x]);
		var stat = fs.lstatSync(filename);
		console.log(filename + " ------- > Parsed Succesfully");
		if (stat.isDirectory()) {
			fromDir(filename, filter); //recurse
		}
		else if (filename.indexOf(filter) >= 0) {
			// filenameTransformed = filename.replace(startPath, '')
			// filenameTransformed = filenameTransformed.replace("\\", '')
			// if (!arrayOfPathsTransformed.includes(filenameTransformed)) {
			// 	//console.log(filenameTransformed)
			// 	technicalInfoHtml += 'HTML FILE THAT IS NOT DECLARED IN CONFIG: <b>' + filename + '</b></br>'
			// }

			var htmlString = fs.readFileSync(filename).toString()
			var parsedHTML = $.load(htmlString, { xmlMode: true, withStartIndices: true });

			if(reportType == 'f' || reportType == 'c'){
				parsedHTML(elementsToSearch+',div,span').map(function (i, itemDiv) {
					if ($(itemDiv).is('[class*=js-]')) {
						var jsSelector = '';
						var classes = $(itemDiv).attr('class');
						classes = classes.split(" ");
						for (var i = 0; i < classes.length; i++) {
							if (classes[i].startsWith("js-")) {
								jsSelector = classes[i]
							}
						}

						const start = $(itemDiv).get(0).startIndex;
						const lineNumber = htmlString.substr(0, start).split('\n').length;
						//htmlOutputJsFound += 'File <b>"'+filename + '"</b> has js selector <b>"' + jsSelector +'"</b> at row '+ lineNumber + '</br>';
						
						htmlOutputJsFound += '<tr><td style="padding-right:40px;">'+filename+'</td>'
						htmlOutputJsFound += '<td>'+jsSelector+'</td>'
						htmlOutputJsFound += '<td>'+lineNumber+'</td><tr>'

						var translationStrings = $(itemDiv).attr('data-bind')
						if(translationStrings && translationStrings.includes('resolveValue')){
							translationStrings = translationStrings.slice(translationStrings.indexOf('('), translationStrings.lastIndexOf(')') + 1)
						}
						// else if($(itemDiv).closest('label') && $(itemDiv).closest('label').attr('data-bind') && $(itemDiv).closest('label').attr('data-bind').includes('resolveValue') ){
						// 	translationStrings = $(itemDiv).closest('label').attr('data-bind').slice($(itemDiv).closest('label').attr('data-bind').indexOf('('), $(itemDiv).closest('label').attr('data-bind').lastIndexOf(')') + 1)
						// }else if($(itemDiv).closest('oj-label') && $(itemDiv).closest('oj-label').attr('data-bind') && $(itemDiv).closest('oj-label').attr('data-bind').includes('resolveValue') ){
						// 	translationStrings = $(itemDiv).closest('oj-label').attr('data-bind').slice($(itemDiv).closest('oj-label').attr('data-bind').indexOf('('), $(itemDiv).closest('oj-label').attr('data-bind').lastIndexOf(')') + 1)
						// }else if($(itemDiv).closest('div')  && $(itemDiv).closest('div').attr('data-bind') && $(itemDiv).closest('div').attr('data-bind').includes('resolveValue') ){
						// 	translationStrings = $(itemDiv).closest('div').attr('data-bind').slice($(itemDiv).closest('div').attr('data-bind').indexOf('('), $(itemDiv).closest('div').attr('data-bind').lastIndexOf(')') + 1)
							
						// }else if($(itemDiv).closest('span') ){
						// 	//translationStrings = $(itemDiv).closest('span').attr('data-bind').slice($(itemDiv).closest('span').attr('data-bind').indexOf('('), $(itemDiv).closest('span').attr('data-bind').lastIndexOf(')') + 1)
						// 	console.log()
						// }
						else if($(itemDiv).parents().attr('data-bind') && $(itemDiv).parents().attr('data-bind').includes('resolveValue')){
							translationStrings = $(itemDiv).parents().attr('data-bind') .slice($(itemDiv).parents().attr('data-bind').indexOf('('), $(itemDiv).parents().attr('data-bind').lastIndexOf(')') + 1)
						}else if($(itemDiv).nextAll().attr('data-bind') && $(itemDiv).nextAll().attr('data-bind').includes('resolveValue')){
							translationStrings = $(itemDiv).nextAll().attr('data-bind') .slice($(itemDiv).nextAll().attr('data-bind').indexOf('('), $(itemDiv).nextAll().attr('data-bind').lastIndexOf(')') + 1)
						}else{
							translationStrings = ''
						}
						csvData.push({ // for csv
							filepath: filename,
							jsselector: jsSelector,
							row: lineNumber,
							type: itemDiv.name,
							classes: $(itemDiv).attr('class'), 
							trvalues: translationStrings
						  })
						
					}
				});
			}
			if(reportType == 'f' || reportType == 'd'){
				parsedHTML(elementsToSearch).map(function (i, itemDiv) { // if element has custom selector
					var elementClasses = $(itemDiv).attr('class');
					const start = $(itemDiv).get(0).startIndex;
					const lineNumber = htmlString.substr(0, start).split('\n').length;
					if (elementClasses && elementClasses.length > 0) {
						elementClasses = elementClasses.split(" ");
						var semanticElement = '';

						for (var y = 0; y < elementsToSearchArray.length; y++) {
							for (var z = 0; z < elementClasses.length; z++) {
								if (elementsToSearchArray[y] === '.' + elementClasses[z]) {
									semanticElement = elementClasses[z]
								}
							}
						}
					}

					if (semanticElement) {
						if (!$(itemDiv).is('[class*=js-]')) { //GENERATE REPORT FOR ELEMENTS WITHOUT JS-SELECTORS
							elementsFoundWOhooks += '<tr><td style="padding-right:40px;">'+filename+'</td>'
							elementsFoundWOhooks += '<td>'+semanticElement+'</td>'
							elementsFoundWOhooks += '<td>'+lineNumber+'</td>'
							elementsFoundWOhooks += '<td>'+itemDiv.name+'</td>'
							elementsFoundWOhooks += '<td>'+$(itemDiv).attr('class')+'</td><tr>'
							

							//ROW LAYOUT
							// elementsFoundWOhooks += 'Element type <b>"' + itemDiv.name + '"</b> with selector <b>' + semanticElement + '</b> found in <b>"' + filename + '"</b> without js selector</br>'
							// elementsFoundWOhooks += 'Row: ' + lineNumber + '</br>'
							// elementsFoundWOhooks += 'Element Classes: ' + $(itemDiv).attr('class') + '</br><hr>'
						}

						if ($(itemDiv).is('[class*=js-]')) { //GENERATE REPORT FOR ELEMENTS WITH JS-SELECTORS
							var jsSelector = '';
							var classes = $(itemDiv).attr('class');
							classes = classes.split(" ");
							for (var i = 0; i < classes.length; i++) {
								if (classes[i].startsWith("js-")) {
									jsSelector = classes[i]
								}
							}

							elementsFoundWithHooks += '<tr><td style="padding-right:40px;">'+filename+'</td>'
							elementsFoundWithHooks += '<td>'+semanticElement+'</td>'
							elementsFoundWithHooks += '<td>'+jsSelector+'</td>'
							elementsFoundWithHooks += '<td>'+lineNumber+'</td>'
							elementsFoundWithHooks += '<td>'+itemDiv.name+'</td>'
							elementsFoundWithHooks += '<td>'+$(itemDiv).attr('class')+'</td><tr>'
							//ROW LAYOUT
							// elementsFoundWithHooks += 'Element type <b>"' + itemDiv.name + '"</b>with selector <b>' + semanticElement + '</b> found in <b>"' + filename + '"</b> with js selector <b>' + jsSelector + '</b></br>'
							// elementsFoundWithHooks += 'Row: ' + lineNumber + '</br>'
							// elementsFoundWithHooks += 'Element Classes: ' + $(itemDiv).attr('class') + '</br><hr>'
						}

					} else {
						if (!$(itemDiv).is('[class*=js-]')) { //GENERATE REPORT FOR ELEMENTS WITHOUT JS-SELECTORS
							
							elementsFoundWOhooks += '<tr><td style="padding-right:40px;">'+filename+'</td>'
							elementsFoundWOhooks += '<td>'+itemDiv.name+'</td>'
							elementsFoundWOhooks += '<td>'+lineNumber+'</td>'
							elementsFoundWOhooks += '<td>'+itemDiv.name+'</td>'
							elementsFoundWOhooks += '<td>'+$(itemDiv).attr('class')+'</td><tr>'
							//ROW LAYOUT
							// elementsFoundWOhooks += 'Element type <b>"' + itemDiv.name + '"</b> found in <b>"' + filename + '"</b> without js selector</br>'
							// elementsFoundWOhooks += 'Row: ' + lineNumber + '</br>'
							// elementsFoundWOhooks += 'Element Classes: ' + $(itemDiv).attr('class') + '</br><hr>'
						}

						if ($(itemDiv).is('[class*=js-]')) { //GENERATE REPORT FOR ELEMENTS WITH JS-SELECTORS
							var jsSelector = '';
							var classes = $(itemDiv).attr('class');
							classes = classes.split(" ");
							for (var i = 0; i < classes.length; i++) {
								if (classes[i].startsWith("js-")) {
									jsSelector = classes[i]
								}
							}

							elementsFoundWithHooks += '<tr><td style="padding-right:40px;">'+filename+'</td>'
							elementsFoundWithHooks += '<td>'+itemDiv.name+'</td>'
							elementsFoundWithHooks += '<td>'+jsSelector+'</td>'
							elementsFoundWithHooks += '<td>'+lineNumber+'</td>'
							elementsFoundWithHooks += '<td>'+itemDiv.name+'</td>'
							elementsFoundWithHooks += '<td>'+$(itemDiv).attr('class')+'</td><tr>'
							//ROW LAYOUT
							// elementsFoundWithHooks += 'Element type <b>"' + itemDiv.name + '" found in <b>"' + filename + '"</b> with js selector <b>' + jsSelector + '</b></br>'
							// elementsFoundWithHooks += 'Row: ' + lineNumber + '</br>'
							// elementsFoundWithHooks += 'Element Classes: ' + $(itemDiv).attr('class') + '</br><hr>'
						}
					}

				})
			}
		};
	};

};

fromDir(files.root[moduleToParse].moduleViewsPath, '.html'); //DECLARE THE PATH TO SEARCH FOR HTML FILES

function fix(event){
	debugger;
// $(event).closest('tr').hide()
}

//GET THE PATHS OF HTML FILES TO PARSE
//console.log('HTML PAGES IN CONFIG FILE -----> ' + arrayOfPaths.length)
//LOOP THROUGH PATHS
var htmlIndex = 0
async.eachSeries(arrayOfPaths, function (filename, cb) {

	fs.readFile(filename, function (err, content, i) {
		if (!err) {
			console.log(filename + ' Checked')


			htmlOutput += '<br/><div style="background-color:green; color:white; padding:10px;">FILE: ' + files.root.viewPathList[htmlIndex].viewName + '.html</div><br/>'
			var htmlString = fs.readFileSync(filename).toString()
			var parsedHTML = $.load(htmlString);

			parsedHTML('p,div,input,form,textarea,ul').map(function (i, itemDiv) { // if element has custom selector

				for (var y = 0; y < files.root.viewPathList[htmlIndex].elementsList.length; y++) {
					if ($(itemDiv).hasClass(files.root.viewPathList[htmlIndex].elementsList[y].selector)) {
						//itemDiv = $(itemDiv)
						htmlOutput += 'ELEMENT: <b>' + files.root.viewPathList[htmlIndex].elementsList[y].selector + '</b>'
						if ($(itemDiv).hasClass(files.root.viewPathList[htmlIndex].elementsList[y].customSelector)) {
							htmlOutput += ' <span style="background-color:green;color:white;padding:5px;margin: 10px;"> HAS JS SELECTOR </span> <b> ' + files.root.viewPathList[htmlIndex].elementsList[y].customSelector + "</b></br>"
						} else {
							htmlOutput += ' <span style="background-color:red;color:white;padding:5px;margin: 10px;"> HAS NOT JS SELECTOR </span> <b> ' + files.root.viewPathList[htmlIndex].elementsList[y].customSelector + "</b></br>"
						}
						htmlOutput += ' TYPE: <b>' + itemDiv.name + '</b><hr></br>'
					}
				}
			})

		}
		htmlIndex++
		// Calling cb makes it go to the next item.
		cb(err);

	});
},
	// Final callback after each item has been iterated over.

	function (err) {
		htmlOutput += "</div>"
		var html = createHTML({
			title: 'REPORT',
			css: 'style.css',
			body: htmlTitle+elementsFoundWOhooks+'</table>' + elementsFoundWithHooks+'</table>' + htmlOutput + htmlOutputJsFound+'</table>' + technicalInfoHtml + '</div></br>'
		})

		fs.writeFile('report.html', html, function (err) {
			if (err) console.log(err)
		})

		//response.end()
	}
);


if(reportType == 'f' || reportType == 'c'){
	csvWriter
	.writeRecords(csvData)
	.then(()=> console.log('The CSV file was written successfully'));
}




