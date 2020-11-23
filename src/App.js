import React from 'react';
import logo from './logo.svg';
import './App.css';
import ProcessCsv from './js/ProcessCsv';
import MergeCsv from './js/MergeCsv';
import MergeAndUpdateCsv from './js/MergeAndUpdateCsv';
import PatientMediaTracking from './js/PatientMediaTracking';
import MergeCraigslistAdspent from './js/MergeCraigslistAdspent';

import UpdatedCPQ_PAC_CLSpent_Merging from './js/UpdatedCPQ_PAC_CLSpent_Merging';

import UpdatedCLSignUps from './js/UpdatedCLSignUps';

import TempCLSignUp from './js/TempCLSignUp';

import CheckKenshooSpentFromMerge4 from './js/CheckKenshooSpentFromMerge4';

//var csv = require('./jquery.csv.js');

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Studykik Data Processor
        </p>
        <UpdatedCPQ_PAC_CLSpent_Merging/>
      </header>
    </div>
  );
}

export default App;
