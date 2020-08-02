import React, { Component } from 'react';
import csv from 'jquery-csv'

class PatientMediaTracking extends Component {
	constructor(props) {
        super(props);

        this.state = {
        	todayDate: null,
        	dateUseAsNow: "2020-01-23",
        	studyListCSV: null,
        	patientMediaTrackingHistoryCSV: null,
        	patientMediaTrackedToday: [],
            isReadyToProces: false,
            isSendingRequests: false,
            studykikAuth: 'nzBCOsLf2RmAG2hARrNroxwNnW2M5p7VAPm32CsEVTdB8jGD8m0Av9OvYeIuUock',
        }
    }

    componentDidMount() {
    	var yesterday = new Date((new Date()).valueOf() - 1000*60*60*24);
        this.state.todayDate = this.formatDate(yesterday);
    }

    formatDate(d) {
    	var day = d.getUTCDate() > 9 ? d.getUTCDate() : '0'+d.getUTCDate();
    	var month = d.getUTCMonth()+1 > 9 ? (d.getUTCMonth()+1) : '0'+(d.getUTCMonth()+1);
    	return d.getUTCFullYear() + '-' + month + '-' + day;
    }

	getFile = name => e => {
		var _this = this;

		var file = e.target.files[0];
		var reader = new FileReader();
        reader.readAsText(file);

        reader.onload = function(event) {
          var _csv = event.target.result;
          var data = csv.toArrays(_csv);
          	//data.shift(); //remove header
         	_this.state[name] = data;
         	if(_this.state.studyListCSV != null && _this.state.patientMediaTrackingHistoryCSV != null)
	        _this.setState({isReadyToProces: true});
        }
	}

	startStudyPatientTrackingProcess = () => {
		console.log('called startStudyPatientTrackingProcess...');
        this.state.studyListCSV.shift(); //remove header

        this.state.isSendingRequests = true;

        var _this = this;
        var i=0;

        this.state.intervalId = setInterval(function() {
            console.log('sending request for study at index '+i);
            
            _this.sendRequestStudyPatients(i);
            i++;
            
            if(i == _this.state.studyListCSV.length) {
                console.log('cleared interval');
                _this.state.isSendingRequests = false;
                clearInterval(_this.state.intervalId);
            }
        }, 500);
        
        console.log("done calling startStudyPatientTrackingProcess");
	}

	sendRequestStudyPatients = (index) => {
		var studyID = this.state.studyListCSV[index][1];
		var campaignID = this.state.studyListCSV[index][0];
		var siteID = this.state.studyListCSV[index][2];
		var url = "https://api.studykik.com/api/v1/studies/"+studyID+"/patients?campaignId="+campaignID;

		fetch(url, {
			headers: {
		      "Accept": "application/json",
		      "Access-Control-Allow-Origin": "*",
		      "Access-Control-Allow-Headers": "*",
		      "Authorization": this.state.studykikAuth
		    },

            credentials: "include"
		})
    	.then(response => response.json())
      	.then(json => {
      			for(var i=0; i<json.length; i++) {
      				var _json = json[i];
      				var categoryID = _json.id;

      				for (var j = 0; j < _json.patients.length; j++) {
      					var patient = _json.patients[j].patient;
      					var patientID = patient.id;
      					var campaignID = patient.campaign_id;
      					var siteID = patient.site_id;

      					//ADD DATE CHECKER CONDITION HERE!
      					
      					this.state.patientMediaTrackedToday.push(
      						[campaignID,
      						studyID,
      						siteID,
      						this.state.dateUseAsNow,
      						patientID,
							categoryID]
      					);
      				};
      			}

      			console.log('done fetched sendRequestStudyPatients for index '+index);
      			//console.log(this.state.patientMediaTrackedToday);
      			if(index == this.state.studyListCSV.length-1)
      				this.startStudyDispositionTrackingProcess();
		})
		.catch((error) => {
			console.log(error);
		});
	}

	startStudyDispositionTrackingProcess = () => {
		//this.state.studyListCSV.shift(); //remove header
		console.log('called startStudyDispositionTrackingProcess...');

        this.state.isSendingRequests = true;

        var _this = this;
        var i=0;

        this.state.intervalId = setInterval(function() {
            console.log('sending request for study at index '+i);
            
            _this.sendRequestStudyDisposition(i);
            i++;
            
            if(i == _this.state.studyListCSV.length) {
                console.log('cleared interval');
                _this.state.isSendingRequests = false;
                clearInterval(_this.state.intervalId);
            }
        }, 500);
        
        console.log("done calling startStudyDispositionTrackingProcess");
	}

