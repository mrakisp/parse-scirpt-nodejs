INSTALLATION
---------------
npm install cheerio
npm i fs
npm i create-html
npm i async
npm i -s csv-parser
npm i -s csv-writer



HOW TO RUN
---------------
REPORT TYPES
"d" : development
"c" : customer
"f" : full


node parse.js moduleName reportType  
//EXAMPLES: 
//node parse.js claims f //full report (DEV & CUSTOMER) html and csv
//node parse.js claims c //customer report and csv
//node parse.js claims d //dev report without csv