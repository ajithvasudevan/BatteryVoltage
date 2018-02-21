var SCRIPT_PROP = PropertiesService.getScriptProperties(); 
function doGet(e){
  return handleResponse(e);
}

function doPost(e){
  return handleResponse(e);
}

function handleResponse(e) {
  var lock = LockService.getPublicLock();
  lock.waitLock(20000);
  try {
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(SHEET_NAME);
    var chart = sheet.getCharts()[0];
    var chart2 = sheet.getCharts()[1];
    var chart3 = sheet.getCharts()[2];
    var chart4 = sheet.getCharts()[3];
    var range = sheet.getRange("B1:C11");    
    var range2 = sheet.getRange("B1:C121");    
    var range3 = sheet.getRange("B1:C2881");    
    var range4 = sheet.getRange("B1:C40321");    
    var headRow = e.parameter.header_row || 1;
    var headers = sheet.getRange(1, 1, 1, 3).getValues()[0];
    if(e.parameter["cf"]) {
      var y = Number(e.parameter["y"]);
      var t = Number(e.parameter["t"]);
      var result = getCF(sheet, t, y);
      return ContentService
          .createTextOutput(JSON.stringify(result))
          .setMimeType(ContentService.MimeType.JSON);
    }
    var row = []; 
    for (i in headers){
      var dt = new Date();
      if (headers[i] == "Timestamp"){ 
        row.push(dt);
      } else if(headers[i] == "Unixtime") {
        row.push(dt.getTime()/1000);
      } else if(headers[i] == "Time") {
        row.push(dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds());
      } else if(headers[i] == "Voltage") { 
        row.push(e.parameter["Voltage"]);
      }
    }
    var cf = getCF(sheet, 5, 11.5);
    var chg = "";
    if(cf.m < 0 || (cf.m > 0 && Number(e.parameter["Voltage"]) > 13.2)) chg = "  (Now Charging)";
    else chg = "  (Now discharging)";
    
    sheet.insertRows(2);
    sheet.getRange(2, 1, 1, row.length).setValues([row]);
    chart = chart.modify()
     .setOption('title', 'Voltage vs. Time  -  last 5 minutes' + chg)
     .addRange(range)
     .build();
    chart2 = chart2.modify()
     .setOption('title', 'Voltage vs. Time  -  last hour' + chg)
     .addRange(range2)
     .build();
    chart3 = chart3.modify()
     .setOption('title', 'Voltage vs. Time  -  last 24 hours' + chg)
     .addRange(range3)
     .build();
    chart4 = chart4.modify()
     .setOption('title', 'Voltage vs. Time  -  last 2 weeks' + chg)
     .addRange(range4)
     .build();
    sheet.updateChart(chart);
    sheet.updateChart(chart2);
    sheet.updateChart(chart3);
    sheet.updateChart(chart4);
    return ContentService.createTextOutput(JSON.stringify({"result":"success", "row": row})).setMimeType(ContentService.MimeType.JSON);
  } catch(e){
    // if error return this
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": e})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getCF(sht, t, y) {
  var noOfPoints = t * 2;
  var crange = sht.getRange("C2:C" + (noOfPoints + 1));   
  var values = crange.getValues();
  var values2 = [];
  values.forEach(function(item) {values2.push(item[0]);});
  var result = cf(values2, 0.5, y);
  return result;
}
function LineFitter()
{
    this.count = 0;
    this.sumX = 0;
    this.sumX2 = 0;
    this.sumXY = 0;
    this.sumY = 0;
}
LineFitter.prototype = {
    'add': function(x, y)
    {
        this.count++;
        this.sumX += x;
        this.sumX2 += x*x;
        this.sumXY += x*y;
        this.sumY += y;
    },
    'project': function(x)
    {
        var det = this.count * this.sumX2 - this.sumX * this.sumX;
        var offset = (this.sumX2 * this.sumY - this.sumX * this.sumXY) / det;
        var scale = (this.count * this.sumXY - this.sumX * this.sumY) / det;
        return offset + x * scale;
    },
    'project2': function()
    {
        var det = this.count * this.sumX2 - this.sumX * this.sumX;
        var offset = (this.sumX2 * this.sumY - this.sumX * this.sumXY) / det;
        var scale = (this.count * this.sumXY - this.sumX * this.sumY) / det;
        return {"m": scale, "c":offset};
    }
};

function linearProject(data, x)
{
    var fitter = new LineFitter();
    for (var i = 0; i < data.length; i++)
    {
        fitter.add(i, data[i]);
    }
    return fitter.project(x);
}

function cf(data, interval, y)
{
    var fitter = new LineFitter();
    for (var i = 0; i < data.length; i++)
    {
        fitter.add(i*interval, data[i]);
    }
    var res = fitter.project2();
    res["x"] = (y - res.c)/res.m;
    return res;
}

function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", doc.getId());
}

function getDayOfYear(now) {
  var start = new Date(now.getFullYear(), 0, 0);
  var diff = now - start;
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  return day;
}
