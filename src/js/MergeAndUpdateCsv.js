import React, { Component } from 'react';
import csv from 'jquery-csv'

class MergeAndUpdateCsv extends Component {
    constructor(props) {
        super(props);

        this.state = {
            todayDate: null,
            dateUseAsNow: "2020-01-03",
            dateUseAsTomorrow: "2020-01-04",
            cpqCSV: null,
            pacDailyCSV: null,
            isReadyToProces: false,
            smartlyAPIToken: '861fe5f87ac243bd50f11e79c09dbed46d542219',
            studykikAuth: 'Bm050DA8NBhObG2Qbwdc1loOZTNmNCNBGwOpcdYEKX4Suo1wpnSgtDIQGmEAjApM',
            notFoundLength: 0,
            tempNotFoundLength: 0,
            tempFoundLength: 0,
            tempToProcessFoundLength: 0,
            tempToProcessFoundLength2: 0,
            isSendingRequests: false,
            intervalId: 0
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
                data[0].push('sponsorId');
                data[0].push('croId');
                data[0].push('cro');
                data[0].push('disposition');
                data[0].push('dispositionTotal');

                //_this.finalizeMergedCSVFile(data);
            }
            _this.state[name] = data;

            if(_this.state.cpqCSV != null && _this.state.pacDailyCSV != null)
                _this.setState({isReadyToProces: true});
        }
    }

    getForDispoFile = name => e => {
        var _this = this;

        var file = e.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file);

        reader.onload = function(event) {
          var _csv = event.target.result;
          var data = csv.toArrays(_csv);
            _this.state[name] = data;

            if(_this.state.cpqCSV != null)
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

            var matchFound = pacDailyCSV.find(function(pacEl){
                return (pacEl[0] == tempStudyID && pacEl[2] == tempIndication);
            });

            ctr += (matchFound == undefined) ? 0 : 1;
            matchFound = (matchFound == undefined) ? ['', 0, '', '', '', '', '', ''] : matchFound;
            if(matchFound[1] > 0) {
                matchedStudyIDs.push(matchFound[0]); //studyId
            }
            
            cpqEl.push(matchFound[1]); //newSignUp
            cpqEl.push(matchFound[3]); //sourceName
            cpqEl.push(matchFound[4]); //isMediaTracking
            cpqEl.push(matchFound[5]); //tierNumber
            cpqEl.push(matchFound[6]); //sponsor
        });
        
        cpqCSV.unshift(header);

        console.log('total matchFound: '+ctr);
        this.processNotFound(matchedStudyIDs);
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
            this.sendRequestStudiesNotFound(_tempNotFound);
        }
    }

    sendRequestStudiesNotFound = (tempNotFound, callback) => {
        var studyID = tempNotFound[0];
        var url = "https://api.studykik.com/api/v1/studies/"+studyID+"?filter={%22include%22:[{%22relation%22:%22campaigns%22,%22scope%22:{%22order%22:%22orderNumber%20DESC%22}},{%22relation%22:%22protocol%22},{%22relation%22:%22site%22},{%22relation%22:%22sources%22},{%22relation%22:%22sponsor%22},{%22relation%22:%22indication%22},{%22relation%22:%22cro%22}]}";
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

                newCSVValue[14] = tempNotFound[1]; //patients
                newCSVValue[15] = 0;
                newCSVValue[16] = 0;

                newCSVValue[17] = this.state.dateUseAsNow;
                newCSVValue[18] = campaign.startDate
                newCSVValue[19] = campaign.endDate
                newCSVValue[20] = 0; //adspent defaulted to 0

                newCSVValue[21] = tempNotFound[1]; //patients_acc
                newCSVValue[22] = 0;
                newCSVValue[23] = 0;

                newCSVValue[24] = tempNotFound[1]; //New Patient
                newCSVValue[25] = 0;
                newCSVValue[26] = 0;
                newCSVValue[27] = 0;
                newCSVValue[28] = 0;
                newCSVValue[29] = 0;
                newCSVValue[30] = 0;
                newCSVValue[31] = 0;

                newCSVValue[32] = tempNotFound[1]; //New Patient_Acc
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
                newCSVValue[45] = json.sponsor.id;
                newCSVValue[46] = json.cro ? json.cro.id : "";
                newCSVValue[47] = json.cro ? json.cro.name : "";

                this.state.cpqCSV.push(newCSVValue);
                this.state.tempNotFoundLength = this.state.tempNotFoundLength+1; 
                if(this.state.tempNotFoundLength == this.state.notFoundLength) {
                    console.log("DONE sendRequestStudiesNotFound FOR ALL -------");
                    console.log(this.state.cpqCSV);
                    this.processFoundStudies();
                }
        })
        .catch((error) => {
            console.log(error);
        });
    }

    processFoundStudies = () => {
        console.log('called processFoundStudies');
        this.state.isSendingRequests = true;

        var _this = this;
        var i=1;

        this.state.intervalId = setInterval(function() {
            var study = _this.state.cpqCSV[i];
            
            if(study.length < 48 || study[42] === "" || study[44] === "" || study[45] === "") { //isMediaTracking, sponsor, sponsorId
                _this.state.tempToProcessFoundLength = _this.state.tempToProcessFoundLength+1;
                _this.sendRequestStudiesFound(i);
            }

            i++;
            console.log('interval '+i);
            if(i == _this.state.cpqCSV.length) {
                console.log('cleared interval');
                _this.state.isSendingRequests = false;
                clearInterval(_this.state.intervalId);
            }
        }, 500);
        
        console.log("done calling processFoundStudies "+this.state.tempToProcessFoundLength);
    }

    sendRequestStudiesFound = (cpqStudyIndex) => {
        var study = this.state.cpqCSV[cpqStudyIndex];
        var studyID = study[3];
        var url = "https://api.studykik.com/api/v1/studies/"+studyID+"?filter={%22include%22:[{%22relation%22:%22campaigns%22,%22scope%22:{%22order%22:%22orderNumber%20DESC%22}},{%22relation%22:%22protocol%22},{%22relation%22:%22site%22},{%22relation%22:%22sources%22},{%22relation%22:%22sponsor%22},{%22relation%22:%22indication%22},{%22relation%22:%22cro%22}]}";
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
                if(study[42] == "") //isMediaTracking
                    this.state.cpqCSV[cpqStudyIndex][42] = (json.mediaTracking) ? "TRUE" : "FALSE";
                this.state.cpqCSV[cpqStudyIndex][44] = json.sponsor ? json.sponsor.name : "";
                this.state.cpqCSV[cpqStudyIndex][45] = json.sponsor ? json.sponsor.id : "";
                this.state.cpqCSV[cpqStudyIndex][46] = json.cro ? json.cro.id : "";
                this.state.cpqCSV[cpqStudyIndex][47] = json.cro ? json.cro.name : "";

                this.state.tempFoundLength = this.state.tempFoundLength+1; 
                console.log(this.state.tempFoundLength);
                if(this.state.tempFoundLength == this.state.tempToProcessFoundLength && !this.state.isSendingRequests) {
                    console.log("DONE sendRequestStudiesFound FOR ALL -------");
                    console.log(this.state.cpqCSV);
                    this.processAllStudies("sendRequestStudiesDispositions");
                }
        })
        .catch((error) => {
            console.log(error);
        });
    }

    startFetchingDispo = () => {
        console.log(this.state.cpqCSV);
        console.log("will start to processAllStudies");
        this.processAllStudies("sendRequestStudiesDispositions");
    }

    processAllStudies = (functionName) => {
        console.log('called '+functionName);
        this.state.tempToProcessFoundLength = 0;
        this.state.tempFoundLength = 0;
        this.state.isSendingRequests = true;

        var _this = this;
        var i=1;

        this.state.intervalId = setInterval(function() {
            _this.state.tempToProcessFoundLength = _this.state.tempToProcessFoundLength+1;
            if(functionName == "sendRequestStudiesByProtocolTotalsTmp") {
                _this.state.tempToProcessFoundLength = _this.state.tempToProcessFoundLength+1;
                _this.sendRequestStudiesByProtocolTotalsTmp(i);
            }
            else if(functionName == "sendRequestStudiesDispositions"){
                _this.state.tempToProcessFoundLength = _this.state.tempToProcessFoundLength+1;
                _this.sendRequestStudiesDispositions(i);
            }

            i++;
            console.log('interval '+i);
            if(i == _this.state.cpqCSV.length) {
                console.log('cleared interval');
                _this.state.isSendingRequests = false;
                clearInterval(_this.state.intervalId);
            }
        }, 1000);


        /*for(var i = 1; i < this.state.cpqCSV.length; i++) {
            this.state.tempToProcessFoundLength = this.state.tempToProcessFoundLength+1;
            if(functionName == "sendRequestStudiesByProtocolTotalsTmp") {
                this.sendRequestStudiesByProtocolTotalsTmp(i);
            }
            else if(functionName == "sendRequestStudiesDispositions"){
                this.sendRequestStudiesDispositions(i);
            }
        }*/
        console.log("done calling "+functionName);
    }

    sendRequestStudiesDispositions = (cpqStudyIndex) => {
        var study = this.state.cpqCSV[cpqStudyIndex];
        var studyID = study[3];
        var url = "https://api.studykik.com/api/v1/studies/getStudiesByDispositionTotals?"+
                  "studyID=" + studyID + "&" +
                  "study=" + studyID + "&" +
                  "sponsorRoleId=" + study[45] + "&" +
                  "protocol=" + encodeURI(study[9]) + "&" +
                  "indication=" + encodeURI(study[8]) + "&" +
                  "cro=" + encodeURI(study[47]) + "&" +
                  "messaging=true&" +
                  "timezone=America%2FChicago&" +
                  "status=All&" +
                  "startDate=" + this.state.dateUseAsNow + "T06%3A00%3A00.000Z&" +
                  "endDate=" + this.state.dateUseAsTomorrow + "T06%3A00%3A00.000Z";

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
            if(json && json.length) {
                for(var i=0; i<json.length; i++) {
                    if(json[i].source == "StudyKIK") {
                        this.state.cpqCSV[cpqStudyIndex][48] = json[i].stats[0];

                        var total = json[i].stats.reduce((a, b) => parseInt(a) + parseInt(b));
                        this.state.cpqCSV[cpqStudyIndex][49] = total;

                        break;
                    }
                }
            }

            this.state.tempFoundLength = this.state.tempFoundLength+1; 
            console.log(this.state.tempFoundLength);
            if(this.state.tempFoundLength == this.state.tempToProcessFoundLength && !this.state.isSendingRequests) {
                console.log("DONE sendRequestStudiesDispositions FOR ALL -------");
                console.log(this.state.cpqCSV);
            }

        })
        .catch((error) => {
            console.log(error);
        });
    }

    sendRequestStudiesByProtocolTotalsTmp = (cpqStudyIndex) => {
        var study = this.state.cpqCSV[cpqStudyIndex];
        var studyID = study[3];
        var url = "https://api.studykik.com/api/v1/studies/getStudiesByProtocolTotalsTmp?"+
                  "studyID=" + studyID + "&" +
                  "study=" + studyID + "&" +
                  "sponsorRoleId=" + study[45] + "&" +
                  "protocol=" + encodeURI(study[9]) + "&" +
                  "indication=" + encodeURI(study[8]) + "&" +
                  "cro=" + encodeURI(study[47]) + "&" +
                  "messaging=true&" +
                  "timezone=America%2FChicago&" +
                  "source=1&" +
                  "status=All&" +
                  "startDate=" + this.state.dateUseAsNow + "T06%3A00%3A00.000Z&" +
                  "endDate=" + this.state.dateUseAsTomorrow + "T06%3A00%3A00.000Z";

        console.log(study);
        console.log(url);

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
            if(json) {
                this.state.cpqCSV[cpqStudyIndex][48] = this.state.cpqCSV[cpqStudyIndex][40];
                this.state.cpqCSV[cpqStudyIndex][49] = json.call_attempted;
                this.state.cpqCSV[cpqStudyIndex][50] = json.dnq;
                this.state.cpqCSV[cpqStudyIndex][51] = json.action_needed;
                this.state.cpqCSV[cpqStudyIndex][52] = json.scheduled;
                this.state.cpqCSV[cpqStudyIndex][53] = json.consented;
                this.state.cpqCSV[cpqStudyIndex][54] = json.screen_failed;
                this.state.cpqCSV[cpqStudyIndex][55] = json.randomized;
            }

            this.state.tempFoundLength = this.state.tempFoundLength+1; 
            console.log(this.state.tempFoundLength);
            if(this.state.tempFoundLength == this.state.tempToProcessFoundLength) {
                console.log("DONE sendRequestStudiesByProtocolTotalsTmp FOR ALL -------");
                console.log(this.state.cpqCSV);
            }

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
                  Merging of campaign_patient_quality and pac_daily_report<br/>
                  And add the disposition data
                </h2>
                
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
                <br/>
                <br/>
                <div style={{'float':'left'}}>
                    <div>Select campaign_patient_quality CSV For Fetching Disposition</div>
                    <input type="file" accept=".csv" onChange={this.getForDispoFile('cpqCSV')} style={{'float':'left'}}/>
                </div>
                {(this.state.isReadyToProces) && <button onClick={this.startFetchingDispo}>Start Merging!</button>}
            </div>
        );
    }
}

export default MergeAndUpdateCsv;