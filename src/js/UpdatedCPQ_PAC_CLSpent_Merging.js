import React, { Component } from "react";
import csv from "jquery-csv";

class UpdatedCPQ_PAC_CLSpent_Merging extends Component {
    constructor(props) {
        super(props);

        this.state = {
            actualYesterdayDateUTC: null,
            dateUseAsNow: "2020-11-19",

            previousCpqCSV: null,
            currentCpqCSV: null,
            pacDailyUTMCSV: null,
            craigslistAdSpentCSV: null,
            studyPatientMediaCSV: null,
            kenshooSpentCSV: null,      
            previousWeekMimicCSV: null,

            finalCPQCSV: null,
            campaignCostSummaryCSV: null,

            //New mimic merged final from QS
            mimicMergeFinal: null,

            headerToUse: [],
            patientsPreScreenedCNCByMediaName: [],
            patientsSignUpByMediaName: [],

            studyPatientsByMedia: [],
            notFoundStudiesList: [],
            originalMimicFileLength: null,
            studyPatientsByMediaHeader: null,

            mediaNamesTracked: [
                "fb", //FACEBOOK
                "cl", //CRAIGSLIST
                "fg", //FOCUS GROUP
                "snapchat", //SNAPCHAT
                "tek918", //TEST UTM
                "clla",
                "clb",
                "clch",
                "clny",
                "luna",
                "clxgigs",
                "clxjobs",
                "facebooklink",
                "instagramlink",
                "facebookmessenger",
                "instagramstory",
                "emailblast",
                "googleadwords",
                "snap",
                "textblast",
                "fbgroups",
                "retarget",
                "spotify",
                "reddit",
                "adwords",
                "fbobesity",
                "fbasthma",
                "fbdiabetes",
                "fbheartfailure",
                "fbkidneydisease",
                "fbtype1diabetes",
                "fbcopd",
                "fbsenior"
            ],
            isReadyToProces: false,

            smartlyAPIToken: "861fe5f87ac243bd50f11e79c09dbed46d542219",
            studykikAuth:
                "vgk9hh5o1NJL1ocf4QzXHQapSCVdhrUAtNblULDZHrBqxB5A9CpVHMWKv4l2DCWq",

            clPTSD_Watch: [
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
                4011622,
            ],

            clPTSDProtocol_Watch: [
                "331-201-00072",
                "331-201-00071",
                "331-201-00071 and 331-201-00072 bucket",
            ],
        };
    }

    componentDidMount() {
        var yesterday = new Date(new Date().valueOf() - 1000 * 60 * 60 * 24);
        this.state.actualYesterdayDateUTC = this.formatDateUTC(yesterday);
    }

    formatDateUTC(d) {
        var day = d.getUTCDate() > 9 ? d.getUTCDate() : "0" + d.getUTCDate();
        var month =
            d.getUTCMonth() + 1 > 9
                ? d.getUTCMonth() + 1
                : "0" + (d.getUTCMonth() + 1);
        return d.getUTCFullYear() + "-" + month + "-" + day;
    }

    getFile = (name) => (e) => {
        var _this = this;

        var file = e.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file);

