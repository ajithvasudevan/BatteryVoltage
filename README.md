## Battery Voltage

### Intro
This script enables a live view of a UPS battery voltage-status in the form of 4 charts which plot the **voltage** values vs **time** for the *last 5 minutes, last hour, last day* and *last two weeks*. It also predicts the time to discharge the battery to a specified voltage.
For this to work, this Google Apps Script needs to be deployed and voltage data needs to be posted to the deployed app via a http request. How the voltage is measured and posted from your premises to the Apps Script web-app is beyond the scope of this Github project. 

### Setup
* First, login to your Google account and open an empty Google Spreadsheet.
* In the spreadsheet, rename the current sheet to "Batt2" 
* Add the following strings as headings in the first row of the sheet, starting at cell A1:
-- **Timestamp**, **Time** and **Voltage** .
* Create 4 charts in the spreadsheet with in following order and Data Ranges:
```
B1:C11     -- for chart showing data for last 5 minutes
B1:C121    -- for chart showing data for last hour   
B1:C2881   -- for chart showing data for last day     
B1:C40321  -- for chart showing data for last 2 weeks    
```
* The chart type should be Line, smooth. The horizontal axis needs to be setup with the *Time* column data, and the vertical axis should be setup with the *Voltage" column data. Also, select the *Treat labels a Text* option for the horizontal axis.

* Go to *Tools --> Script Editor...* option of the spreadsheet to open the web-based IDE for editing the Apps Script and paste the code from BatteryVoltage.js into the Editor window. 

* Publish the script using the *Publish --> Deploy as Web-App...* option of the Script Editor. 

* During publishing, Google provides a web-app URL. This is the HTTP end-point where a parameter "Voltage" can be posted. Note this URL. This URL looks like https://script.google.com/macros/s/<very_long_guid>/exec

### Working
Upon posting a Voltage value to the web-app URL, using a URL of the form:
```
https://script.google.com/macros/s/<very_long_guid>/exec?Voltage=11.875
```
the script receives the parameter, calculates the current date-time as a "Timestamp" value, and the current time as a "Time" value, then **inserts** the 3 values - Timestamp, Time, and Voltage - into the Spreadsheet, as the **second** row.

Every time a Voltage value is posted to this URL, a row gets inserted at the same place - the second row. This means the data table grows in reverse (descending) order of time. The order is reversed so that the charts with the fixed data ranges will keep showing the graph for the last "n" data points. 

### Time to discharge prediction
The script also allows one to predict the time in minutes (from "now") for the battery to discharge to a specified voltage. For this, call the URL of the form:
```
https://script.google.com/macros/s/<very_long_guid>/exec?cf=1&y=10.8&t=15
```
where - 
```
cf -- tells the script that this request is for prediction and not for posting voltage data
y  -- voltage to discharge to
t  -- Time in min from now, counting backwards, for regression analysis. i.e., if you specify t=15, then the last 15 minutes' voltage data would be used to extrapolate and find out the time for the battery to discharge to 'y' volts.
```
The response to the call to the above URL is a JSON of the form:
```
{ m: -0.010522, c: 11.82451, x: 125.787 }
```
where 'x' is the predicted time in minutes.

'm' and 'c' are constants in the linear equation 
```
y = m*x + c
```
This is the equation of the "average" line or tangent to the Voltage vs Time curve, at the current time.


 (See https://developers.google.com/apps-script/guides/sheets to know more about Google Apps Script)