	sendRequestStudyDisposition = (index) => {
		var studyID = this.state.studyListCSV[index][1];
		var url = "https://api.studykik.com/api/v1/studies/"+studyID+"/dispositions";

		fetch(url, {
			headers: {
		      "Accept": "application/json",
		      "Access-Control-Allow-Origin": "*",
		      "Access-Control-Allow-Headers": "*",
		      "Authorization": this.state.studykikAuth
		    },

            credentials: "include"
		})
    	.then(response => response.json())
      	.then(json => {
      			for(var i=0; i<this.state.patientMediaTrackedToday.length; i++) {
      				var tempPatient = this.state.patientMediaTrackedToday[i];
      				if(tempPatient[1] == studyID) {
	      				var findDisposition = json.find(function(el) {
	      					return (el.patient_id == tempPatient[4]);
	      				});
	      				if(findDisposition) {
	      					//var recentUpdate = findDisposition.created.substr(0,10) == '2020-01-16' ? true : false;
	      					//this.state.patientMediaTrackingHistoryCSV[i][6] = (recentUpdate) ? '' : findDisposition.dispositionKey;

	      					this.state.patientMediaTrackedToday[i][6] = findDisposition.dispositionKey;
	      				} else {
	      					this.state.patientMediaTrackedToday[i][6] = '';
	      				}
	      			}	
      			}

      			console.log('done fetched sendRequestStudyDisposition for index '+index);
      			if(index == this.state.studyListCSV.length-1)
      				this.finalizeMergedCSVFile(this.state.patientMediaTrackedToday);
		})
		.catch((error) => {
			console.log(error);
		});
	}

	startPatientMediaTrackingProcess = () => {
		console.log('called startPatientMediaTrackingProcess...');
        this.state.isSendingRequests = true;

        var _this = this;
        var i=0;

        this.state.intervalId = setInterval(function() {
            console.log('sending request for study/patient at index '+i);
            
            _this.sendRequestPatientMediaTracking(i);
            i++;
            
            if(i == _this.state.patientMediaTrackingHistoryCSV.length) {
                console.log('cleared interval');
                _this.state.isSendingRequests = false;
                clearInterval(_this.state.intervalId);
            }
        }, 300);
        
        console.log("done calling startPatientMediaTrackingProcess");
	}

	sendRequestPatientMediaTracking = (index, withDispo) => {
		console.log('index '+index);
		console.log('>. '+this.state.patientMediaTrackingHistoryCSV[index]);
		//return '';
		var patientID = this.state.patientMediaTrackingHistoryCSV[index][4];

		var url = "https://api.studykik.com/api/v1/patients/"+patientID+"?filter=%7B%22include%22%3A[%22studySource%22,%22source%22]%7D";

		fetch(url, {
			headers: {
		      "Accept": "application/json",
		      "Access-Control-Allow-Origin": "*",
		      "Access-Control-Allow-Headers": "*",
		      "Authorization": this.state.studykikAuth
		    },

            credentials: "include"
		})
    	.then(response => response.json())
      	.then(json => {
      			var studySource = json.studySource.name == null ? 'fb' : json.studySource.name;
      			var temp = this.state.patientMediaTrackingHistoryCSV[index];
      			if(withDispo) {
      				var tempDispo = temp[6]; //move dispo to column 7
      				temp[7] = tempDispo;
      				temp[6] = studySource;
      			} else {
	      			temp[6] = studySource;
	      		}
      			this.state.patientMediaTrackingHistoryCSV[index] = temp;

      			console.log('done fetched sendRequestPatientMediaTracking for index '+index);
      			//console.log(this.state.patientMediaTrackedToday);
		})
		.catch((error) => {
			console.log(error);
		});
	}

