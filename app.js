async function appApplicationName(containerId, quizDataUrl) {
    const container = document.getElementById(containerId);
    var localResults = {};

    function displayStep(step) {
        console.log(step);
    }

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

                    if (surveyData.type === "Single answer") {
                        const radio = document.createElement('input');
                        radio.type = "radio";
                        radio.name = "answer";
                        radio.value = option;
                        optionItem.appendChild(radio);
                    } else if (surveyData.type === "Multiple choice") {
                        const checkbox = document.createElement('input');
                        checkbox.type = "checkbox";
                        checkbox.name = "answer";
                        checkbox.value = option;
                        optionItem.appendChild(checkbox);
                    }
                    const label = document.createElement('label');
                    label.textContent = option;
                    optionItem.appendChild(label);

                    optionsElement.appendChild(optionItem);
                });
                container.appendChild(optionsElement);
                displayStep("Survey loaded, please start answering.");

                localResults = {};
                const confirmButtonDiv = document.createElement('div');
                const confirmButton = document.createElement('button');
                confirmButton.textContent = 'See results';
                confirmButton.addEventListener('click', calculateResults);
                confirmButtonDiv.appendChild(confirmButton);
                container.appendChild(confirmButtonDiv);
                
                exportButton(); 
            } else {
                console.log('Error fetching survey type:', surveyData.type,
                            '. Available types: "Single answer", "Multiple choice"');
            }
        } else {
            displayStep("Error loading survey. Please try again later.");
        }
    }

    function calculateResults() {
        const options = document.querySelectorAll('input[name="answer"]');
        options.forEach(option => {
            const percentage = option.checked ? 100 : 0;
            localResults[option.value] = percentage;
        });
        displayResults(localResults);
    }

    function displayResults(results) {
        container.innerHTML = '';

        const resultsElement = document.createElement('div');
        resultsElement.textContent = 'Survey Results:';
        container.appendChild(resultsElement);

        const resultList = document.createElement('ul');
        Object.entries(results).forEach(([option, percentage]) => {
            const resultItem = document.createElement('li');
            resultItem.textContent = `${option}: ${percentage}%`;
            resultList.appendChild(resultItem);
        });
        container.appendChild(resultList);

        // Adding Cancel button
        const cancelButtonDiv = document.createElement('div');
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', startSurvey);
        cancelButtonDiv.appendChild(cancelButton);
        container.appendChild(cancelButtonDiv);
        exportButton();
    }

    startSurvey();

    function exportButton() {
        // Exporting results
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
            exportDropdownContent.classList.remove('show')
        }
    
        function exportJSON() {
            // TODO Logic to export results in JSON format
            console.log("Exporting results as JSON...");
            exportDropdownContent.classList.remove('show')
        }
    }  

}