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
        <iframe src="https://www.upwork.com/ab/feed/jobs/rss?q=analytics&sort=recency&paging=0%3B10&api_params=1&securityToken=b4f42b611022e9d44f4e2d2a6ab64b00c56e61bd2b6ee837bfe7a04e13f54ad4d53bbed38f156705a29747f1e017e1881714f6b87c8a6c2d2e26e05dde1d5c72&userUid=424301271808458752&orgUid=424301271812653057"></iframe>
      </header>
    </div>
  );
}

export default App;
