const fs = require('fs');
const path = require('path');

// Let's create a parser for the new CSV dataset provided by the user
const rawCsvPath = path.resolve('raw_dataset.csv');
if (!fs.existsSync(rawCsvPath)) {
  console.log('raw_dataset.csv does not exist yet');
}
