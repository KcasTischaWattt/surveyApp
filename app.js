async function appApplicationName(containerId, quizDataUrl) {
    const container = document.getElementById(containerId);

    async function loadSurveyFromJSON() {
        try {
            const response = await fetch(quizDataUrl);
            const data = await response.json();
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
                surveyData.options.forEach(option => {
                    const optionItem = document.createElement('li');

                    const label = document.createElement('label');
                    if (surveyData.type === "Single answer") {
                        const radio = document.createElement('input');
                        radio.type = "radio";
                        radio.name = "answer";
                        radio.value = option;
                        label.appendChild(radio);
                    } else if (surveyData.type === "Multiple choice") {
                        const checkbox = document.createElement('input');
                        checkbox.type = "checkbox";
                        checkbox.name = "answer";
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
                if (!("pollResults" in localStorage)) {
                    localStorage["pollResults"] = JSON.stringify({});
                }
                console.log("Survey loaded, please start answering.");

                let pollResults = JSON.parse(localStorage["pollResults"]);
                let totalCount = 0;
                if (pollResults != {}) {
                    Object.values(pollResults).forEach( num => {
                        totalCount += num;
                    })
                }
                if (totalCount > 0) {
                    displayResults(pollResults);
                    showCancelButton();
                } else {
                    seeResultsButton();
                    exportButton();
                    showReportForm()
                } 
            } else {
                console.log('Error fetching survey type:', surveyData.type,
                            '. Available types: "Single answer", "Multiple choice"');
            }
        } else {
            console.log("Error loading survey. Please try again later.");
        }
    }

    function calculateResults() {
        const options = document.querySelectorAll('input[name="answer"]');
        let pollResults = JSON.parse(localStorage["pollResults"]);
        options.forEach(option => {
            const res = option.checked ? 1 : 0;
            pollResults[option.value] = res;
        });
        // Write to Airtable
        localStorage["pollResults"] = JSON.stringify(pollResults);
        displayResults(pollResults);
    }

    function displayResults(results) {
        container.innerHTML = '';
    
        const resultsElement = document.createElement('div');
        resultsElement.textContent = 'Survey Results:';
        container.appendChild(resultsElement);
    
        // Read from Airtable
        let pollResults = JSON.parse(localStorage["pollResults"]);
        console.log(pollResults);
        const resultList = document.createElement('ul');
        // Total count would be stored in Airtable
        let totalCount = 0;
        Object.values(pollResults).forEach(num => {
            totalCount += num;
        })
        Object.entries(results).forEach(([option, res]) => {
            const resultItem = document.createElement('li');
            const percentage = totalCount == 0 ? 0 : Math.round(res / totalCount * 100);
            if (pollResults[option] !== 0) {
                resultItem.innerHTML = `<strong>${option}: ${percentage}%</strong>`;
            } else {
                resultItem.textContent = `${option}: ${percentage}%`;
            }
            resultList.appendChild(resultItem);
        });
        container.appendChild(resultList);
    }

    function showCancelButton() {
        const cancelButtonDiv = document.createElement('div');
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', cancelButtonFunc);
        cancelButtonDiv.appendChild(cancelButton);
        container.appendChild(cancelButtonDiv);
        exportButton();
        showReportForm();
    }

    function seeResultsButton() {
        const confirmButtonDiv = document.createElement('div');
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'See results';
        confirmButton.addEventListener('click', calculateResults);
        confirmButton.addEventListener('click', showCancelButton);
        confirmButtonDiv.appendChild(confirmButton);
        container.appendChild(confirmButtonDiv);
    }

    function showReportButton() {
        const reportButtonDiv = document.createElement('div');
        const reportButton = document.createElement('button');
        reportButton.textContent = 'Report';
        const popUp = document.createElement('div');
        reportButton.addEventListener('click', showReportForm());
        reportButtonDiv.appendChild(reportButton);
        container.appendChild(reportButtonDiv);
    }

    startSurvey();

    function cancelButtonFunc() {
        localStorage["pollResults"] = JSON.stringify({});
        //TODO Delete from airtable
        startSurvey();
    }

    function exportButton() {
        const exportButtonContainer = document.createElement('div');
        exportButtonContainer.classList.add('export-btn-container');
    
        const exportButton = document.createElement('button');
        exportButton.textContent = 'Export results';
        exportButton.classList.add('dropbtn');
        exportButtonContainer.appendChild(exportButton);
    
        const exportDropdownContent = document.createElement('div');
        exportDropdownContent.id = 'export-dropdown-content';
        exportDropdownContent.classList.add('dropdown-content');
        exportDropdownContent.innerHTML = `
            <button id="export-csv">Export CSV</button>
            <button id="export-json">Export JSON</button>
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
    
        document.getElementById("export-csv").addEventListener("click", exportCSV);
        document.getElementById("export-json").addEventListener("click", exportJSON);
    
        function exportCSV() {
            // TODO Logic to export results in CSV format
            console.log("Exporting results as CSV...");
        }
    
        function exportJSON() {
            // TODO Logic to export results in JSON format
            console.log("Exporting results as JSON...");
        }
    }
    
    function showReportForm() { 
        const reportButtonDiv = document.createElement('div');
        const reportButton = document.createElement('button');
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
        submitButton.classList.add('submit-button');
        submitButton.textContent = 'Send';
        submitButton.onclick = function() {
            var feedback = feedbackInput.value.trim();
            if (feedback === '') {
                alert('Please enter ypur report');
                return;
            }

            fetch('', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'feedback=' + encodeURIComponent(feedback)
            }).then(response => {
                alert('Report has successefully sent!');
                popUp.classList.remove('show');
            }).catch(error => {
                console.error('An error occured: ', error);
            });
        };        
        popUpContent.appendChild(feedbackForm);
        popUpContent.appendChild(submitButton);
    }


}