        reader.onload = function (event) {
            var _csv = event.target.result;
            var data = csv.toArrays(_csv);
            if (name === "previousCpqCSV") {
                _this.state.headerToUse = data[0];
            }

            _this.state[name] = data;

            //ALL FILES HAS BEEN LOADED!
            /*if(_this.state.previousCpqCSV != null && 
	           _this.state.currentCpqCSV != null &&
	           _this.state.pacDailyUTMCSV != null &&
	           _this.state.craigslistAdSpentCSV != null) {

	        	_this.setState({isReadyToProces: true});

	        }*/
            if (_this.state.currentCpqCSV != null) {
                _this.setState({ isReadyToProces: true });
            }
        };
    };

    removeHeaders = () => {
        if (this.state.currentCpqCSV) this.state.currentCpqCSV.shift();

        if (this.state.pacDailyUTMCSV) this.state.pacDailyUTMCSV.shift();

        if (this.state.previousCpqCSV) this.state.previousCpqCSV.shift();

        if (this.state.craigslistAdSpentCSV) {
            this.state.craigslistAdSpentCSV.shift();
            this.state.craigslistAdSpentCSV.shift();
        }

        if (this.state.studyPatientMediaCSV)
            this.state.studyPatientMediaCSV.shift();

        if (this.state.kenshooSpentCSV) this.state.kenshooSpentCSV.shift();
    };

    startMergingProcess = () => {
        var _this = this;
        console.log("FINAL HEADERS");
        console.log(this.state.headerToUse);

        this.removeHeaders();

        //STEP1: Flatten currentCpqCSV and create new array for patients, prescreened, cnc by media name
        this.step1FlattenCurrentCpqCSV();

        //STEP2: MERGE currentCpqCSV AND pacDailyUTMCSV
        this.step2MergePACDailyUTMCSV();
    };

    startCampaignCostMergingProcess = () => {
        if (this.state.campaignCostSummaryCSV)
            this.state.campaignCostSummaryCSV.shift();

        var notFoundStudies = [];
        var sumNotFoundStudiesSpent = 0;
        for (var i = 0; i < this.state.campaignCostSummaryCSV.length; i++) {
            var temp = this.state.campaignCostSummaryCSV[i];
            var findStudy = this.state.finalCPQCSV.find(function (el, index) {
                return el[3] == temp[0];
            });

            if (findStudy == undefined) {
                notFoundStudies.push(temp);
                sumNotFoundStudiesSpent +=
                    temp[1] > 0 ? parseFloat(temp[1]) : 0;
            } else {
                var checkDupe = this.state.finalCPQCSV.filter(function (el) {
                    return el[3] == temp[0];
                });

                var tempStudyIndex = null;
                for (var j = 1; j < this.state.finalCPQCSV.length; j++) {
                    if (checkDupe.length > 1) {
                        if (
                            this.state.finalCPQCSV[j][3] == temp[0] &&
                            tempStudyIndex == null
                        ) {
                            tempStudyIndex = j;
                        } else if (this.state.finalCPQCSV[j][3] == temp[0]) {
                            var currDate = new Date(
                                this.state.finalCPQCSV[tempStudyIndex][18] +
                                    " 00:00:00"
                            );
                            var tempDate = new Date(
                                this.state.finalCPQCSV[j][18] + " 00:00:00"
                            );
                            tempStudyIndex =
                                currDate >= tempDate ? tempStudyIndex : j;
                        }
                    } else if (this.state.finalCPQCSV[j][3] == temp[0]) {
                        tempStudyIndex = j;
                        break;
                    }
                }

                this.state.finalCPQCSV[tempStudyIndex][54] =
                    temp[1] > 0 ? temp[1] : 0;
            }
        }
        console.log("!!! STUDIES IN CAMPAIGN COST CSV BUT NOT IN DAILY DATA");
        console.log(notFoundStudies);
        console.log(
            "!!! TOTAL OF NOT FOUND STUDIES IN CAMPAIGN COST CSV: " +
                sumNotFoundStudiesSpent
        );
        this.finalizeMergedCSVFile(this.state.finalCPQCSV);
    };

    /**
     * This handles the merging of the new mimic merged final tab and FB and CL adpsent
     */
    startMergingMimicFBCLProcess = () => {
        this.state.headerToUse = this.state.mimicMergeFinal[0];
        this.state.studyPatientsByMediaHeader = this.state.studyPatientMediaCSV[0];

        if (this.state.mimicMergeFinal) this.state.mimicMergeFinal.shift();
        if (this.state.kenshooSpentCSV) this.state.kenshooSpentCSV.shift();
        if (this.state.previousWeekMimicCSV)
            this.state.previousWeekMimicCSV.shift();
        if (this.state.craigslistAdSpentCSV) {
            this.state.craigslistAdSpentCSV.shift();
            this.state.craigslistAdSpentCSV.shift();
        }
        if (this.state.studyPatientMediaCSV)
            this.state.studyPatientMediaCSV.shift();

        //checks if there are not found fb ad spent
        this.state.originalMimicFileLength = this.state.mimicMergeFinal.length;
        this.mergeMimicAndClAdSpent();
        this.mergeMimicAndFbSpent();
        this.checkNoMatchFbAdspentMimicFinal();

        this.checkQSStudyPatient();

        this.state.mimicMergeFinal.unshift(this.state.headerToUse);
        this.finalizeMergedCSVFile(this.state.mimicMergeFinal);

        this.state.studyPatientMediaCSV.unshift(
            this.state.studyPatientsByMediaHeader
        );
        this.finalizeMergedCSVFile(this.state.studyPatientMediaCSV);
    };
    mergeMimicAndClAdSpent = () => {
        var _this = this;

        var craigslistAdSpentCSV = this.state.craigslistAdSpentCSV;
        var dateUseAsNow = new Date(this.state.dateUseAsNow + " 00:00:00");

        var temparr = [];
        var clAdDiscrepancy = [];
        for (var i = 0; i < this.state.mimicMergeFinal.length; i++) {
            var temp = this.state.mimicMergeFinal[i];
            var totalAdSpentByStudy = 0;
            var totalLatestInitSpent = 0;

            var firstIndex = this.state.mimicMergeFinal.findIndex(function (
                el,
                index
            ) {
                return temp[3] == el[3];
            });

            var filterStudy = this.state.mimicMergeFinal.filter(function (el) {
                return temp[3] == el[3];
            });

            //FILTER BY STUDY ID
            var filteredCraigslistAdSpentCSV = craigslistAdSpentCSV.filter(
                function (el) {
                    return el[1] == temp[3];
                }
            );

            //FIND VALUE WITH MAX CL START DATE
            var filteredCraigslistMaxCLStartDate = null;
            var filteredCraigslistStartDateLessDateNow = null;
            if (filteredCraigslistAdSpentCSV.length) {
                filteredCraigslistMaxCLStartDate =
                    filteredCraigslistAdSpentCSV[0];
                filteredCraigslistStartDateLessDateNow =
                    filteredCraigslistAdSpentCSV[0];
                totalAdSpentByStudy = Number(
                    filteredCraigslistAdSpentCSV[0][6].replace(/[^0-9.-]+/g, "")
                );

                var tempDate = new Date(
                    filteredCraigslistAdSpentCSV[0][4] + " 00:00:00"
                );
                totalLatestInitSpent =
                    dateUseAsNow.getTime() === tempDate.getTime()
                        ? parseFloat(filteredCraigslistAdSpentCSV[0][6])
                        : 0;

                for (var z = 1; z < filteredCraigslistAdSpentCSV.length; z++) {
                    var prevDate = new Date(
                        filteredCraigslistMaxCLStartDate[4] + " 00:00:00"
                    );
                    var currDate = new Date(
                        filteredCraigslistAdSpentCSV[z][4] + " 00:00:00"
                    );

                    filteredCraigslistMaxCLStartDate =
                        currDate >= prevDate
                            ? filteredCraigslistAdSpentCSV[z]
                            : filteredCraigslistMaxCLStartDate;

                    filteredCraigslistStartDateLessDateNow =
                        currDate <= dateUseAsNow
                            ? filteredCraigslistAdSpentCSV[z]
                            : filteredCraigslistStartDateLessDateNow;

                    totalLatestInitSpent +=
                        dateUseAsNow.getTime() === currDate.getTime()
                            ? parseFloat(filteredCraigslistAdSpentCSV[z][6])
                            : 0;

                    totalAdSpentByStudy +=
                        currDate <= dateUseAsNow
                            ? parseFloat(filteredCraigslistAdSpentCSV[z][6])
                            : 0; //Number(filteredCraigslistAdSpentCSV[z][6].replace(/[^0-9.-]+/g,"")) : 0;
                }
            }

            var maxCLStartDate = filteredCraigslistMaxCLStartDate
                ? new Date(filteredCraigslistMaxCLStartDate[4] + " 00:00:00")
                : null;
            var maxCurrStartDate = filteredCraigslistStartDateLessDateNow
                ? new Date(
                      filteredCraigslistStartDateLessDateNow[4] + " 00:00:00"
                  )
                : null;

            if (maxCurrStartDate && maxCurrStartDate <= dateUseAsNow) {
                var spent = filteredCraigslistStartDateLessDateNow
                    ? parseFloat(filteredCraigslistStartDateLessDateNow[6])
                    : 0; 
                spent = filterStudy.length > 1 && firstIndex == i ? 0 : spent; //IF STUDY IS DUPE IN CPQ, SET TO 0

                totalLatestInitSpent =
                    filterStudy.length > 1 && firstIndex == i
                        ? 0
                        : totalLatestInitSpent;

                this.state.mimicMergeFinal[i][50] = spent; //CURRENT RESPOST SPENT
                this.state.mimicMergeFinal[i][51] = totalAdSpentByStudy; //TOTAL ADSPENT TILL CL START DATE
                this.state.mimicMergeFinal[i][52] = totalLatestInitSpent; //(dateUseAsNow.getTime() === maxCurrStartDate.getTime()) ? spent : 0; //INITIAL SPENT OF THE STUDY
                this.state.mimicMergeFinal[i][53] =
                    filteredCraigslistAdSpentCSV.length; //REPOST COUNT
            }

            if (maxCLStartDate > dateUseAsNow) {
                clAdDiscrepancy.push(filteredCraigslistAdSpentCSV[0][1]);
            }
        }

        if (clAdDiscrepancy.length) {
            console.log(
                "!!!!! CL Ad Spent Discrepancy: Found in CL but Ad is not yet active, Study is in CPQ"
            );
            console.log(clAdDiscrepancy);
        }

        clAdDiscrepancy = [];
        var clAdDiscrepancyIds = [];
        //Ad Spent Discrepancy: CL Start Date is active in CL but Study not found in CPQ
        var filteredActiveCL = craigslistAdSpentCSV.filter(function (el) {
            var startDate = new Date(el[4] + " 00:00:00");
            return startDate >= dateUseAsNow;
        });
        for (var i = 0; i < filteredActiveCL.length; i++) {
            var tempStudyID = filteredActiveCL[i][1];
            var findStudy = this.state.mimicMergeFinal.find(function (el) {
                return el[3] == tempStudyID;
            });
            if (findStudy == undefined) {
                clAdDiscrepancy.push(filteredActiveCL[i]);
                clAdDiscrepancyIds.push(tempStudyID);
            }
        }

        clAdDiscrepancyIds = [...new Set(clAdDiscrepancyIds)];
        if (clAdDiscrepancyIds.length) {
            console.log(
                "!!!!! CL Ad Spent Discrepancy: Active CL AdSpent but Study is not in CPQ"
            );
            console.log(clAdDiscrepancyIds);
            console.log(clAdDiscrepancy);

            for (var i = 0; i < clAdDiscrepancyIds.length; i++) {
                var totalLatestInitSpent = clAdDiscrepancy
                    .filter(function (el) {
                        return el[1] == clAdDiscrepancyIds[i];
                    })
                    .reduce(function (total, current) {
                        return total + parseFloat(current[6]);
                    }, 0);
                var temp = Array(this.state.headerToUse.length).fill("");
                temp[3] = clAdDiscrepancyIds[i];
                temp[17] = this.state.dateUseAsNow;
                temp[52] = totalLatestInitSpent;

                var findPreviousWeekMimic = this.checkPreviousWeekMimic(
                    clAdDiscrepancyIds[i]
                );
                if (findPreviousWeekMimic != null) {
                    for (var j = 0; j < 17; j++) {
                        temp[j] = findPreviousWeekMimic[j];
                    }
                }
                this.state.mimicMergeFinal.push(temp);
            }
        }
    };
    //processes the found fb spent and inserts the corresponding fb adspent
    mergeMimicAndFbSpent = () => {
        for (var i = 0; i < this.state.mimicMergeFinal.length; i++) {
            this.state.mimicMergeFinal[i][40] = this.state.mimicMergeFinal[
                i
            ][21];
            var studyID = this.state.mimicMergeFinal[i][3];
            var filterKenshoo = this.state.kenshooSpentCSV.filter(function (
                el
            ) {
                return el[1].includes(studyID);
            });

            var filterMimicForDuplicateStudyId = [];
            for (var j = 0; j < this.state.mimicMergeFinal.length; j++) {
                if (this.state.mimicMergeFinal[j][3] === studyID) {
                    var temp = this.state.mimicMergeFinal[j];
                    temp["index"] = j;
                    filterMimicForDuplicateStudyId.push(temp);
                }
            }
            if (filterKenshoo && filterKenshoo.length) {
                var sumSpent = 0;
                sumSpent = filterKenshoo.reduce(function (total, current) {
                    return total + parseFloat(current[3]);
                }, 0);

                var max_val = filterMimicForDuplicateStudyId[0];
                for (
                    var k = 0;
                    k < filterMimicForDuplicateStudyId.length;
                    k++
                ) {
                    if (filterMimicForDuplicateStudyId[k][0] > max_val[0]) {
                        max_val = filterMimicForDuplicateStudyId[k];
                    }
                }
                this.state.mimicMergeFinal[max_val["index"]][20] = sumSpent;
            }
        }
    };
    //processes the missing fb spent ad appends it to the merge file
    checkNoMatchFbAdspentMimicFinal = () => {
        var noMatchCPQ = [];
        for (var i = 0; i < this.state.kenshooSpentCSV.length; i++) {
            var tempLine = this.state.kenshooSpentCSV[i];

            var findCL = this.state.mimicMergeFinal.find(function (el) {
                return tempLine[1].includes(el[3]);
            });

            if (findCL == undefined && parseFloat(tempLine[3]) > 0) {
                noMatchCPQ.push([tempLine[1], tempLine[3]]);
            }
        }
        console.log("!!!!! NO MATCH CPQ STUDIES WITH FB (KENSHOO) SPENT");

        var filteredNoMatchCPQ = [];
        var otherIndicatorSpent = 0;
        //extracts the study id and the corresponding fb spent
        for (var i = 0; i < noMatchCPQ.length; i++) {
            var temp = Array(this.state.headerToUse.length).fill("");
            var tempStudyId =
                noMatchCPQ[i][0].match(/[0-9]{7}/) != null
                    ? noMatchCPQ[i][0].match(/[0-9]{7}/)[0]
                    : null;
            if (tempStudyId != null) {
                filteredNoMatchCPQ.push([tempStudyId, noMatchCPQ[i][1]]);
            } else {
                otherIndicatorSpent += parseFloat(noMatchCPQ[i][1]);
            }
        }

        if (filteredNoMatchCPQ.length) {
            //remove duplicates and summing up the corresponding fb spent
            var filteredDuplicatesNoMatchCPQ = [];
            for (var i = 0; i < filteredNoMatchCPQ.length; i++) {
                var totalAdSpent = filteredNoMatchCPQ
                    .filter(function (el) {
                        return el[0] == filteredNoMatchCPQ[i][0];
                    })
                    .reduce(function (total, current) {
                        return total + parseFloat(current[1]);
                    }, 0);
                var findIfExist = filteredDuplicatesNoMatchCPQ.filter(function (
                    e
                ) {
                    return e[0] == filteredNoMatchCPQ[i][0];
                });
                if (findIfExist.length > 0) {
                    continue;
                } else {
                    filteredDuplicatesNoMatchCPQ.push([
                        filteredNoMatchCPQ[i][0],
                        totalAdSpent,
                    ]);
                }
            }
            console.log(filteredDuplicatesNoMatchCPQ);
            //pushes the missing fb to mimic merge final csv
            for (var i = 0; i < filteredDuplicatesNoMatchCPQ.length; i++) {
                var temp = Array(this.state.headerToUse.length).fill("");
                temp[3] = filteredDuplicatesNoMatchCPQ[i][0];
                temp[20] = filteredDuplicatesNoMatchCPQ[i][1];
                temp[17] = this.state.dateUseAsNow;

                var findPreviousWeekMimic = this.checkPreviousWeekMimic(
                    filteredDuplicatesNoMatchCPQ[i][0]
                );
                if (findPreviousWeekMimic != null) {
                    for (var j = 0; j < 17; j++) {
                        temp[j] = findPreviousWeekMimic[j];
                    }
                    this.state.mimicMergeFinal.push(temp);
                } else {
                    this.state.notFoundStudiesList.push(temp);
                }
            }
            for (var i = 0; i < this.state.notFoundStudiesList.length; i++) {
                this.state.mimicMergeFinal.push(
                    this.state.notFoundStudiesList[i]
                );
            }
            var temp = Array(this.state.headerToUse.length).fill("");
            temp[17] = this.state.dateUseAsNow;
            temp[20] = otherIndicatorSpent;
            this.state.mimicMergeFinal.push(temp);
        }
    };
    checkQSStudyPatient = () => {
        var emptyTemp = [];
        var veryempty = [];
        for (var i = 0; i < this.state.mimicMergeFinal.length; i++) {
            var campaign_id = this.state.mimicMergeFinal[i][0];
            var study_id = this.state.mimicMergeFinal[i][3];
            var hasFb = this.state.mimicMergeFinal[i][20] != 0 && this.state.mimicMergeFinal[i][20] != null && this.state.mimicMergeFinal[i][20] != '';
            var hasCl = this.state.mimicMergeFinal[i][52]  != 0 && this.state.mimicMergeFinal[i][52] != null && this.state.mimicMergeFinal[i][52] != '';
            emptyTemp.push(campaign_id +" ; "+ study_id + " ; " +hasFb+ " fb: " + this.state.mimicMergeFinal[i][20] + " ; " +hasCl+ " cl: " + this.state.mimicMergeFinal[i][52]);
            var filteredPreviousWeek = this.state.studyPatientMediaCSV.filter(
                function (el) {
                    return el[1] == study_id && el[0] == campaign_id;
                }
            );
            if (filteredPreviousWeek.length > 0) {
                if (hasFb) {
                    var filteredHasFb = filteredPreviousWeek.filter(function (el) {
                        return el[4] == "fb";
                    });

                    if (filteredHasFb.length == 0) {
                        var fbTemp = Array(
                            this.state.studyPatientsByMediaHeader.length
                        ).fill("");
                        fbTemp[0] = this.state.mimicMergeFinal[i][0];
                        fbTemp[1] = this.state.mimicMergeFinal[i][3];
                        fbTemp[2] = this.state.mimicMergeFinal[i][4];
                        fbTemp[3] = this.state.dateUseAsNow;
                        fbTemp[4] = "fb";
                        this.state.studyPatientMediaCSV.push(fbTemp);
                    }
                }
                if (hasCl) {
                    var filteredHasCl = filteredPreviousWeek.filter(function (el) {
                        return el[4] == "cl";
                    });
                    if (filteredHasCl.length == 0) {
                        var clTemp = Array(
                            this.state.studyPatientsByMediaHeader.length
                        ).fill("");
                        clTemp[0] = this.state.mimicMergeFinal[i][0];
                        clTemp[1] = this.state.mimicMergeFinal[i][3];
                        clTemp[2] = this.state.mimicMergeFinal[i][4];
                        clTemp[3] = this.state.dateUseAsNow;
                        clTemp[4] = "cl";
                        this.state.studyPatientMediaCSV.push(clTemp);
                    }
                }
            } else {
                if (campaign_id && study_id) {
                    veryempty.push(campaign_id+ " : " +study_id);
                    if (hasFb) {
                        var fbTemp = Array(
                            this.state.studyPatientsByMediaHeader.length
                        ).fill("");
                        fbTemp[0] = this.state.mimicMergeFinal[i][0];
                        fbTemp[1] = this.state.mimicMergeFinal[i][3];
                        fbTemp[2] = this.state.mimicMergeFinal[i][4];
                        fbTemp[3] = this.state.dateUseAsNow;
                        fbTemp[4] = "fb";
                        this.state.studyPatientMediaCSV.push(fbTemp);
                    }
                    if (hasCl) {
                        var clTemp = Array(
                            this.state.studyPatientsByMediaHeader.length
                        ).fill("");
                        clTemp[0] = this.state.mimicMergeFinal[i][0];
                        clTemp[1] = this.state.mimicMergeFinal[i][3];
                        clTemp[2] = this.state.mimicMergeFinal[i][4];
                        clTemp[3] = this.state.dateUseAsNow;
                        clTemp[4] = "cl";
                        this.state.studyPatientMediaCSV.push(clTemp);
                    }
                }
            }
        }
    };

    checkPreviousWeekMimic = (id) => {
        var filteredPreviousWeek = this.state.previousWeekMimicCSV.filter(
            function (el) {
                return el[3] == id;
            }
        );
        if (filteredPreviousWeek.length > 0) {
            var max_val = filteredPreviousWeek[0][0];
            var temp = filteredPreviousWeek[0];
            for (var i = 0; i < filteredPreviousWeek.length; i++) {
                if (max_val < filteredPreviousWeek[i][0]) {
                    max_val = filteredPreviousWeek[i][0];
                    temp = filteredPreviousWeek[i];
                }
            }
            return temp;
        }
        return null;
    };

    /**
     * STEP1: Flatten currentCpqCSV
     * And create new array for patients, prescreened, cnc by media name
     */
    step1FlattenCurrentCpqCSV = () => {
        console.log(">>>Start Step1 FlattenCurrentCpqCSV");

        var doneProcessing = [];
        var newCPQ = [];

        for (var i = 0; i < this.state.currentCpqCSV.length; i++) {
            var study = this.state.currentCpqCSV[i];

            var isProcessed = doneProcessing.find(function (el) {
                return (
                    study[0] == el[0] && //campaignID
                    study[3] == el[3] && //studyID
                    study[4] == el[4] && //siteID
                    study[5] == el[5] && //central
                    study[6] == el[6]
                ); //pqs
            });

            if (isProcessed) {
                continue;
            } else {
                var findStudy = this.state.currentCpqCSV.filter(function (
                    el,
                    index
                ) {
                    return (
                        study[0] == el[0] && //campaignID
                        study[3] == el[3] && //studyID
                        study[4] == el[4] && //siteID
                        study[5] == el[5] && //central
                        study[6] == el[6]
                    ); //pqs
                });

                if (findStudy.length) {
                    doneProcessing.push(findStudy[0]);

                    var tempSumPPSCNC = [0, 0, 0];
                    var tempByMediaPPSCNC = {
                        campaignID: study[0],
                        studyID: study[3],
                        patientsByMedia: [],
                    };
                    for (var j = 0; j < findStudy.length; j++) {
                        tempSumPPSCNC[0] += parseInt(findStudy[j][15]); //patients
                        tempSumPPSCNC[1] += parseInt(findStudy[j][16]); //prescreened
                        tempSumPPSCNC[2] += parseInt(findStudy[j][17]); //cnc

                        tempByMediaPPSCNC.patientsByMedia.push([
                            findStudy[j][0],
                            findStudy[j][3],
                            findStudy[j][10] == "" ? "fb" : findStudy[j][10],
                            parseInt(findStudy[j][15]),
                            parseInt(findStudy[j][16]),
                            parseInt(findStudy[j][17]),
                        ]);
                    }
                    study.splice(10, 1); //REMOVE UTM COLUMN
                    study[14] = tempSumPPSCNC[0]; //new patients
                    study[15] = tempSumPPSCNC[1]; //new prescreened
                    study[16] = tempSumPPSCNC[2]; //new cnc

                    this.state.patientsPreScreenedCNCByMediaName.push(
                        tempByMediaPPSCNC
                    );
                    newCPQ.push(study);
                }
            }
        }

        this.state.currentCpqCSV = newCPQ;
    };

    /**
     * STEP2: MERGE currentCpqCSV AND pacDailyUTMCSV
     * Columns: newSignUp, sourceName, isMediaTracking, tierNumber, sponsor
     */
    step2MergePACDailyUTMCSV = () => {
        console.log(">>>Start Step2 MergePACDailyUTMCSV");

        var matchedStudyIDs = [];

        var pacDailyUTMCSV = this.state.pacDailyUTMCSV;

        for (var z = 0; z < this.state.currentCpqCSV.length; z++) {
            var cpqEl = this.state.currentCpqCSV[z];
            var tempStudyID = cpqEl[3];
            var tempByMediaSignUp = { studyID: tempStudyID, signUp: [] };

            var firstIndex = this.state.currentCpqCSV.findIndex(function (
                el,
                index
            ) {
                return tempStudyID == el[3];
            });

            var filterStudy = this.state.currentCpqCSV.filter(function (el) {
                return tempStudyID == el[3];
            });

            var matchFound = pacDailyUTMCSV.filter(function (pacEl) {
                return pacEl[0] == tempStudyID;
            });

            if (matchFound.length) {
                //FOUND
                var sum = 0;
                for (var i = matchFound.length - 1; i >= 0; i--) {
                    sum += parseInt(matchFound[i][1]);

                    tempByMediaSignUp.signUp.push([
                        tempStudyID,
                        matchFound[i][4] == "" ? "fb" : matchFound[i][4],
                        parseInt(matchFound[i][1]),
                    ]);
                }
                this.state.patientsSignUpByMediaName.push(tempByMediaSignUp);

                matchedStudyIDs.push(tempStudyID);

                if (filterStudy.length > 1 && firstIndex == z) {
                    sum = 0; //INITIAL SUM IS SET O, ASSUMED THIS IS THE PREVIOUS CAMPAIGN ID
                }

                //SIGNUPS  SOURCENAME        ISMEDIATRACKING   TIERNUMBER        SPONSOR
                matchFound = [
                    sum,
                    matchFound[0][3],
                    matchFound[0][7],
                    matchFound[0][5],
                    matchFound[0][6],
                ];
            } else {
                //NOT FOUND
                matchFound = [0, "", "", "", "", "", ""];
            }

            cpqEl[17] = this.state.dateUseAsNow; //DATE
            cpqEl[18] = this.getDateFormatted(cpqEl[1]); //DATEFROMPARSED
            cpqEl[19] = this.getDateFormatted(cpqEl[2]); //DATEFROMPARSED

            // MERGE2 COLUMNS
            cpqEl[40] = matchFound[0]; //NEW SIGNUP
            cpqEl[41] = matchFound[1]; //SOURCE NAME
            cpqEl[42] = matchFound[2]; //IS MEDIA TRACKING
            cpqEl[43] = matchFound[3]; //TIER NUMBER
            cpqEl[44] = matchFound[4]; //SPONSOR

            this.state.currentCpqCSV[z] = cpqEl;
        }

        console.log(
            "Total MatchFound in PAC Daily UTM: " + matchedStudyIDs.length
        );

        this.processNotFoundPacDailyStudies(matchedStudyIDs);
    };

    processNotFoundPacDailyStudies = (matchedStudyIDs) => {
        var notFound = [];
        for (var i = 0; i < this.state.pacDailyUTMCSV.length; i++) {
            var pacEl = this.state.pacDailyUTMCSV[i];
            var tempStudyID = pacEl[0];

            var matchFound = matchedStudyIDs.find(function (el) {
                return el == tempStudyID;
            });
            var matchDupe = notFound.find(function (_pacEl) {
                return _pacEl[0] == tempStudyID;
            });

            if (matchFound == undefined && matchDupe == undefined) {
                notFound.push(pacEl);
            }
        }
        this.state.notFoundLength = notFound.length;

        console.log(
            "Total Not Found in PAC Daily UTM: " + this.state.notFoundLength
        );

        if (notFound.length == 0) {
            console.log(">>>All PAC Daily UTM has been matched");

            this.step3MergeCraigslistAdspent();
        } else {
            console.log("!!!!! Pac Daily Studies Not Found in CPQ");
            console.log(
                "!!!!! These studies are not added on the daily CPQ data"
            );
            console.log(notFound);

            this.step3MergeCraigslistAdspent();
        }
    };

    //GET THE INFO OF THE STUDIES IN PAC DAILY THAT IS NOT ON CPQ
    sendPacDailyMergeNotFoundRequest = (tempNotFound, index) => {
        var studyID = tempNotFound[0];
        var url =
            "https://api.studykik.com/api/v1/studies/" +
            studyID +
            "?filter={%22include%22:[{%22relation%22:%22campaigns%22,%22scope%22:{%22order%22:%22orderNumber%20DESC%22}},{%22relation%22:%22protocol%22},{%22relation%22:%22site%22},{%22relation%22:%22sources%22},{%22relation%22:%22sponsor%22},{%22relation%22:%22indication%22}]}";
        fetch(url, {
            headers: {
                Accept: "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                Authorization: this.state.studykikAuth,
            },

            credentials: "include",
        })
            .then((response) => response.json())
            .then((json) => {
                json["tempNotFound"] = tempNotFound;
                var newCSVValue = [];

                var campaign =
                    json.campaigns && json.campaigns.length
                        ? json.campaigns[0]
                        : "";
                newCSVValue[0] = campaign.id;
                newCSVValue[1] = this.getDateToUTCSK(campaign.startDate);
                newCSVValue[2] = this.getDateToUTCSK(campaign.endDate);
                newCSVValue[3] = json.id;
                newCSVValue[4] = json.site_id;
                newCSVValue[5] = campaign.central ? "TRUE" : "FALSE";
                newCSVValue[6] = campaign.patientQualificationSuite
                    ? "TRUE"
                    : "FALSE";
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
                newCSVValue[18] = campaign.startDate;
                newCSVValue[19] = campaign.endDate;
                newCSVValue[20] = 0;

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

                newCSVValue[32] = tempNotFound[1]; //New Patient Acc
                newCSVValue[33] = 0;
                newCSVValue[34] = 0;
                newCSVValue[35] = 0;
                newCSVValue[36] = 0;
                newCSVValue[37] = 0;
                newCSVValue[38] = 0;
                newCSVValue[39] = 0;

                //CALCULATE FOR TOTAL SIGNUPS AND SIGNUPS BY MEDIA NAME
                var matchFound = this.state.pacDailyUTMCSV.filter(function (
                    pacEl
                ) {
                    return pacEl[0] == tempNotFound[0];
                });
                var sum = 0;
                if (matchFound.length) {
                    //FOUND
                    var tempByMediaSignUp = { studyID: studyID, signUp: [] };
                    for (var i = matchFound.length - 1; i >= 0; i--) {
                        sum += parseInt(matchFound[i][1]);

                        tempByMediaSignUp.signUp.push([
                            studyID,
                            matchFound[i][4] == "" ? "fb" : matchFound[i][4],
                            parseInt(matchFound[i][1]),
                        ]);
                    }
                    this.state.patientsSignUpByMediaName.push(
                        tempByMediaSignUp
                    );
                }

                newCSVValue[40] = sum;
                newCSVValue[41] = tempNotFound[3];
                newCSVValue[42] = tempNotFound[7];
                newCSVValue[43] = tempNotFound[5];
                newCSVValue[44] = tempNotFound[6];

                this.state.currentCpqCSV.push(newCSVValue);
                if (index == this.state.notFoundLength - 1) {
                    console.log(">>>Done all sendPacDailyMergeNotFoundRequest");
                    this.step3MergeCraigslistAdspent();
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    /**
     * STEP3: MERGE CRAIGSLIST ADSPENT AND COUNT REPOSTS
     * Columns: clAdspent, clCummTotalSpent, clInitialSpent, clRepost
     */
    step3MergeCraigslistAdspent = () => {
        console.log(">>>Start Step3 MergeCraigslistAdspent");
        var _this = this;

        var craigslistAdSpentCSV = this.state.craigslistAdSpentCSV;
        var dateUseAsNow = new Date(this.state.dateUseAsNow + " 00:00:00");

        var temparr = [];
        var clAdDiscrepancy = [];
        for (var i = 0; i < this.state.currentCpqCSV.length; i++) {
            var temp = this.state.currentCpqCSV[i];
            var totalAdSpentByStudy = 0;
            var totalLatestInitSpent = 0;

            var firstIndex = this.state.currentCpqCSV.findIndex(function (
                el,
                index
            ) {
                return temp[3] == el[3];
            });

            var filterStudy = this.state.currentCpqCSV.filter(function (el) {
                return temp[3] == el[3];
            });

            //FILTER BY STUDY ID
            var filteredCraigslistAdSpentCSV = craigslistAdSpentCSV.filter(
                function (el) {
                    return el[1] == temp[3];
                }
            );

            //FIND VALUE WITH MAX CL START DATE
            var filteredCraigslistMaxCLStartDate = null;
            var filteredCraigslistStartDateLessDateNow = null;
            if (filteredCraigslistAdSpentCSV.length) {
                filteredCraigslistMaxCLStartDate =
                    filteredCraigslistAdSpentCSV[0];
                filteredCraigslistStartDateLessDateNow =
                    filteredCraigslistAdSpentCSV[0];
                totalAdSpentByStudy = Number(
                    filteredCraigslistAdSpentCSV[0][6].replace(/[^0-9.-]+/g, "")
                );

                var tempDate = new Date(
                    filteredCraigslistAdSpentCSV[0][4] + " 00:00:00"
                );
                totalLatestInitSpent =
                    dateUseAsNow.getTime() === tempDate.getTime()
                        ? parseFloat(filteredCraigslistAdSpentCSV[0][6])
                        : 0;

                for (var z = 1; z < filteredCraigslistAdSpentCSV.length; z++) {
                    var prevDate = new Date(
                        filteredCraigslistMaxCLStartDate[4] + " 00:00:00"
                    );
                    var currDate = new Date(
                        filteredCraigslistAdSpentCSV[z][4] + " 00:00:00"
                    );

                    filteredCraigslistMaxCLStartDate =
                        currDate >= prevDate
                            ? filteredCraigslistAdSpentCSV[z]
                            : filteredCraigslistMaxCLStartDate;

                    filteredCraigslistStartDateLessDateNow =
                        currDate <= dateUseAsNow
                            ? filteredCraigslistAdSpentCSV[z]
                            : filteredCraigslistStartDateLessDateNow;

                    totalLatestInitSpent +=
                        dateUseAsNow.getTime() === currDate.getTime()
                            ? parseFloat(filteredCraigslistAdSpentCSV[z][6])
                            : 0;

                    totalAdSpentByStudy +=
                        currDate <= dateUseAsNow
                            ? parseFloat(filteredCraigslistAdSpentCSV[z][6])
                            : 0; //Number(filteredCraigslistAdSpentCSV[z][6].replace(/[^0-9.-]+/g,"")) : 0;
                }
            }

            var maxCLStartDate = filteredCraigslistMaxCLStartDate
                ? new Date(filteredCraigslistMaxCLStartDate[4] + " 00:00:00")
                : null;
            var maxCurrStartDate = filteredCraigslistStartDateLessDateNow
                ? new Date(
                      filteredCraigslistStartDateLessDateNow[4] + " 00:00:00"
                  )
                : null;

            if (maxCurrStartDate && maxCurrStartDate <= dateUseAsNow) {
                var spent = filteredCraigslistStartDateLessDateNow
                    ? parseFloat(filteredCraigslistStartDateLessDateNow[6])
                    : 0; // Number(filteredCraigslistStartDateLessDateNow[6].replace(/[^0-9.-]+/g,"")) : 0;
                spent = filterStudy.length > 1 && firstIndex == i ? 0 : spent; //IF STUDY IS DUPE IN CPQ, SET TO 0

                totalLatestInitSpent =
                    filterStudy.length > 1 && firstIndex == i
                        ? 0
                        : totalLatestInitSpent;

                this.state.currentCpqCSV[i][50] = spent; //CURRENT RESPOST SPENT
                this.state.currentCpqCSV[i][51] = totalAdSpentByStudy; //TOTAL ADSPENT TILL CL START DATE
                this.state.currentCpqCSV[i][52] = totalLatestInitSpent; //(dateUseAsNow.getTime() === maxCurrStartDate.getTime()) ? spent : 0; //INITIAL SPENT OF THE STUDY
                this.state.currentCpqCSV[i][53] =
                    filteredCraigslistAdSpentCSV.length; //REPOST COUNT
            }

            if (maxCLStartDate > dateUseAsNow) {
                clAdDiscrepancy.push(filteredCraigslistAdSpentCSV[0][1]);
            }
        }

        if (clAdDiscrepancy.length) {
            console.log(
                "!!!!! CL Ad Spent Discrepancy: Found in CL but Ad is not yet active, Study is in CPQ"
            );
            console.log(clAdDiscrepancy);
        }

        clAdDiscrepancy = [];
        //Ad Spent Discrepancy: CL Start Date is active in CL but Study not found in CPQ
        var filteredActiveCL = craigslistAdSpentCSV.filter(function (el) {
            var startDate = new Date(el[4] + " 00:00:00");
            return startDate >= dateUseAsNow;
        });
        for (var i = 0; i < filteredActiveCL.length; i++) {
            var tempStudyID = filteredActiveCL[i][1];
            var findStudy = this.state.currentCpqCSV.find(function (el) {
                return el[3] == tempStudyID;
            });
            if (findStudy == undefined) {
                clAdDiscrepancy.push(tempStudyID);
            }
        }

        if (clAdDiscrepancy.length) {
            console.log(
                "!!!!! CL Ad Spent Discrepancy: Active CL AdSpent but Study is not in CPQ"
            );
            console.log(clAdDiscrepancy);
        }

        this.step4KenshooAdspent();
        this.step5AccumulationFromPrevDay();
    };

    /**
     * STEP4: MERGE KENSHOO ADSPENT FOR FACEBOOK
     * Columns: adspent
     */
    step4KenshooAdspent = () => {
        console.log(">>>Start Step4 Merge KenshooAdspent");
        //adspent column 20
        for (var i = 0; i < this.state.currentCpqCSV.length; i++) {
            var studyID = this.state.currentCpqCSV[i][3];

            var firstIndex = this.state.currentCpqCSV.findIndex(function (
                el,
                index
            ) {
                return studyID == el[3];
            });

            var filterStudy = this.state.currentCpqCSV.filter(function (el) {
                return studyID == el[3];
            });

            if (filterStudy.length > 1 && firstIndex == i) {
                continue;
            } else {
                var filterKenshoo = this.state.kenshooSpentCSV.filter(function (
                    el
                ) {
                    return el[1].includes(studyID);
                });

                if (filterKenshoo && filterKenshoo.length) {
                    var sumSpent = 0;
                    sumSpent = filterKenshoo.reduce(function (total, current) {
                        return total + parseFloat(current[3]);
                    }, 0);

                    this.state.currentCpqCSV[i][20] = sumSpent;
                }
            }
        }

        this.checkNoMatchKenshooSpent();
    };

    checkNoMatchKenshooSpent = () => {
        var noMatchCPQ = [];
        for (var i = 0; i < this.state.kenshooSpentCSV.length; i++) {
            var tempLine = this.state.kenshooSpentCSV[i];

            var findCL = this.state.currentCpqCSV.find(function (el) {
                return tempLine[1].includes(el[3]);
            });

            if (findCL == undefined && parseFloat(tempLine[3]) > 0) {
                noMatchCPQ.push([tempLine[1], tempLine[3]]);
            }
        }

        console.log("!!!!! NO MATCH CPQ STUDIES WITH FB (KENSHOO) SPENT");
        console.log(noMatchCPQ);
    };

    /**
     * STEP5: ACCUMULATE PREVIOUS DAY CPQ TO CURRENT CPQ CSV
     * Columns: patients_acc, prescreened_acc, cnc_acc, New Patient_Acc Call, Attempted_Acc, DNQ_Acc, Action Needed_Acc, Scheduled_Acc, Consented_Acc, Screen Failed_Acc, Randomized_Acc
     */
    step5AccumulationFromPrevDay = () => {
        console.log(">>>Start Step5 AccumulationFromPrevDay");
        var notFound = [];
        //NOTFOUNDLENGTH IS # OF PAC DAILY STUDIES THAT WERE NOT IN CPQ
        for (
            var i = 0;
            i < this.state.currentCpqCSV.length - this.state.notFoundLength;
            i++
        ) {
            var currDayStudy = this.state.currentCpqCSV[i];
            var prevDayStudy = this.state.previousCpqCSV.find(function (el) {
                return el[0] == currDayStudy[0] && el[3] == currDayStudy[3];
            });

            if (prevDayStudy) {
                var index = 14; //Patient,Prescreened,CNC Index
                for (var j = 0; j < 3; j++) {
                    this.state.currentCpqCSV[i][21 + j] =
                        currDayStudy[index + j] - prevDayStudy[index + j] < 0
                            ? 0
                            : currDayStudy[index + j] - prevDayStudy[index + j];
                }

                var index = 24; //Raw Patient Categories Index, 2020-02-05 Defaulted to 0 because of API restriction
                for (var j = 0; j < 8; j++) {
                    this.state.currentCpqCSV[i][32 + j] = 0; 
                }
            } else {
                var index = 14; //Patient,Prescreened,CNC Index
                for (var j = 0; j < 3; j++) {
                    this.state.currentCpqCSV[i][21 + j] =
                        currDayStudy[index + j];
                }

                var index = 24; //Raw Patient Categories Index, 2020-02-05 Defaulted to 0 because of API restriction
                for (var j = 0; j < 8; j++) {
                    this.state.currentCpqCSV[i][32 + j] = 0;
                }

                notFound.push(this.state.currentCpqCSV[i]);
            }
        }
        this.step6AccumulationPatientNewSignUpMediaName();
    };

    /**
     * GENERATES NEW CSV FILE FOR STUDY PATIENT MEDIA TRACKING
     */
    step6AccumulationPatientNewSignUpMediaName = () => {
        console.log(">>>Start Step6 AccumulationPatientNewSignUpMediaName");
        this.state.studyPatientsByMedia = [];
        for (var i = 0; i < this.state.currentCpqCSV.length; i++) {
            var currDayStudy = this.state.currentCpqCSV[i];
            var prevDayStudy = this.state.studyPatientMediaCSV.filter(function (
                el
            ) {
                return el[0] == currDayStudy[0] && el[1] == currDayStudy[3]; //CAMPAIGNID AND STUDYID
            });

            var patients = this.state.patientsPreScreenedCNCByMediaName.find(
                function (el) {
                    return (
                        el.campaignID == currDayStudy[0] &&
                        el.studyID == currDayStudy[3]
                    );
                }
            );

            var patientSignUp = this.state.patientsSignUpByMediaName.find(
                function (el) {
                    return el.studyID == currDayStudy[3];
                }
            );

            var firstIndex = this.state.currentCpqCSV.findIndex(function (
                el,
                index
            ) {
                return currDayStudy[3] == el[3];
            });

            var filterStudy = this.state.currentCpqCSV.filter(function (el) {
                return currDayStudy[3] == el[3];
            });

            for (var z = 0; z < this.state.mediaNamesTracked.length; z++) {
                var currentMediaName = this.state.mediaNamesTracked[z];
                var tempMedia = [];

                tempMedia[0] = currDayStudy[0]; //CAMPAIGNID
                tempMedia[1] = currDayStudy[3]; //STUDYID
                tempMedia[2] = currDayStudy[4]; //SITE
                tempMedia[3] = this.state.dateUseAsNow; //DATE
                tempMedia[4] = currentMediaName; //MEDIA NAME

                //PATIENT, PRESCREENED, CNC VALUES
                var prevStudyMedia = prevDayStudy.filter(function (el) {
                    return el[4].toLowerCase() == currentMediaName; //MEDIA NAME
                });

                var prevLatestStudyMedia = prevStudyMedia.length
                    ? prevStudyMedia[0]
                    : null;

                if (prevStudyMedia.length > 1) {
                    //FIND MAX DATE VALUE
                    for (var d = 1; d < prevStudyMedia.length; d++) {
                        var currDate = new Date(
                            prevStudyMedia[d][3] + " 00:00:00"
                        );
                        var maxDate = new Date(
                            prevLatestStudyMedia[3] + " 00:00:00"
                        );
                        prevLatestStudyMedia =
                            currDate >= maxDate
                                ? prevStudyMedia[d]
                                : prevLatestStudyMedia;
                    }
                }

                var patientMediaValue = patients
                    ? patients.patientsByMedia.find(function (el) {
                          return el[2].toLowerCase() == currentMediaName;
                      })
                    : undefined;

                var patientSignUpMedia = patientSignUp
                    ? patientSignUp.signUp.find(function (el) {
                          return el[1].toLowerCase() == currentMediaName;
                      })
                    : undefined;

                var isPatientMedia = false;
                var isSignUpMedia = false;

                if (
                    prevLatestStudyMedia == null &&
                    patientMediaValue != undefined
                ) {
                    //IT IS A NEW ENTRY

                    isPatientMedia = true;
                    tempMedia[5] = patientMediaValue[3];
                    tempMedia[6] = patientMediaValue[4];
                    tempMedia[7] = patientMediaValue[5];

                    tempMedia[8] = patientMediaValue[3];
                    tempMedia[9] = patientMediaValue[4];
                    tempMedia[10] = patientMediaValue[5];
                } else if (
                    prevLatestStudyMedia != null &&
                    patientMediaValue != undefined
                ) {
                    //DEAL WITH PREVIOUS STUDY MEDIA VALUE

                    isPatientMedia = true;
                    tempMedia[5] = patientMediaValue[3];
                    tempMedia[6] = patientMediaValue[4];
                    tempMedia[7] = patientMediaValue[5];

                    tempMedia[8] =
                        patientMediaValue[3] - prevLatestStudyMedia[5] > 0
                            ? patientMediaValue[3] - prevLatestStudyMedia[5]
                            : 0;
                    tempMedia[9] =
                        patientMediaValue[4] - prevLatestStudyMedia[6] > 0
                            ? patientMediaValue[4] - prevLatestStudyMedia[6]
                            : 0;
                    tempMedia[10] =
                        patientMediaValue[5] - prevLatestStudyMedia[7] > 0
                            ? patientMediaValue[5] - prevLatestStudyMedia[7]
                            : 0;
                } else if (patientMediaValue == undefined) {
                    //CHECK IF STUDY HAS CL SPENT, AND DEFAULT THE TRACKING TO 0
                    if (
                        ((currentMediaName.includes("cl") &&
                            currDayStudy[51] > 0) ||
                            (currentMediaName == "fb" &&
                                currDayStudy[20] > 0)) &&
                        (filterStudy.length == 1 ||
                            (filterStudy.length > 1 && firstIndex != i))
                    ) {
                        isPatientMedia = true;
                        tempMedia[5] = 0;
                        tempMedia[6] = 0;
                        tempMedia[7] = 0;

                        tempMedia[8] = 0;
                        tempMedia[9] = 0;
                        tempMedia[10] = 0;
                    }
                }

                //check for signup
                if (
                    patientSignUpMedia != undefined &&
                    (filterStudy.length == 1 ||
                        (filterStudy.length > 1 && firstIndex != i))
                ) {
                    isSignUpMedia = true;
                    tempMedia[11] = patientSignUpMedia[2]; //newPatient
                }

                if (isPatientMedia || isSignUpMedia) {
                    this.state.studyPatientsByMedia.push(tempMedia);
                }
            }
        }

        this.state.currentCpqCSV.unshift(this.state.headerToUse);
        this.finalizeMergedCSVFile(this.state.currentCpqCSV);
        this.finalizeMergedCSVFile(this.state.studyPatientsByMedia);
        console.log("DONE!");
    };

    /**
     * Migrate FB Signup of all PTSD Studies with CL Adspent and 0 FB Adspent to CL
     * Applied to a list of Study IDs based on All Craigslist Adspent sheet
     * STARTED ON: 01-27
     * ENDED ON: 01-30 DATA
     */
    step7TemporaryMigratePTSDFBSignupToCLSignUp = () => {
        console.log(">>>Start Step6 TemporaryMigratePTSDFBSignupToCLSignUp");

        var _this = this;
        var totalNewCLPush = [];
        var sumOfAllTransferedSignUp = 0;
        for (var i = 0; i < this.state.clPTSDProtocol_Watch.length; i++) {
            var clProtocol = this.state.clPTSDProtocol_Watch[i];
            var filterStudiesByProtocol = this.state.currentCpqCSV.filter(
                function (el) {
                    return el[9] == clProtocol;
                }
            );

            for (var k = 0; k < filterStudiesByProtocol.length; k++) {
                var foundStudy = filterStudiesByProtocol[k];
                //IF STUDY HAS CL SPENT BUT NO FB SPENT - wrong
                //IF STUDY FOUND UNDER THOSE PROTOCOL, MIGRATE FB SIGNUP TO CL IMMEDIATELY
                if (foundStudy) {
                    var studyPatientFB = this.state.studyPatientsByMedia.findIndex(
                        function (el) {
                            return (
                                el[0] == foundStudy[0] &&
                                el[1] == foundStudy[3] &&
                                el[4] == "fb"
                            ); //compare campaignID, studyID, medianame
                        }
                    );

                    var studyPatientCL = this.state.studyPatientsByMedia.findIndex(
                        function (el) {
                            return (
                                el[0] == foundStudy[0] &&
                                el[1] == foundStudy[3] &&
                                el[4] == "cl"
                            );
                        }
                    );

                    //IF STUDY HAS FB AND CL ENTRY IN studyPatientsByMedia
                    if (studyPatientFB != -1 && studyPatientCL != -1) {
                        var tempFBSignUp =
                            parseInt(
                                this.state.studyPatientsByMedia[
                                    studyPatientFB
                                ][11]
                            ) > 0
                                ? parseInt(
                                      this.state.studyPatientsByMedia[
                                          studyPatientFB
                                      ][11]
                                  )
                                : 0;
                        var tempCLSignUp =
                            parseInt(
                                this.state.studyPatientsByMedia[
                                    studyPatientCL
                                ][11]
                            ) > 0
                                ? parseInt(
                                      this.state.studyPatientsByMedia[
                                          studyPatientCL
                                      ][11]
                                  )
                                : 0;

                        this.state.studyPatientsByMedia[studyPatientCL][11] =
                            tempFBSignUp + tempCLSignUp;
                        this.state.studyPatientsByMedia[studyPatientFB][11] = 0;

                        console.log(
                            ">> FOUND STUDY WITH FB AND CL PRESENT IN studyPatientsByMedia " +
                                tempFBSignUp
                        );
                        sumOfAllTransferedSignUp += tempFBSignUp;
                        console.log(foundStudy[0] + " " + foundStudy[3]);
                    } else if (studyPatientFB != -1 && studyPatientCL == -1) {
                        var tempFBSignUp =
                            parseInt(
                                this.state.studyPatientsByMedia[
                                    studyPatientFB
                                ][11]
                            ) > 0
                                ? parseInt(
                                      this.state.studyPatientsByMedia[
                                          studyPatientFB
                                      ][11]
                                  )
                                : 0;

                        var newCLpush = [];
                        newCLpush[0] = this.state.studyPatientsByMedia[
                            studyPatientFB
                        ][0];
                        newCLpush[1] = this.state.studyPatientsByMedia[
                            studyPatientFB
                        ][1];
                        newCLpush[2] = this.state.studyPatientsByMedia[
                            studyPatientFB
                        ][2];
                        newCLpush[3] = this.state.studyPatientsByMedia[
                            studyPatientFB
                        ][3];
                        newCLpush[4] = "cl";
                        newCLpush[5] = tempFBSignUp; //patients
                        newCLpush[6] = 0;
                        newCLpush[7] = 0;
                        newCLpush[8] = tempFBSignUp; //patients_acc
                        newCLpush[9] = 0;
                        newCLpush[10] = 0;
                        newCLpush[11] = tempFBSignUp;

                        this.state.studyPatientsByMedia[studyPatientFB][11] = 0;
                        totalNewCLPush.push(newCLpush);

                        console.log(
                            ">> HERE ONLY FB IS PRESENT IN studyPatientsByMedia " +
                                tempFBSignUp
                        );
                        sumOfAllTransferedSignUp += tempFBSignUp;
                        console.log(foundStudy[0] + " " + foundStudy[3]);
                    }
                }
            }
        }

        this.state.studyPatientsByMedia = this.state.studyPatientsByMedia.concat(
            totalNewCLPush
        );

        console.log("sumOfAllTransferedSignUp!" + sumOfAllTransferedSignUp);
        console.log("DONE!");
    };

    //INITIAL DATA FOR 01-23
    step5InitialAccumulationPatientNewSignUpMediaName = () => {
        console.log(">>>Start Step5 AccumulationPatientNewSignUpMediaName");

        console.log("patientsPreScreenedCNCByMediaName");
        console.log(this.state.patientsPreScreenedCNCByMediaName);
        console.log("patientsSignUpByMediaName");
        console.log(this.state.patientsSignUpByMediaName);

        //no need for new patients to compare prev day
        for (var i = 0; i < this.state.currentCpqCSV.length; i++) {
            var fbArr = [];
            var clArr = [];

            var currDayStudy = this.state.currentCpqCSV[i];
            var prevDayStudy = this.state.previousCpqCSV.find(function (el) {
                return el[0] == currDayStudy[0] && el[3] == currDayStudy[3];
            });

            fbArr[0] = currDayStudy[0];
            fbArr[1] = currDayStudy[3];
            fbArr[2] = currDayStudy[4];
            fbArr[3] = this.state.dateUseAsNow;
            fbArr[4] = "fb";

            clArr[0] = currDayStudy[0];
            clArr[1] = currDayStudy[3];
            clArr[2] = currDayStudy[4];
            clArr[3] = this.state.dateUseAsNow;
            clArr[4] = "cl";

            var patients = this.state.patientsPreScreenedCNCByMediaName.find(
                function (el) {
                    return (
                        el.campaignID == currDayStudy[0] &&
                        el.studyID == currDayStudy[3]
                    );
                }
            );

            var patientFB = patients
                ? patients.patientsByMedia.find(function (el) {
                      return el[2] == "fb";
                  })
                : null;

            var patientCL = patients
                ? patients.patientsByMedia.find(function (el) {
                      return el[2] == "cl";
                  })
                : null;

            var patientOthers = patients
                ? patients.patientsByMedia.find(function (el) {
                      return el[2] != "fb" && el[2] != "cl";
                  })
                : null;

            if (patientOthers != null && patientOthers != undefined) {
                console.log("WARNING! OTHER MEDIAS FOUND IN UTM");
                console.log(patientOthers);
            }

            var firstIndex = this.state.currentCpqCSV.findIndex(function (
                el,
                index
            ) {
                return currDayStudy[3] == el[3];
            });

            var filterStudy = this.state.currentCpqCSV.filter(function (el) {
                return currDayStudy[3] == el[3];
            });

            var patientSignUp = this.state.patientsSignUpByMediaName.find(
                function (el) {
                    return el.studyID == currDayStudy[3];
                }
            );

            var patientSignUpFB = patientSignUp
                ? patientSignUp.signUp.find(function (el) {
                      return el[1] == "fb";
                  })
                : null;

            var patientSignUpCL = patientSignUp
                ? patientSignUp.signUp.find(function (el) {
                      return el[1] == "cl";
                  })
                : null;

            var patientSignUpOthers = patientSignUp
                ? patientSignUp.signUp.find(function (el) {
                      return el[1] != "fb" && el[1] != "cl";
                  })
                : null;

            if (
                patientSignUpOthers != null &&
                patientSignUpOthers != undefined
            ) {
                console.log("WARNING! OTHER MEDIAS FOUND IN PAC DAILY");
                console.log(patientSignUpOthers);
            }

            if (patientFB) {
                this.state.currentCpqCSV[i][54] = patientFB[3];
                this.state.currentCpqCSV[i][55] = patientFB[4];
                this.state.currentCpqCSV[i][56] = patientFB[5];

                fbArr[5] = patientFB[3];
                fbArr[6] = patientFB[4];
                fbArr[7] = patientFB[5];
            }

            this.state.currentCpqCSV[i][60] =
                patientSignUpFB &&
                (filterStudy.length == 1 ||
                    (filterStudy.length > 1 && firstIndex != i))
                    ? patientSignUpFB[2]
                    : 0; //newPatients_FB
            fbArr[11] = this.state.currentCpqCSV[i][60];

            if (patientCL != null && patientCL != undefined) {
                this.state.currentCpqCSV[i][61] = patientCL[3];
                this.state.currentCpqCSV[i][62] = patientCL[4];
                this.state.currentCpqCSV[i][63] = patientCL[5];

                //01-23 ONLY
                this.state.currentCpqCSV[i][64] = patientCL[3];
                this.state.currentCpqCSV[i][65] = patientCL[4];
                this.state.currentCpqCSV[i][66] = patientCL[5];

                clArr[5] = patientCL[3];
                clArr[6] = patientCL[4];
                clArr[7] = patientCL[5];

                clArr[8] = patientCL[3];
                clArr[9] = patientCL[4];
                clArr[10] = patientCL[5];
            } else {
                this.state.currentCpqCSV[i][61] = 0;
                this.state.currentCpqCSV[i][62] = 0;
                this.state.currentCpqCSV[i][63] = 0;

                //01-23 ONLY
                this.state.currentCpqCSV[i][64] = 0;
                this.state.currentCpqCSV[i][65] = 0;
                this.state.currentCpqCSV[i][66] = 0;

                clArr[5] = 0;
                clArr[6] = 0;
                clArr[7] = 0;

                clArr[8] = 0;
                clArr[9] = 0;
                clArr[10] = 0;
            }

            this.state.currentCpqCSV[i][67] =
                patientSignUpCL &&
                (filterStudy.length == 1 ||
                    (filterStudy.length > 1 && firstIndex != i))
                    ? patientSignUpCL[2]
                    : 0; //newPatients_CL
            clArr[11] = this.state.currentCpqCSV[i][67];

            //01-23 ONLY
            this.state.currentCpqCSV[i][57] =
                this.state.currentCpqCSV[i][21] -
                    this.state.currentCpqCSV[i][64] <
                0
                    ? 0
                    : this.state.currentCpqCSV[i][21] -
                      this.state.currentCpqCSV[i][64];
            this.state.currentCpqCSV[i][58] =
                this.state.currentCpqCSV[i][22] -
                    this.state.currentCpqCSV[i][65] <
                0
                    ? 0
                    : this.state.currentCpqCSV[i][22] -
                      this.state.currentCpqCSV[i][65];
            this.state.currentCpqCSV[i][59] =
                this.state.currentCpqCSV[i][23] -
                    this.state.currentCpqCSV[i][66] <
                0
                    ? 0
                    : this.state.currentCpqCSV[i][23] -
                      this.state.currentCpqCSV[i][66];

            fbArr[8] = this.state.currentCpqCSV[i][57];
            fbArr[9] = this.state.currentCpqCSV[i][58];
            fbArr[10] = this.state.currentCpqCSV[i][59];

            this.state.studyPatientsByMedia.push(fbArr);
            this.state.studyPatientsByMedia.push(clArr);
        }

        console.log(this.state.currentCpqCSV);
        this.state.currentCpqCSV.unshift(this.state.headerToUse);
        this.finalizeMergedCSVFile(this.state.currentCpqCSV);
        this.finalizeMergedCSVFile(this.state.studyPatientsByMedia);
    };

    getLevel = (levelID) => {
        var levels = [
            "Bronze", //1
            "Silver", //2
            "Gold", //3
            "Platinum", //4
            "Diamond", //5
            "Ruby", //6
            "Platinum Plus", //7
            "Diamond Plus", //8
            "Ruby Plus", //9
        ];

        return levels[levelID - 1];
    };

    getDateToUTCSK = (date) => {
        var dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        var monthName = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "June",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        var _date = new Date(date);
        var day = _date.getUTCDate();
        var dayVal = dayName[_date.getUTCDay()];
        var monVal = monthName[_date.getUTCMonth()];
        var year = _date.getUTCFullYear();

        return (
            dayVal +
            " " +
            monVal +
            " " +
            day +
            " " +
            year +
            " 00:00:00 GMT+0000 (UTC)"
        );
    };

    //FORMAT DATE TO YYYY-MM-DD
    getDateFormatted = (date) => {
        var _date = new Date(date);
        var dayVal =
            _date.getUTCDate() < 10
                ? "0" + _date.getUTCDate()
                : _date.getUTCDate();
        var monVal =
            _date.getUTCMonth() + 1 < 10
                ? "0" + (_date.getUTCMonth() + 1)
                : _date.getUTCMonth() + 1;
        var year = _date.getUTCFullYear();

        return year + "-" + monVal + "-" + dayVal;
    };

    saveToCSV = () => {
        this.finalizeMergedCSVFile(this.state.currentCpqCSV);
    };

    finalizeMergedCSVFile = (saveFile) => {
        var rawFile = csv.fromArrays(saveFile);

        var link = document.createElement("a");
        link.href = URL.createObjectURL(
            new Blob([rawFile], {
                type: "text/csv",
            })
        );
        link.setAttribute("download", "my_data.csv");
        document.body.appendChild(link);
        link.click();
    };

    render() {
        return (
            <div className="process-csv" style={{ textAlign: "left" }}>
                <hr />

                <h2>Updated Overall Merging Process</h2>
                <p>
                    Change the value of studykik auth and daily date before
                    merging the files!
                </p>
                <p>Date: {this.state.dateUseAsNow}</p>

                <br />
                <div style={{ float: "left" }}>
                    <div>
                        Select Previous Final campaign_patient_quality CSV
                    </div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("previousCpqCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Current Raw campaign_patient_quality CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("currentCpqCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Pac Daily with UTM CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("pacDailyUTMCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Craigslist AdSpent CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("craigslistAdSpentCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Previous Day Study Patient Media CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("studyPatientMediaCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Kenshoo Spent CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("kenshooSpentCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                {this.state.isReadyToProces && (
                    <button onClick={this.startMergingProcess}>
                        Start Merging!
                    </button>
                )}
                <br />
                <br />
                <button onClick={this.saveToCSV}>Click To Save Data!</button>
                <hr />
                <br />
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select FINAL Campaign Patient Quality CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("finalCPQCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Campaign Cost Summary CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("campaignCostSummaryCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <button onClick={this.startCampaignCostMergingProcess}>
                    Start Merging of Campaign Cost Summary
                </button>
                <hr/>
                <br />
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select MIMIC_OF_MERGEDFINAL CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("mimicMergeFinal")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Craigslist AdSpent CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("craigslistAdSpentCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Kenshoo Spent CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("kenshooSpentCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select Past 7 days Mimic CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("previousWeekMimicCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <div style={{ float: "left" }}>
                    <div>Select QS Study Patient Media CSV</div>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={this.getFile("studyPatientMediaCSV")}
                        style={{ float: "left" }}
                    />
                </div>
                <br />
                <br />
                <br />
                <br />
                <button onClick={this.startMergingMimicFBCLProcess}>
                    Start Merging of Mimic, Fb, CL process
                </button>
            </div>
        );
    }
}

export default UpdatedCPQ_PAC_CLSpent_Merging;
