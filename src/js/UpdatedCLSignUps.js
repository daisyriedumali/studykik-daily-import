import React, { Component } from 'react';
import csv from 'jquery-csv'

class UpdatedCLSignUps extends Component {
	constructor(props) {
        super(props);

        this.state = {
        	todayDate: null,
        	dateUseAsNow: "2020-01-28",
            
            cpqCSV: null,
            studyPatientsByMedia: null,

            clPTSD_0127: [
				4011675,
				4011674,
				4011673,
				4011671,
				4011670,
				4011668,
				4011667,
				4011666,
				4011665,
				4011664,
				4011651,
				4011650,
				4011649,
				4011648,
				4011647,
				4011644,
				4011642,
				4011641,
				4011639,
				4011638,
				4011637,
				4011635,
				4011632,
				4011662,
				4011646,
				4011643,
				4011640,
				4011645,
				4011672,
				4011663,
				4011661,
				4011660,
				4011658,
				4011657,
				4011656,
				4011655,
				4011654,
				4011653,
				4011652,
				4011629,
				4011627,
				4011626,
				4011625,
				4011631,
				4011623,
				4011628,
				4011630,
				4011621,
				4011622
            ],

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

	        if(_this.state.cpqCSV != null && _this.state.studyPatientsByMedia != null)
	          	_this.setState({isReadyToProces: true});
        }
	}

	startProcessing = () => {
		var _this = this;
		var totalNewCLPush = [];
		for(var i=0; i<this.state.clPTSD_0127.length; i++){
			var clStudyID = this.state.clPTSD_0127[i];

			var filterStudies = this.state.cpqCSV.filter(function(el){
				return (el[3] == clStudyID);
			});

			var foundStudy = null;

			if(filterStudies.length > 1) {
				var maxStudy = filterStudies[0]; //LATEST CAMPAIGN OF STUDY
				for(var j=1; j<filterStudies.length; j++){
					var maxStudyDate = new Date(maxStudy[18]+" 00:00:00");
					var currStudyDate = new Date(filterStudies[j][18]+" 00:00:00");

					maxStudy = (maxStudyDate >= currStudyDate) ? maxStudy : filterStudies[j];
				}
				foundStudy = maxStudy;
			} else if(filterStudies.length == 1) {
				foundStudy = filterStudies[0];
			}

			//IF STUDY HAS CL SPENT BUT NO FB SPENT
			if(foundStudy && parseInt(foundStudy[52]) > 0 && (foundStudy[20] == '' || parseInt(foundStudy[20]) == 0)) {
				var studyPatientFB = this.state.studyPatientsByMedia.findIndex(function(el){
					return (el[0] == foundStudy[0] && el[1] == foundStudy[3] && el[4] == 'fb'); //compare campaignID, studyID, medianame
				});

				var studyPatientCL = this.state.studyPatientsByMedia.findIndex(function(el){
					return (el[0] == foundStudy[0] && el[1] == foundStudy[3] && el[4] == 'cl');
				});

				if(studyPatientFB != -1 && studyPatientCL != -1) {
					var tempFBSignUp = this.state.studyPatientsByMedia[studyPatientFB][11];
					this.state.studyPatientsByMedia[studyPatientCL][11] = tempFBSignUp;
					this.state.studyPatientsByMedia[studyPatientFB][11] = 0;

					console.log(">> HERE "+ tempFBSignUp);
					console.log(foundStudy[0]+" "+foundStudy[3]);
					//console.log(foundStudy);
				} else if(studyPatientFB != -1) {
					var tempFBSignUp = parseInt(this.state.studyPatientsByMedia[studyPatientFB][11]) > 0 ? parseInt(this.state.studyPatientsByMedia[studyPatientFB][11]) : 0;
					
					var newCLpush = [];
					newCLpush[0] = this.state.studyPatientsByMedia[studyPatientFB][0];
					newCLpush[1] = this.state.studyPatientsByMedia[studyPatientFB][1];
					newCLpush[2] = this.state.studyPatientsByMedia[studyPatientFB][2];
					newCLpush[3] = this.state.studyPatientsByMedia[studyPatientFB][3];
					newCLpush[4] = 'cl';
					newCLpush[5] = tempFBSignUp; //patients
					newCLpush[6] = 0;
					newCLpush[7] = 0;
					newCLpush[8] = tempFBSignUp; //patients_acc
					newCLpush[9] = 0;
					newCLpush[10] = 0;
					newCLpush[11] = tempFBSignUp;

					this.state.studyPatientsByMedia[studyPatientFB][11] = 0;
					totalNewCLPush.push(newCLpush);

					console.log(">> HERE ONLY FB IS PRESENT "+ tempFBSignUp);
					console.log(foundStudy[0]+" "+foundStudy[3]);
				}
			}
		}

		this.state.studyPatientsByMedia = this.state.studyPatientsByMedia.concat(totalNewCLPush);
		
		this.finalizeMergedCSVFile(this.state.studyPatientsByMedia);
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
            	<div style={{'float':'left'}}>
	            	<div>Select campaign_patient_quality MERGEDFINAL4 CSV</div>
	            	<input type="file" accept=".csv" onChange={this.getFile('cpqCSV')} style={{'float':'left'}}/>
            	</div>
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

export default UpdatedCLSignUps;