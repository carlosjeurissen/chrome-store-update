const fs = require('fs')
const chromeWebstoreUpload = require('chrome-webstore-upload')

function getRefreshToken (parameters) {
  const standardInput = process.stdin

  standardInput.setEncoding('utf-8')
  standardInput.setRawMode(true)

  console.log('Enter your refresh token')

  return new Promise(function (resolve) {
    standardInput.on('data', function (data) {
      standardInput.setRawMode(false)
      console.log('Thanks! Uploading now...')
      resolve(data)
    })
  })
}

async function updateAndPublish (parameters) {
  const credentials = parameters.credentials || JSON.parse(fs.readFileSync(parameters.credentialsPath))
  const refreshToken = credentials.refreshToken || await getRefreshToken()

  const webStoreApi = chromeWebstoreUpload({
    'extensionId': parameters.extensionId,
    'clientId': credentials.clientId,
    'clientSecret': credentials.clientSecret,
    'refreshToken': refreshToken
  })

  const accessToken = await webStoreApi.fetchToken()

  const packageStream = parameters.package || fs.createReadStream(parameters.packagePath)
  const uploadResult = await webStoreApi.uploadExisting(packageStream, accessToken)
  console.log(uploadResult)

  const publishResult = await webStoreApi.publish('default', accessToken)
  console.log(publishResult)
}

const updatePackage = parameters => {
  return updateAndPublish(parameters)
    .catch(console.error)
    .then(process.exit)
}

exports.publish = updatePackage
module.exports = exports.publish