	startAccumulatingPatientMediaTrackingProcess = () => {
		var accumulated = [];
		this.state.studyListCSV.shift();

		for(var i=0; i<this.state.studyListCSV.length; i++) {
			var studyID = this.state.studyListCSV[i][1];
			var campaignID = this.state.studyListCSV[i][0];
			var tempAcc = [
				campaignID,
				studyID,
				this.state.studyListCSV[i][2],
				this.state.dateUseAsNow,
				0,0,0,0,0,0,0,0]; //row for NA

			var filteredPatients = this.state.patientMediaTrackingHistoryCSV.filter(function(el){
				return el[0] == campaignID && el[1] == studyID;
			});

			//cl media name
			for(var j=1; j<=8; j++) {
				var filteredMedia = filteredPatients.filter(function(el){
					return el[5] == j && el[6] == 'cl';
				});
				tempAcc.push(filteredMedia.length);
			}

			//fb media name
			for(var j=1; j<=8; j++) {
				var filteredMedia = filteredPatients.filter(function(el){
					return el[5] == j && el[6] == 'fb';
				});
				tempAcc.push(filteredMedia.length);
			}

			//cl disposition
			for(var j=1; j<=4; j++) {
				var filteredMedia = filteredPatients.filter(function(el){
					return (el[7] == j && el[6] == 'cl');
				});
				tempAcc.push(filteredMedia.length);
			}

			//fb disposition
			for(var j=1; j<=4; j++) {
				var filteredMedia = filteredPatients.filter(function(el){
					return (el[7] == j && el[6] == 'fb');
				});
				tempAcc.push(filteredMedia.length);
			}

			//fg media name
			for(var j=1; j<=8; j++) {
				var filteredMedia = filteredPatients.filter(function(el){
					return el[5] == j && el[6] == 'fg';
				});
				tempAcc.push(filteredMedia.length);
			}

			//fg disposition
			for(var j=1; j<=4; j++) {
				var filteredMedia = filteredPatients.filter(function(el){
					return (el[7] == j && el[6] == 'fg');
				});
				tempAcc.push(filteredMedia.length);
			}

			accumulated.push(tempAcc);
		}

		this.finalizeMergedCSVFile(accumulated);
	}

	startMergePatientsMediaTrackNoDataYet = () => {
		//studyListCSV -- with media tracked
		//patientMediaTrackingHistoryCSV
		var tempPatients = [];
		for(var i=0; i<this.state.patientMediaTrackingHistoryCSV.length; i++) {
			var temp = this.state.patientMediaTrackingHistoryCSV[i];

			var filteredMedia = this.state.studyListCSV.filter(function(el){
				return (el[0] == temp[0] && //campaignID
				        el[1] == temp[1] && //studyID
				        el[2] == temp[2] && //siteID
				        el[4] == temp[4]); //patientID
			});

			if(filteredMedia.length) {
				var tempDispo = this.state.patientMediaTrackingHistoryCSV[i][6]
				this.state.patientMediaTrackingHistoryCSV[i][7] = tempDispo; //move dispo value to column 7
				this.state.patientMediaTrackingHistoryCSV[i][6] = filteredMedia[0][6];
			} else {
				//needs media tracking fetched from api
				var _t = [...this.state.patientMediaTrackingHistoryCSV[i]];
				_t[7] = i; //index;
			 	tempPatients.push(_t);
			}
		}
		console.log(tempPatients);
		console.log(this.state.patientMediaTrackingHistoryCSV);
		this.startMergePatientsMediaTrackWithData(tempPatients);
	}

	startMergePatientsMediaTrackWithData = (tempPatients) => {
		console.log('called startMergePatientsMediaTrackWithData...');
        this.state.isSendingRequests = true;

        var _this = this;
        var i=0;

        this.state.intervalId = setInterval(function() {
            console.log('sending request for study/patient at index '+i);
            
            //if(_this.state.patientMediaTrackingHistoryCSV[i][6] == '' || _this.state.patientMediaTrackingHistoryCSV[i][6] == null)
            _this.sendRequestPatientMediaTracking(tempPatients[i][7], true);
            
            i++;
            
            if(i == tempPatients.length) {
                console.log('cleared interval');
                _this.state.isSendingRequests = false;
                clearInterval(_this.state.intervalId);
            }
        }, 300);
        
        console.log("done calling startMergePatientsMediaTrackWithData");
	}

