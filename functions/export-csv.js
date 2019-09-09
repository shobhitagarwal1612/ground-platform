/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const {db} = require('./common/context');
const CsvWriter = require('./common/csv-writer');

function exportCsv(req, res) {
  const {
    project: providedProjectId,
    featureType: providedFeatureTypeId,
    lang: desiredLanguage,
  } = req.query;

  // return res.status(500).send('Not supported yet.');
  console.log("Entered");
  // res.send({"status": "ok"});
  // return {"status": "ok"};
  let data = {};
  db.fetchProject(providedProjectId).then(
    project => {
      console.log("=== In fetchProject ===");
      if (!project.exists) {
        res.status(404).send('not found');
        return Promise.reject(new Error('project not found: ' + providedProjectId))
      }
      return Promise.all([
        fetchForm(project.id, featureType),
        project.ref.collection('records').get()
      ]);
    }
  ).then(
    results => {
      const form = results[0];
      for(var prop in form) {
        if(form.hasOwnProperty(prop)) {
          form[prop]['elements'].forEach(
            field => {
              data[field['id']] = [field['labels']['_']];
            }
          );
        }
      }
      data = data.slice(0, -1);

      const records = results[1];
      records.forEach(
        record => {
          const responses = record.get('responses');
          for(var response in responses) {
            data[prop].push(responses[response])
          }
        }
      );
      let csvWriter = new CsvWriter(providedProjectId, data, desiredLanguage ? desiredLanguage : '');
      return csvWriter.getTmpCsvFile();
    }
  ).then(
    tmpCsvFilePath => {
      return res.download(tmpCsvFilePath);
    }
  ).catch(
    err => {
      console.log(err);
      //return res.status(500).end();
      return res.send(data);
    }
  )
}


module.exports = exportCsv;