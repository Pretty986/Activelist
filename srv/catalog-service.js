
// //Importing SAP CDS Module
// const cds = require('@sap/cds');
// // Async IIFE (Immediately Invoked Function Expression)
// (async () => {
//   //Try-Catch Block
//   try {
//     //Connect to the CDS Database
//     await cds.connect();

//     //Get Entity Definitions from CatalogService
//     const { Entity1, Entity2 } = cds.entities('CatalogService');
 
//     // Step 1: Fetch all records from Entity1
//     const entity1Data = await cds.run(SELECT.from(Entity1));
 
//     // Step 2: Build a Set of all psNumbers for quick lookup
//     const psNumbers = new Set(entity1Data.map(row => String(row.psNumber).trim()));
 
//     // Fields to check for inactive values
//     const fieldsToCheck = ['PracticeBaseManager', 'KDM', 'IRM', 'PeoplePartner'];

//     //processedInactive: Ensures you don’t process the same inactive value more than once & inactiveEntries: Will store all identified inactive records for later insertion.
//     const processedInactive = new Set();
//     const inactiveEntries = [];

//     //Iterate Over Fields to Find Inactive Values
//     //For each value in those fields, if it isn't present in the psNumber column (i.e., it's not a current person), mark it as "inactive."
//     for (const field of fieldsToCheck) {

//       //Find Unique, Non-Empty, Non-'NO_MANAGER' Values
//       const uniqueValues = new Set(
//         entity1Data
//           .map(row => row[field])
//           .filter(value => value && String(value).trim() !== '' && String(value).trim() !== 'NO_MANAGER')
//           .map(value => String(value).trim())
//       );

//       //Check Each Unique Value for "Inactivity"
//       for (const value of uniqueValues) {
//         if (!psNumbers.has(value)) {

//           //Avoid Duplicates, Find Example Row
//           const key = `${field}|${value}`;
//           if (!processedInactive.has(key)) {
//             processedInactive.add(key);
//             const example = entity1Data.find(row => String(row[field]).trim() === value);

//             //Special Handling for "IRM" Field
//             // Remove '.0' from IRM field if applicable
//             const cleanedIRM = field === 'IRM' && /^\d+\.0$/.test(value) ? value.replace('.0', '') : (field === 'IRM' ? value : null);

//             //Build Inactive Entry
//             inactiveEntries.push({
//               psNumber: example?.psNumber || null,
//               PracticeBaseManager: field === 'PracticeBaseManager' ? value : null,
//               KDM: field === 'KDM' ? value : null,
//               IRM: cleanedIRM,
//               PeoplePartner: field === 'PeoplePartner' ? value : null
//             });
//           }
//         }
//       }
//     }
//     //Logging Inactive Record Count
//     console.log(`\n🔍 Total inactive records identified: ${inactiveEntries.length}\n`);
 
//     // Step 3: Insert inactive records into Entity2
//     // Insert Inactive Records into Entity2
//     if (inactiveEntries.length > 0) {
//       await cds.run(INSERT.into(Entity2).entries(inactiveEntries));
//       console.log(`\n✅ ${inactiveEntries.length} inactive record(s) inserted into Entity2.\n`);
//     } else {
//       console.log('\n✅ No inactive records found.\n');
//     }
//   } 
//   //Error Handling
//   catch (err) {
//     console.error('❌ Error:', err);
//   }
// })();
 

//new req without hana 
// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');
 
//  // Define the path to your CSV file
//  const filePath = path.join(__dirname, 'upload', 'file_test.csv');
  
//   // Array to store the required values from each row (flat array)
//   const resultArray = [];
   
//    fs.createReadStream(filePath)
//      .pipe(csv())
//        .on('data', (row) => {
//            // Extract each value individually and push if not undefined or empty
//                if (row['Practice/Base Manager']) resultArray.push(row['Practice/Base Manager']);
//                    if (row['KDM']) resultArray.push(row['KDM']);
//                        if (row['People Partner']) resultArray.push(row['People Partner']);
//                            if (row['IRM']) resultArray.push(row['IRM']);
//                              })
//                                .on('end', () => {
//                                    // Remove duplicates by converting to a Set, then back to an array
//                                        const uniqueValues = [...new Set(resultArray)];
//                                            console.log('CSV file successfully read.');
//                                                console.log('Extracted Values:', resultArray);
//                                                    console.log('Unique Values:', uniqueValues);
//                                                      })
//                                                        .on('error', (err) => {
//                                                            console.error('Error reading the CSV file:', err);
//                                                              });



//identifying  inactive persons, and groups their corresponding reportees into a structured object
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Define the path to your CSV file
const filePath = path.join(__dirname, 'upload', 'file_test.csv');

// Set to store unique inactive values
const inactivelist = new Set();

// Array to store all rows for second pass
const allRows = [];

// Read and parse the CSV
fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    allRows.push(row); // Store row for second pass

    const irm = row['IRM']?.trim();
    const irmSepDate = row['IRM Sep Date']?.trim();
    const peoplePartner = row['People Partner']?.trim();
    const peoplePartnerSepDate = row['People Partner Sep Date']?.trim();
    const kdm = row['KDM']?.trim();
    const kdmSepDate = row['KDM Sep Date']?.trim();

    if (irm && irmSepDate) {
      inactivelist.add(irm);
    }
    if (peoplePartner && peoplePartnerSepDate) {
      inactivelist.add(peoplePartner);
    }
    if (kdm && kdmSepDate) {
      inactivelist.add(kdm);
    }
  })
  .on('end', () => {
    // Detect actual key for P. S. Number
    const psNumberKey = Object.keys(allRows[0]).find(
      key => key.trim().toLowerCase() === 'p. s. number'
    );

    if (!psNumberKey) {
      console.error('Could not find "P. S. Number" column in CSV.');
      return;
    }

    // Map to group reportees under each inactive person
    const inactiveReporteesMap = {};

    allRows.forEach((row) => {
      const psNumber = row[psNumberKey]?.trim();
      const irm = row['IRM']?.trim();
      const peoplePartner = row['People Partner']?.trim();
      const kdm = row['KDM']?.trim();

      [irm, peoplePartner, kdm].forEach((person) => {
        if (inactivelist.has(person)) {
          if (!inactiveReporteesMap[person]) {
            inactiveReporteesMap[person] = [];
          }
          inactiveReporteesMap[person].push(psNumber);
        }
      });
    });

    console.log('CSV file successfully read.');
    console.log('Inactive Values:', Array.from(inactivelist));
    console.log('Grouped Reportees by Inactive Person:', inactiveReporteesMap);
  })
  .on('error', (err) => {
    console.error('Error reading the CSV file:', err);
  });
