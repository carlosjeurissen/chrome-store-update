#!/usr/bin/env node

// eslint-disable-next-line import/extensions
import updateAndPublish from './index.js';

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

// eslint-disable-next-line no-console, promise/catch-or-return
updateAndPublish(params).catch(console.error).then(() => process.exit(0));
