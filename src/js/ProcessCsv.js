import React, { Component } from 'react';
import csv from 'jquery-csv'

class ProcessCsv extends Component {
	constructor(props) {
        super(props);

        this.state = {
        	todayDate: null,
            toProcessCSV: null,
            previousCSV: null,
            isReadyToProces: false,
            smartlyAPIToken: '861fe5f87ac243bd50f11e79c09dbed46d542219'
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

         	if(name === 'toProcessCSV'){
          		data.shift();
          	}
         	_this.state[name] = data;

	        if(_this.state.toProcessCSV != null && _this.state.previousCSV != null)
	          	_this.setState({isReadyToProces: true});
        }
	}

	startCampaignPatientQualityProcess = () => {
		var _this = this;
		this.state.toProcessCSV.forEach(element => {
			var datefromparsed = this.formatDate(new Date(element[1]));
			var datetoparsed = this.formatDate(new Date(element[2]));

			_this.fetchSmartlyAdSpent(element[4], element[8], _this.state.yesterday, _this.state.yesterday);

			element.push(this.state.todayDate);
			element.push(datefromparsed);
			element.push(datetoparsed);
		});

		console.log(this.state.toProcessCSV);
	}

	fetchSmartlyAdSpent(studyID, indication, datefrom, dateto){
		var accountID = '5ced43ceed768137e47078c2'; //OTHER, TO DELETE

		var url = "https://stats-api.smartly.io/v1.2/stats";
		url = url + "?account_id=" + accountID;
		url = url + "&api_token=" + this.state.smartlyAPIToken;
		url = url + "&stats=" + datefrom + ":" + dateto;
		url = url + "&format=json&csv_col_separator=,&csv_dec_separator=.&filter_type=$and&metrics=spent&groupby=account_name&filters=";

		var filters=[{"key":"adgroup_name","op":"contains","value": studyID}];
		var urlEncode = url + encodeURIComponent(JSON.stringify(filters));  

		this.sendRequest(urlEncode, (json) => {
            console.log(json.summary.spent);
        });
	}

	sendRequest = (url, callback) => {
		fetch(url, {
			/*headers: {
		      "Accept": "application/json",
		      "Access-Control-Allow-Origin": "*",
		      "Access-Control-Allow-Headers": "*"
		    },*/

            //credentials: "include"
		})
    	.then(response => response.json())
      	.then(json => {
      		callback(json);
		})
		.catch((error) => {
			console.log(error);
		});
	}

	render() {
        return (
            <div className="process-csv">
            	<div style={{'float':'left'}}>
	            	<div>Select CSV to Process</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('toProcessCSV')}/>
            	</div>
            	<div style={{'float':'left'}}>
	            	<div>Select CSV from previous day to Process</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('previousCSV')}/>
            	</div>
            	<br/>
            	{(this.state.isReadyToProces) && <button onClick={this.startCampaignPatientQualityProcess}>Start</button>}
            </div>
        );
    }
}

export default ProcessCsv;