	startAccumulatingTwoBeforeAfterPatientMT = () => {
		//studyListCSV -- before
		//patientMediaTrackingHistoryCSV -- today
		var newArray = [];
		for(var i=0; i<this.state.patientMediaTrackingHistoryCSV.length; i++) {
			var temp = this.state.patientMediaTrackingHistoryCSV[i];

			//patient found but patient category or patient disposition column moved
			var filteredMedia = this.state.studyListCSV.filter(function(el){
				return (el[0] == temp[0] && //campaignID
				        el[1] == temp[1] && //studyID
				        el[2] == temp[2] && //siteID
				        el[4] == temp[4] && //patientID
				        (el[5] != temp[5] || //patientCategory
				        el[7] != temp[7]));  //patientDisposition
			});

			//patient is present on the list
			var isPatientNew = this.state.studyListCSV.find(function(el){
				return (el[4] == temp[4]);
			});

			if(filteredMedia.length) {
				temp[5] = (filteredMedia[0][5] == temp[5]) ? "" : temp[5]; //override patientCategory if previous day data didnt update
				temp[7] = (filteredMedia[0][7] == temp[7]) ? "" : temp[7]; //override patientDisposition if previous day data didnt update
				newArray.push(temp);
			}
			else if(isPatientNew == undefined) {
				newArray.push(temp);
			}
		}

		this.finalizeMergedCSVFile(newArray);
	}

	getLevel = (levelID) => {
		var levels = [
			"Bronze",
			"Silver",
			"Gold",
			"Platinum",
			"Diamond",
			"Ruby",
			"Platinum Plus",
			"Diamond Plus",
			"Ruby Plus"
		];

		return levels[levelID-1];
	}

	getDateToUTCSK = (date) => {
		var dayName = [
			"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
		];

		var monthName = [
			"Jan", "Feb", "Mar", "Apr", "May", "June", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
		];

		var _date = new Date(date);
		var day = _date.getUTCDate();
		var dayVal = dayName[_date.getUTCDay()];
		var monVal = monthName[_date.getUTCMonth()];
		var year = _date.getUTCFullYear();

		return dayVal + " " + monVal + " " + day + " " + year + " 00:00:00 GMT+0000 (UTC)";
	}

	saveToCSV = () => {
		//console.log(file);
		//if(file == 'patientMediaTrackedToday')
		//this.finalizeMergedCSVFile(this.state.patientMediaTrackedToday); //startStudyPatientTrackingProcess
		//this.finalizeMergedCSVFile(this.state.cpqCSV);

		this.finalizeMergedCSVFile(this.state.patientMediaTrackingHistoryCSV); //startMergePatientsMediaTrackNoDataYet
	}

	finalizeMergedCSVFile = (cpqCSV) => {
		console.log(cpqCSV);
		var csvContent = "data:text/csv;charset=utf-8," 
						 + csv.fromArrays(cpqCSV);

    	var encodedUri = encodeURI(csvContent);
		var link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", "my_data.csv");
		document.body.appendChild(link);
		link.click();
	}

	render() {
        return (
            <div className="process-csv" style={{'textAlign':'left'}}>
            	<hr/>

            	<h2>
		          Merging of campaign_patient_quality and pac_daily_report
		        </h2>
            	<p>Change the value of studykik auth and daily date!</p>
            	<p>Date: {this.state.dateUseAsNow}</p>

            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select CSV for list of studies to track:</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('studyListCSV')} style={{'float':'left'}}/>
            	</div>
            	<br/>
            	<br/>
            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select CSV with the patient media tracking history:</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('patientMediaTrackingHistoryCSV')} style={{'float':'left'}}/>
            	</div>
            	<br/>
            	<br/>
            	<br/>
            	{(this.state.isReadyToProces) && <button onClick={this.startStudyPatientTrackingProcess}>1 Start Study-Patient Tracking!</button>}
            	<br/>
            	{(this.state.isReadyToProces) && <button onClick={this.startPatientMediaTrackingProcess}>Start Patient Media Tracking!</button>}
            	<br/>
            	{(this.state.isReadyToProces) && <button onClick={this.startAccumulatingPatientMediaTrackingProcess}>4 Start Accumulating Patient Media Tracking!</button>}
            	<br/>
            	{(this.state.isReadyToProces) && <button onClick={this.startMergePatientsMediaTrackNoDataYet}>2 Merge The Patients Media Tracking, No fetching of New Data Yet!</button>}
            	<br/>
            	{(this.state.isReadyToProces) && <button onClick={this.startAccumulatingTwoBeforeAfterPatientMT}>3 Before and Today Patient Media Accumulating!</button>}
            	<br/>
            	<button onClick={this.saveToCSV}>Click When Done Fetching!</button>
            	<br/>
            	<button onClick={this.saveToCSV}>Download with no media tracking yet!</button>
            </div>
        );
    }
}

export default PatientMediaTracking;