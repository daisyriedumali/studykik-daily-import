import React, { Component } from 'react';
import csv from 'jquery-csv'

class TempCLSignUp extends Component {
	constructor(props) {
        super(props);

        this.state = {
        	todayDate: null,
        	dateUseAsNow: "2020-01-28",
            
            updatedStudyPatientsByMedia: [],
            studyPatientsByMedia: null,

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

	        if(_this.state.studyPatientsByMedia != null)
	          	_this.setState({isReadyToProces: true});
        }
	}

	startProcessing = () => {
		var _this = this;

		for(var i=0; i<this.state.studyPatientsByMedia.length; i++){
			var tempLine = this.state.studyPatientsByMedia[i];

			var findCL = this.state.studyPatientsByMedia.find(function(el){
				return (tempLine[0] == el[0] && tempLine[1] == el[1] && tempLine[4] == 'cl');
			});

			if(findCL == undefined) {
				var reverifyCL = this.state.updatedStudyPatientsByMedia.find(function(el){
					return (tempLine[0] == el[0] && tempLine[1] == el[1] && tempLine[4] == 'cl');
				});

				if(reverifyCL == undefined) {
					var newCLpush = [];
					newCLpush[0] = tempLine[0];
					newCLpush[1] = tempLine[1];
					newCLpush[2] = tempLine[2];
					newCLpush[3] = tempLine[3];
					newCLpush[4] = 'cl';
					newCLpush[5] = 0; //patients
					newCLpush[6] = 0;
					newCLpush[7] = 0;
					newCLpush[8] = 0; //patients_acc
					newCLpush[9] = 0;
					newCLpush[10] = 0;
					newCLpush[11] = 0;
					this.state.updatedStudyPatientsByMedia.push(newCLpush);
				}
			}
		}

		//this.state.studyPatientsByMedia = this.state.studyPatientsByMedia.concat(totalNewCLPush);
		
		this.finalizeMergedCSVFile(this.state.updatedStudyPatientsByMedia);
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
		          Update CL Studies Signups
		        </h2>
            	<p>Only for selected studies</p>
            	<br/>
            	<br/>
            	<br/>
            	<div style={{'float':'left'}}>
	            	<div>Select studyPatientsByMedia CSV</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('studyPatientsByMedia')} style={{'float':'left'}}/>
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

export default TempCLSignUp;