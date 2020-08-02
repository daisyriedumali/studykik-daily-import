import React, { Component } from 'react';
import csv from 'jquery-csv'

class CheckKenshooSpentFromMerge4 extends Component {
	constructor(props) {
        super(props);

        this.state = {
        	todayDate: null,
            
            kenshooSpent: null,
            cpqMerge4: null,
			noMatchCPQ:[],

            isReadyToProces: false,
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

         	_this.state[name] = data;

	        if(_this.state.cpqMerge4 != null)
	          	_this.setState({isReadyToProces: true});
        }
	}

	startProcessing = () => {
		this.state.noMatchCPQ = [];
		for(var i=0; i<this.state.kenshooSpent.length; i++){
			var tempLine = this.state.kenshooSpent[i];

			var findCL = this.state.cpqMerge4.find(function(el){
				return (tempLine[2].includes(el[3]));
			});

			if(findCL == undefined && parseFloat(tempLine[4]) > 0) {
				this.state.noMatchCPQ.push(tempLine);
			}
		}

		console.log('NO MATCH CPQ STUDIES');
		console.log(this.state.noMatchCPQ);

		//this.state.studyPatientsByMedia = this.state.studyPatientsByMedia.concat(totalNewCLPush);
		
		//this.finalizeMergedCSVFile(noMatchCPQ);
	}

	saveToCSV = () => {
		this.finalizeMergedCSVFile(this.state.noMatchCPQ);
	}

	finalizeMergedCSVFile = (file) => {
		console.log(file);
		var rawFile = csv.fromArrays(file);
		var csvContent = "data:text/csv;charset=UTF-8," 
						 + csv.fromArrays(file);
		console.log('csvContent');
		console.log(csvContent);
  //   	var encodedUri = encodeURI(csvContent);
		// console.log('encodedUri');
  //   	console.log(encodedUri);
		// var link = document.createElement("a");
		// link.setAttribute("href", encodedUri);
		// link.setAttribute("download", "my_data.csv");
		// document.body.appendChild(link);
		// link.click();

		var link = document.createElement("a");
		link.href = URL.createObjectURL(new Blob([rawFile], {
	      type: 'text/csv'
	    }));
	    link.setAttribute('download', "my_data.csv");
	    document.body.appendChild(link);
	    link.click();
	}

	render() {
        return (
            <div className="process-csv" style={{'textAlign':'left'}}>
            	<hr/>

            	<h2>
		          Check Discrepancies in Kenshoo Spent
		        </h2>
            	<br/>
            	<br/>
            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select kenshooSpent CSV</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('kenshooSpent')} style={{'float':'left'}}/>
            	</div>
            	<br/>
            	<br/>
            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select CPQ Merge4 CSV</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('cpqMerge4')} style={{'float':'left'}}/>
            	</div>

            	<br/>
            	<br/>
            	<br/>
            	{(this.state.isReadyToProces) && <button onClick={this.startProcessing}>Start Processing CL Studies!</button>}
            	<br/>
            	<br/>
            	<button onClick={this.saveToCSV}>Click When Done Fetching!</button>
            </div>
        );
    }
}

export default CheckKenshooSpentFromMerge4;