async function appSurveyApp(containerId, quizDataUrl, reportTableURL, resultsTableURL) {
    const container = document.getElementById(containerId);
    const prefix = containerId + "pollResults";


    async function loadSurveyFromJSON() {
        try {
            const response = await fetch(quizDataUrl);
            const data = await response.json();
            options = data.options;
            return data;
        } catch (error) {
            console.error('Error fetching survey:', error);
            return null;
        }   
    }

    async function startSurvey() {
        container.innerHTML = '';

        const surveyData = await loadSurveyFromJSON();
        if (surveyData) {
            if (surveyData.type === "Multiple choice" || surveyData.type === "Single answer") {
                const questionElement = document.createElement('div');
                questionElement.textContent = surveyData.question;
                container.appendChild(questionElement);

                const optionsElement = document.createElement('ul');
                optionsElement.className = 'my_ul';

                surveyData.options.forEach(option => {
                    const optionItem = document.createElement('li');
                    optionItem.className = 'my_li';

                    const label = document.createElement('label');
                    label.className = 'mylabel';
                    if (surveyData.type === "Single answer") {
                        const radio = document.createElement('input');
                        radio.className = 'myinput';
                        radio.type = "radio";
                        radio.name = containerId + "answer";
                        radio.value = option;
                        label.appendChild(radio);
                    } else if (surveyData.type === "Multiple choice") {
                        const checkbox = document.createElement('input');
                        checkbox.type = "checkbox";
                        checkbox.name = containerId + "answer";
                        checkbox.value = option;
                        label.appendChild(checkbox);
                    }
                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = option;
                    label.appendChild(labelSpan);
                    optionItem.appendChild(label);

                    optionsElement.appendChild(optionItem);
                });
                container.appendChild(optionsElement);
                if (!(prefix in localStorage)) {
                    localStorage[prefix] = JSON.stringify({});
                }

                let pollResults = JSON.parse(localStorage[prefix]);
                let totalCount = 0;
                if (pollResults != {}) {
                    Object.values(pollResults).forEach( num => {
                        totalCount += num;
                    })
                }
                if (totalCount > 0) {
                    await displayResults("1");
                    showCancelButton();
                } else {
                    seeResultsButton();
                    showExportButton();
                    showReportForm()
                } 
            } else {
                console.error('Error fetching survey type:', surveyData.type,
                            '. Available types: "Single answer", "Multiple choice"');
            }
        } else {
            console.error("Error loading survey. Please try again later.");
        }
    }

    async function calculateResults() {
        const options_ = container.querySelectorAll(`input[name="${containerId}answer"]`);
        let pollResults = JSON.parse(localStorage[prefix]);
        let sum = 0;
        options_.forEach(option => {
            const res = option.checked ? 1 : 0;
            sum += res;
            pollResults[option.value] = res;
        });
        localStorage[prefix] = JSON.stringify(pollResults);
        await displayResults(pollResults);
        await writeResultsInGoogleSheets(pollResults, 1);
        await showCancelButton();
    }

    async function writeResultsInGoogleSheets(pollResults, value) {
        Object.entries(pollResults).forEach(([option, res]) => {
            if (res > 0) {
                updateGoogleSheets(option, value);
            } 
        });
    }

    async function displayResults(res) {
        container.innerHTML = '';
        const resultsElement = document.createElement('div');
        resultsElement.textContent = 'Survey Results:';
        container.appendChild(resultsElement);

        let data = await getSurveyResultsFromGoogleSheets()
        const resultList = document.createElement('ul');
        resultList.className = 'my_ul';

        let totalCount = 0;
        let pollResults = JSON.parse(localStorage[prefix]);

        data.forEach(({ _, count }) => {
            totalCount += count;
        });

        let resSum = 0;
        if (res != "1") {
            Object.values(res).forEach(val => resSum += val);
            totalCount += resSum;
        }

        data.forEach(({ option, count }) => {
            const resultItem = document.createElement('li');
            resultItem.className = 'my_li';
            let add = 0;
            if (res != "1") {
                add = res[option];
            }
            const percentage = totalCount === 0 ? 0 : Math.round(((count + add) / totalCount) * 100);
            if (pollResults[option] !== 0) {
                resultItem.innerHTML = `<strong>${option}: ${percentage}%</strong>`;
            } else {
                resultItem.textContent = `${option}: ${percentage}%`;
            }
            resultList.appendChild(resultItem);
        });
        container.appendChild(resultList);
    }

    async function showCancelButton() {
        const cancelButtonDiv = document.createElement('div');
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('btn');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', cancelButtonFunc);
        cancelButtonDiv.appendChild(cancelButton);
        container.appendChild(cancelButtonDiv);
        showExportButton();
        showReportForm();
    }

    function seeResultsButton() {
        const confirmButtonDiv = document.createElement('div');
        const confirmButton = document.createElement('button');
        confirmButton.classList.add('btn');
        confirmButton.textContent = 'See results';
        confirmButton.addEventListener('click', calculateResults);
        confirmButtonDiv.appendChild(confirmButton);
        container.appendChild(confirmButtonDiv);
    }

    function cancelButtonFunc() {
        let pollResults = JSON.parse(localStorage[prefix]);
        let sum = 0;
        Object.values(pollResults).forEach(val => sum += val);
        writeResultsInGoogleSheets(pollResults, -1);
        localStorage[prefix] = JSON.stringify({});
        startSurvey();
    }

    function showExportButton() {
        const exportButtonContainer = document.createElement('div');
        exportButtonContainer.classList.add('export-btn-container');
    
        const exportButton = document.createElement('button');
        exportButton.classList.add('btn');
        exportButton.textContent = 'Export results';
        exportButton.classList.add('dropbtn');
        exportButtonContainer.appendChild(exportButton);
    
        const exportDropdownContent = document.createElement('div');
        exportDropdownContent.id = 'export-dropdown-content';
        exportDropdownContent.classList.add('dropdown-content');
        exportDropdownContent.innerHTML = `
            <button id="export-csv" class="btn">Export CSV</button>
            <button id="export-json" class="btn">Export JSON</button>
        `;
        exportButtonContainer.appendChild(exportDropdownContent);
    
        container.appendChild(exportButtonContainer);
    
        exportButton.addEventListener('click', function() {
            exportDropdownContent.classList.toggle('show');
        });

        document.addEventListener('click', function(event) {
            if (!exportButtonContainer.contains(event.target)) {
                exportDropdownContent.classList.remove('show');
            }
        });

        container.querySelector("#export-csv").addEventListener("click", exportCSV);
        container.querySelector("#export-json").addEventListener("click", exportJSON);       
    
        async function exportCSV() {
            let data = await getSurveyResultsFromGoogleSheets();
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += Object.keys(data[0]).join(",") + "\n";
            data.forEach(entry => {
                csvContent += Object.values(entry).join(",") + "\n";
            });
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = 'survey_results.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            alert("Download comlete");
        }
    
        async function exportJSON() {
            let data = await getSurveyResultsFromGoogleSheets();
            let jsonData = JSON.stringify(data);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = 'survey_results.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            alert("Download comlete");
        }
    }
    
    function showReportForm() { 
        const reportButtonDiv = document.createElement('div');
        const reportButton = document.createElement('button');
        reportButton.classList.add('btn');
        reportButton.textContent = 'Report';
        const popUp = document.createElement('div');
        popUp.className = 'popUp';
        reportButton.addEventListener('click', function() {
            popUp.classList.add('show');
        });
        reportButtonDiv.appendChild(reportButton);
        container.appendChild(reportButtonDiv);
        container.appendChild(popUp);

        const popUpContent = document.createElement('div');
        popUpContent.className = 'popUpContent';
        popUp.appendChild(popUpContent);

        const feedbackTitle = document.createElement('div');
        feedbackTitle.classList.add('feedback-title');
        feedbackTitle.textContent = "Report form";
        popUpContent.appendChild(feedbackTitle);
    
        const closeButton = document.createElement('button');
        closeButton.classList.add('btn');
        closeButton.classList.add('close-button');
        closeButton.innerHTML = '&times;';
        closeButton.onclick = function() {
            popUp.classList.remove('show');
        };
        feedbackTitle.appendChild(closeButton);
    
        const feedbackForm = document.createElement('div');
        feedbackForm.classList.add('feedback-form');
    
        const feedbackInput = document.createElement('textarea');
        feedbackInput.classList.add('feedback-input');
        feedbackInput.placeholder = 'Your Report...';
        feedbackForm.appendChild(feedbackInput);
    
        const submitButton = document.createElement('button');
        submitButton.classList.add('btn');
        submitButton.classList.add('submit-button');
        submitButton.textContent = 'Send';
        submitButton.onclick = function() {
            var feedback = feedbackInput.value.trim();
            if (feedback === '') {
                alert('Please enter ypur report');
                return;
            }

            fetch(reportTableURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'feedback=' + encodeURIComponent(feedback)
            }).then(_ => {
                alert('Report has successefully sent!');
                popUp.classList.remove('show');
            }).catch(error => {
                console.error('An error occured: ', error);
            });
        };        
        popUpContent.appendChild(feedbackForm);
        popUpContent.appendChild(submitButton);
    }

    async function updateGoogleSheets(option, voteValue ) {
        const url = resultsTableURL;
        const data = {
            option: option,
            voteValue: voteValue,
        };
    
        try {
            const _ = await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error updating data:', error);
        }
    }

    async function getSurveyResultsFromGoogleSheets() {
        const url = resultsTableURL;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error('Error getting survey results:', response.statusText);
            }
        } catch (error) {
            console.error('Error getting survey results:', error);
        }
    }

    startSurvey();
}