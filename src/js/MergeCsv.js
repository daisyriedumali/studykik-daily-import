import React, { Component } from 'react';
import csv from 'jquery-csv'

class MergeCsv extends Component {
	constructor(props) {
        super(props);

        this.state = {
        	todayDate: null,
        	dateUseAsNow: "2020-01-23",
            cpqCSV: null,
            pacDailyCSV: null,
            isReadyToProces: false,
            smartlyAPIToken: '861fe5f87ac243bd50f11e79c09dbed46d542219',
            studykikAuth: 'FMsD7Sni8o44HwIHyZVDCjuDsEdzabBVgbxe59ktlPcrE3ZytUa1leFni1NzZHio',
            notFoundLength: 0,
            tempNotFoundLength: 0
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

         	if(name === 'cpqCSV'){
         		data[0].push('newSignUp');
          		data[0].push('sourceName');
          		data[0].push('isMediaTracking');
          		data[0].push('tierNumber');
          		data[0].push('sponsor');

          		//_this.finalizeMergedCSVFile(data);
          	}
         	_this.state[name] = data;

	        if(_this.state.cpqCSV != null && _this.state.pacDailyCSV != null)
	          	_this.setState({isReadyToProces: true});
        }
	}

	startMergingProcess = () => {
		var _this = this;
		
		var header = this.state.cpqCSV[0];

		var cpqCSV = this.state.cpqCSV;
		cpqCSV.shift();
		
		var pacDailyCSV = this.state.pacDailyCSV;
		pacDailyCSV.shift();

		var ctr = 0;
		var matchedStudyIDs = [];
		cpqCSV.forEach(cpqEl => {
			var tempStudyID = cpqEl[3];
			var tempIndication = cpqEl[8];

			var matchFound = pacDailyCSV.filter(function(pacEl){
				return (pacEl[0] == tempStudyID && pacEl[2] == tempIndication);
			});

			if(matchFound.length) { //FOUND
				ctr+=1;
				var sum = 0;
				for (var i = matchFound.length - 1; i >= 0; i--) {
					sum += parseInt(matchFound[i][1]);
				};
				matchedStudyIDs.push(matchFound[0][0]);

				matchFound = ['', sum, '', matchFound[0][3], matchFound[0][4], matchFound[0][5], matchFound[0][6]];
			} else { //NOT FOUND
				matchFound = ['', 0, '', '', '', '', '', ''];
			}
    		
    		cpqEl.push(matchFound[1]);
    		cpqEl.push(matchFound[3]);
    		cpqEl.push(matchFound[4]);
    		cpqEl.push(matchFound[5]);
    		cpqEl.push(matchFound[6]);
		});
		
		cpqCSV.unshift(header);

		console.log('total matchFound: '+ctr);
		this.processNotFound(matchedStudyIDs);

		
		//this.finalizeMergedCSVFile(cpqCSV);
	}

	processNotFound = (matchedStudyIDs) => {
		var notFound = [];
		for(var i=0; i<this.state.pacDailyCSV.length; i++) {
			var pacEl = this.state.pacDailyCSV[i];
			var tempStudyID = pacEl[0];
			var matchFound = matchedStudyIDs.find(function(el){
				return (el == tempStudyID);
			});
			if(matchFound == undefined) {
				notFound.push(pacEl);
			}
		}
		this.state.notFoundLength = notFound.length;
		console.log(notFound);
		console.log('total notFound: ' +this.state.notFoundLength);
		
		var reqCtr = 0;
		for(var i=0; i<this.state.notFoundLength; i++) {
			var newCSVValue = [];
			var _tempNotFound = notFound[i];
			this.sendRequest(_tempNotFound);
		}

		// this.state.cpqCSV.push()
	}

