const express = require('express');
const app = express();
const port = 3001; // Update the port if needed
const XLSX = require('xlsx');
const pdf = require('html-pdf');

app.use(express.static('public'));
app.use(express.json());

// Function to generate failed test cases report for specified modules
function generateFailedTestCasesReport(workbook, moduleNames) {
    const sheetNames = workbook.SheetNames.filter(name => name !== 'MasterSheet');

    let reportHTML = '';

    sheetNames.forEach(sheetName => {
        if (moduleNames.includes(sheetName)) {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            reportHTML += `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Failed Test Cases Report - ${sheetName}</title>
                    <style>
                        .failed-test-case {
                            margin-bottom: 20px;
                        }
                        .objective {
                            font-weight: bold;
                            color: red;
                            font-size:30px;
                        }
                    </style>
                </head>
                <body>
                <br><br>
                    <h1>Failed Test Cases Report - ${sheetName}</h1>`;

            let noError = true;

            for (let i = 5; i < data.length; i++) {
                const row = data[i];
                const statusColumnIndex = 8; // Default to 8

                if (row[statusColumnIndex] && row[statusColumnIndex].toLowerCase() === 'fail') {
                    const objective = row[2];
                    noError = false;

                    reportHTML += `
                        <div class="failed-test-case">
                            <p class="objective">${objective}</p>
                        </div>`;
                }
            }

            if (noError) {
                reportHTML += `
                        <div class="failed-test-case">
                            <p class="objective">No failed test cases</p>
                        </div>`;
            }

            reportHTML += `
                </body>
                </html>`;
        }
    });

    return reportHTML;
}

app.post('/generate_report', (req, res) => {
    const moduleNames = req.body.moduleNames;

    // Read data from the Excel file
    const workbook = XLSX.readFile('ManualtestCases.xlsx');
    const masterSheet = workbook.Sheets['MasterSheet'];
    const masterData = XLSX.utils.sheet_to_json(masterSheet, { header: 1 });

    // Filter data based on module names
    const filteredData = masterData.filter(row => moduleNames.includes(row[0]));

    // Generate percentage circles report
    const reportHTML = generatePercentageCirclesReport(filteredData);

    // Generate failed test cases report
    const failedTestCasesHTML = generateFailedTestCasesReport(workbook, moduleNames);

    // Combine both reports
    const combinedHTML = `
        ${reportHTML}
        ${failedTestCasesHTML}
    `;

    res.send(combinedHTML);
});

function generatePercentageCirclesReport(filteredData) {
    // Your existing function for generating the report
    let totalPassedTestCases = 0;
    let totalTestCases = 0;

    let reportHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Case Report</title>
            <style>
            .progress-container {
                margin-top: 20px;
                margin:30px;
            }
            
            .progress-bar {
                width: 100%; /* Adjust the width of the progress bar */
                height: 60px; /* Adjust the height of the progress bar */
                background-color: #f0f0f0;
                border: 2px solid grey; /* Add border for the progress bar */
                border-radius: 10px; /* Add border radius for rounded corners */
                margin-bottom: 45px; /* Add margin bottom to create space between progress bars */
                position: relative;
            }
            
            .inner-bar {
                height: 100%;
                background-color: #4CAF50; /* Set color of the inner progress bar */
                border-radius: 5px; /* Add border radius for rounded corners */
            }
            
            .percentage {
                font-size: 16px;
                font-weight: bold;
                color: black;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                margin: 0;
            }
            
            .module-name {
                font-size: 35px;
                color: black;
                position: absolute;
                left: 10px;
                transform: translateY(-50%);
                margin: 0;
                white-space: nowrap;
            }
            </style>
        </head>
        <body>
            <div class="percentage-circles-report">
                <h1>Percentage of working test cases</h1>
    `;

    filteredData.forEach(row => {
        const moduleName = row[0];
        const totalCases = row[2];
        const passedCases = row[3];
        const percentage = (passedCases / totalCases) * 100 || 0;
        const color = getColor(percentage);

        totalPassedTestCases += passedCases;
        totalTestCases += totalCases;

        reportHTML += `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="inner-bar" style="width: ${percentage}%; background-color: ${color};"></div>
                    <div class="percentage">${percentage.toFixed(2)}%</div>
                    <div class="module-name">${moduleName}</div>
                </div>
            </div>`;
    });

    reportHTML += `
        </div>
    </body>
    </html>`;

    const combinedPercentage = (totalPassedTestCases / totalTestCases) * 100 || 0;

    // Display combined percentage in a stunning manner
    reportHTML += `
        <div class="combined-percentage">
            <p style= "font-size:30px; text-align: center;">Total Combined Percentage</p>
            <div class="progress-bar">
                <div class="inner-bar" style="width: ${combinedPercentage}%; background-color: ${getColor(combinedPercentage)};"></div>
                <div class="percentage">${combinedPercentage.toFixed(2)}%</div>
            </div>
        </div>
    </div>
    </body>
    </html>`;

    return reportHTML;
}

function getColor(percentage) {
   
    if (percentage >= 90) {
        return 'green';
    } else if (percentage >= 70) {
        return 'yellow';
    } else {
        return 'red';
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
