#!/usr/bin/env node
'use strict';

const fs = require('fs');
const chromeWebstoreUpload = require('chrome-webstore-upload');

const executionPath = process.argv[1].replace(/\\+/g, '/');
const usedAsCli = executionPath.endsWith('/chrome-store-update') || executionPath.endsWith('/chrome-store-update/index.js');

function getRefreshToken (parameters) {
  const standardInput = process.stdin;

  standardInput.setEncoding('utf-8');
  standardInput.setRawMode(true);

  console.log('Enter your refresh token');

  return new Promise(function (resolve) {
    standardInput.on('data', function (data) {
      standardInput.setRawMode(false);
      console.log('Thanks! Uploading now...');
      resolve(data);
    });
  });
}

function readJsonFile (filePath) {
  try {
    const fileText = fs.readFileSync(filePath);
    return JSON.parse(fileText);
  } catch (e) {
    console.log('Couldn\'t read json file: ' + e);
  }
}

function getVersion () {
  const version = process.env.npm_package_version;
  if (version) return version;
  const packageJson = readJsonFile('./package.json') || {};
  return packageJson.version || 'unknown';
}

function handleVars (input) {
  const version = getVersion();
  const home = process.env.HOME;
  return input.replace('{version}', version).replace('{home}', home);
}

async function updateAndPublish (parameters) {
  const credentials = parameters.credentials || readJsonFile(handleVars(parameters.credentialsPath)) || {};
  const refreshToken = credentials.refreshToken || await getRefreshToken();

  const webStoreApi = chromeWebstoreUpload({
    extensionId: parameters.extensionId,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    refreshToken: refreshToken
  });

  const accessToken = await webStoreApi.fetchToken();

  const packageStream = parameters.package || fs.createReadStream(handleVars(parameters.packagePath));
  const uploadResult = await webStoreApi.uploadExisting(packageStream, accessToken);
  console.log(uploadResult);

  const publishResult = await webStoreApi.publish('default', accessToken);
  console.log(publishResult);
}

const updatePackage = parameters => {
  return updateAndPublish(parameters)
    .catch(console.error)
    .then(function () {
      if (usedAsCli) {
        process.exit();
      }
    });
};

if (usedAsCli) {
  const argList = process.argv.join('=').split('=');
  const params = {};
  argList.forEach((item, index) => {
    if (item === '--credentials-path' || item === '-cp') {
      params.credentialsPath = argList[index + 1];
    } else if (item === '--package-path' || item === '-pp') {
      params.packagePath = argList[index + 1];
    } else if (item === '--extension-id' || item === '-e') {
      params.extensionId = argList[index + 1];
    }
  });
  updatePackage(params);
}

exports.publish = updatePackage;
module.exports = exports.publish;
