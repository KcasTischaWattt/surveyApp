Данное приложение использует GoogleAppScripts для работы с Google таблицами. Для обеспечения корректной работы необходимо предварительно создать две таблицы: `ReportTable`, предназначенную для обратной связи, и `SurveyTable`, предназначенную для хранения результатов опроса.

Из-за данных технических особенностей скорость работы приложения ограничена, что приводит к замедлению загрузки результатов опроса. Ожидание загрузки данных составляет несколько секунд.

Ниже приведен пример кода, используемого мной в GoogleAppScripts для взаимодействия с указанными таблицами:


##ReportTable
```js
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rowData = [new Date(), e.parameter.feedback];
  sheet.appendRow(rowData);
  return ContentService.createTextOutput(JSON.stringify({ "result": "success", "row": rowData }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

##SurveyTable
```js
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  var option = data.option;
  var voteValue = parseInt(data.voteValue);
  
  for (var i = 2; i <= lastRow; i++) {
    if (sheet.getRange(i, 1).getValue() == option) {
      var currentValue = parseInt(sheet.getRange(i, 2).getValue());
      if (currentValue + voteValue >= 0) {
        sheet.getRange(i, 2).setValue(currentValue + voteValue);
      }
      break;
    }
  }
  
  return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
}

function getSurveyResults() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var results = [];
  
  for (var i = 2; i <= lastRow; i++) {
    var option = sheet.getRange(i, 1).getValue();
    var count = sheet.getRange(i, 2).getValue();
    results.push({ option: option, count: count });
  }

  console.log(JSON.stringify(results));
  return JSON.stringify(results);
}

function doGet() {
  var res = getSurveyResults();
  return ContentService.createTextOutput(res)
    .setMimeType(ContentService.MimeType.JSON);
}
```