import React, { Component } from 'react';
import csv from 'jquery-csv'

class MergeCraigslistAdspent extends Component {
	constructor(props) {
        super(props);

        this.state = {
        	todayDate: null,
        	dateUseAsNow: "2020-01-22",
            cpqCSV: null,
            craigslistAdSpentCSV: null
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
         		data[0].push('sponsorId');
                data[0].push('croId');
                data[0].push('cro');
                data[0].push('disposition');
                data[0].push('dispositionTotal');
                data[0].push('clAdspent');
          	}
         	_this.state[name] = data;

	        if(_this.state.cpqCSV != null && _this.state.craigslistAdSpentCSV != null)
	          	_this.setState({isReadyToProces: true});
        }
	}

	startMergingProcess = () => {
		var _this = this;
		
		var header = this.state.cpqCSV[0];

		var cpqCSV = this.state.cpqCSV;
		cpqCSV.shift();
		
		var craigslistAdSpentCSV = this.state.craigslistAdSpentCSV;
		craigslistAdSpentCSV.shift();
		craigslistAdSpentCSV.shift();
		console.log(craigslistAdSpentCSV);
		var dateUseAsNow = new Date(this.state.dateUseAsNow);
		//clean craigslistAdSpentCSV data
		var filteredCraigslistAdSpentCSV = craigslistAdSpentCSV.filter(function(el){
			var startDate = new Date(el[4]); //cl start date
			var endDate = new Date(el[5]); //cl end date
			//var endDate = new Date((new Date(el[5])).valueOf() - 1000*60*60*24);

			return (startDate <= dateUseAsNow && endDate >= dateUseAsNow);
		});
		console.log(filteredCraigslistAdSpentCSV);
		var temparr = [];
		for(var i=0; i<this.state.cpqCSV.length; i++) {
			var temp = this.state.cpqCSV[i];
			var tempCLSpent = filteredCraigslistAdSpentCSV.filter(function(el) {
				return (el[1] == temp[3]);
			});

			var spent = 0;
			if(tempCLSpent.length) {
				tempCLSpent.forEach(function(el) {
					var number = Number(el[6].replace(/[^0-9.-]+/g,"")); //DONE CHANGING THIS TO TOTAL SPENT! - COL 6
				  	spent += number;
				});
				temparr.push(this.state.cpqCSV[i]);
			}

			this.state.cpqCSV[i][50] = spent;
		}
		console.log('with spent');
		console.log(temparr);
		var nomatch = filteredCraigslistAdSpentCSV.filter(function(el) {
			var f = temparr.find(function(t){
				return (t[3] == el[1]);
			});

			return !(f);
		});

		console.log('did not match');
		console.log(nomatch);

		this.state.cpqCSV.unshift(header);
		this.finalizeMergedCSVFile(this.state.cpqCSV);
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
		          Merging of campaign_patient_quality MERGEDFINAL2! and Craigslist Ad Spent
		        </h2>

            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select campaign_patient_quality MERGEDFINAL2! CSV</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('cpqCSV')} style={{'float':'left'}}/>
            	</div>
            	<br/>
            	<br/>
            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select Craigslist Ad Spent CSV</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('craigslistAdSpentCSV')} style={{'float':'left'}}/>
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

export default MergeCraigslistAdspent;