	sendRequest = (tempNotFound, callback) => {
		var studyID = tempNotFound[0];
		var url = "https://api.studykik.com/api/v1/studies/"+studyID+"?filter={%22include%22:[{%22relation%22:%22campaigns%22,%22scope%22:{%22order%22:%22orderNumber%20DESC%22}},{%22relation%22:%22protocol%22},{%22relation%22:%22site%22},{%22relation%22:%22sources%22},{%22relation%22:%22sponsor%22},{%22relation%22:%22indication%22}]}";
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
	      		json["tempNotFound"] = tempNotFound;
	      		//callback(json);
      			var newCSVValue = [];

	            var campaign = json.campaigns && json.campaigns.length ? json.campaigns[0] : "";
	            newCSVValue[0] = campaign.id;
	            newCSVValue[1] = this.getDateToUTCSK(campaign.startDate);
	            newCSVValue[2] = this.getDateToUTCSK(campaign.endDate);
	            newCSVValue[3] = json.id;
	            newCSVValue[4] = json.site_id;
	            newCSVValue[5] = campaign.central ? "TRUE" : "FALSE";
	            newCSVValue[6] = campaign.patientQualificationSuite ? "TRUE" : "FALSE";
	            newCSVValue[7] = this.getLevel(campaign.level_id);
	            newCSVValue[8] = json.indication.name;
	            newCSVValue[9] = json.protocol.number;
	            newCSVValue[10] = json.site.name;
	            newCSVValue[11] = json.site.city;
	            newCSVValue[12] = json.site.state;
	            newCSVValue[13] = json.site.zip;

	            newCSVValue[14] = tempNotFound[1];
	            newCSVValue[15] = 0;
	            newCSVValue[16] = 0;

	            newCSVValue[17] = this.state.dateUseAsNow;
	            newCSVValue[18] = campaign.startDate
	            newCSVValue[19] = campaign.endDate
	            newCSVValue[20] = 0;

	            newCSVValue[21] = tempNotFound[1];
	            newCSVValue[22] = 0;
	            newCSVValue[23] = 0;

	            newCSVValue[24] = tempNotFound[1];
	            newCSVValue[25] = 0;
	            newCSVValue[26] = 0;
	            newCSVValue[27] = 0;
	            newCSVValue[28] = 0;
	            newCSVValue[29] = 0;
	            newCSVValue[30] = 0;
	            newCSVValue[31] = 0;

	            newCSVValue[32] = tempNotFound[1];
	            newCSVValue[33] = 0;
	            newCSVValue[34] = 0;
	            newCSVValue[35] = 0;
	            newCSVValue[36] = 0;
	            newCSVValue[37] = 0;
	            newCSVValue[38] = 0;
	            newCSVValue[39] = 0;

				newCSVValue[40] = tempNotFound[1];
	            newCSVValue[41] = tempNotFound[3];
	            newCSVValue[42] = tempNotFound[4];
	            newCSVValue[43] = tempNotFound[5];
	            newCSVValue[44] = tempNotFound[6];     

	            //console.log('end here...');
				//console.log(newCSVValue);
				this.state.cpqCSV.push(newCSVValue);
				this.state.tempNotFoundLength = this.state.tempNotFoundLength+1; 
				if(this.state.tempNotFoundLength == this.state.notFoundLength)
					console.log(this.state.cpqCSV);
				/*console.log(reqCtr);
				if(reqCtr+1 == this.state.notFoundLength) {
					console.log(this.state.cpqCSV);
					this.finalizeMergedCSVFile(this.state.cpqCSV);
				}*/
		})
		.catch((error) => {
			console.log(error);
		});
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
		this.finalizeMergedCSVFile(this.state.cpqCSV);
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
            	<p>Change the value of studykik auth and daily date before merging the files</p>

            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select campaign_patient_quality CSV</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('cpqCSV')} style={{'float':'left'}}/>
            	</div>
            	<br/>
            	<br/>
            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select pac_daily_report CSV</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('pacDailyCSV')} style={{'float':'left'}}/>
            	</div>
            	<br/>
            	<br/>
            	<br/>
            	{(this.state.isReadyToProces) && <button onClick={this.startMergingProcess}>Start Merging!</button>}
            	<br/>
            	<br/>
            	<button onClick={this.saveToCSV}>Click When Done Fetching!</button>
            </div>
        );
    }
}

export default MergeCsv;