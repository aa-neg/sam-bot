const AWS = require("aws-sdk");
const kms = new AWS.KMS();

let decryptSlackToken = function() {
  return new Promise(function(resolve, reject) {
    var blob = new Buffer(process.env.SLACK_BOT_TOKEN, "base64");
    let botToken = "";

    kms.decrypt(
      {
        CiphertextBlob: blob
      },
      function(err, data) {
        if (err) {
          console.log("error during KMS decrypt.", err);
          reject(err);
        } else {
          botToken = data.Plaintext.toString("ascii");
          resolve(botToken);
        }
      }
    );
  });
};

module.exports = {
  decryptSlackToken: decryptSlackToken
};
