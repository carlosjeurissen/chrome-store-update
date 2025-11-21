import fs from 'node:fs';
import chromeWebstoreUpload from 'chrome-webstore-upload';

function getRefreshToken () {
  const standardInput = process.stdin;

  standardInput.setEncoding('utf-8');
  standardInput.setRawMode(true);

  console.log('Enter your refresh token');

  return new Promise((resolve) => {
    standardInput.on('data', (data) => {
      standardInput.setRawMode(false);
      console.log('Thanks! Uploading now...');
      resolve(data);
    });
  });
}

function readJsonFile (filePath) {
  try {
    const fileText = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileText);
  } catch (e) {
    console.log('Couldn\'t read json file: ' + e);
    return {};
  }
}

function getVersion () {
  const version = process.env.npm_package_version;
  if (version) return version;
  const packageJson = readJsonFile('./package.json');
  return packageJson.version || 'unknown';
}

function handleVars (input) {
  const version = getVersion();
  const home = process.env.HOME;
  return input.replace('{version}', version).replace('{home}', home);
}

export default async function updateAndPublish (parameters) {
  const credentials = parameters.credentials
    || readJsonFile(handleVars(parameters.credentialsPath));
  const refreshToken = credentials.refreshToken || await getRefreshToken();

  const webStoreApi = chromeWebstoreUpload({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    extensionId: parameters.extensionId,
    refreshToken: refreshToken,
  });

  const accessToken = await webStoreApi.fetchToken();

  const packageStream = parameters.package
    || fs.createReadStream(handleVars(parameters.packagePath));
  const uploadResult = await webStoreApi.uploadExisting(packageStream, accessToken);
  console.log(uploadResult);

  const publishResult = await webStoreApi.publish('default', accessToken);
  console.log(publishResult);
}
