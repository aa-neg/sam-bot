const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const kms = new AWS.KMS();
const slack = require("../common/slackApiWrapers.js");
const s3 = require("../common/s3Wrappers.js");

//Bucket name should be dynamically generated in the future
const bucketName = "sam.questions.hypothesis";

const simpleQueueName = "sentimentalsam-hypothesisteam";
const simpleQueueURL =
  "https://sqs.ap-southeast-2.amazonaws.com/235281544521/sentimentalsam-hypothesisteam";
const sqs = new AWS.SQS();
process.env.TZ = "Australia/Sydney";

function formattDate(date) {
  return (
    paddDate(date.getDate().toString()) +
    paddDate((date.getMonth() + 1).toString()) +
    date.getFullYear().toString()
  );
}

function paddDate(date) {
  if (date.length < 2) {
    return "0" + date;
  }
  return date;
}

function getQueueURL(queueName) {
  return new Promise((resolve, reject) => {
    const params = {
      QueueName: queueName
    };
    sqs.getQueueUrl(params, function(err, data) {
      if (err) {
        console.log("failed to get queue url", err);
        reject(err);
      } else {
        console.log("we have our queue url", data);
        resolve(data);
      }
    });
  });
}

function parseSecret(secret) {
  return new Promise(function(resolve, reject) {
    var blob = new Buffer(process.env[secret], "base64");
    let token = "";

    kms.decrypt(
      {
        CiphertextBlob: blob
      },
      function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data.Plaintext.toString("ascii"));
        }
      }
    );
  });
}

function uploadQuestionReference() {}

function returnCallbackResponse(callback, statusCode) {
  callback(null, {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function updateItemPointer() {}

function generateBucketKey(teamDomain, userId, questionType, epochKey) {
  return questionType + "/" + userId + "/" + epochKey;
}

function sendToSQS(body) {
  return new Promise((resolve, reject) => {
    if (body.questionType !== "offSchedule") {
      var params = {
        MessageBody: JSON.stringify(body),
        QueueUrl: simpleQueueURL,
        DelaySeconds: 0
      };
      sqs.sendMessage(params, (err, data) => {
        if (err) {
          console.log("failed to upload to queue", err);
          reject(err);
        } else {
          console.log("the resolution:", data);
          resolve(data);
        }
      });
    }
  });
}

function postConfirmationMessage(userDetails, questionDetils) {
  return new Promise((resolve, reject) => {
    return;
  });
}

function createEntry(userDetails, questionDetails) {
  let entry = questionDetails;
  entry.user = userDetails;
  entry.date = formattDate(new Date());
  entry.epochKey = new Date().getTime().toString();
  return entry;
}

function scheduleQuestion(decodedToken, details) {
  console.log("starting to create our entry?: ", decodedToken);
  console.log("details presented", details);
  const entry = createEntry(decodedToken.data.user, details);

  console.log("here is our entry we will be uploaing", entry);

  return s3
    .uploadObject({
      Bucket: bucketName,
      Key: generateBucketKey(
        decodedToken.data.team.id,
        decodedToken.data.user.id,
        entry.questionType,
        entry.epochKey
      ),
      Body: JSON.stringify(entry)
    })
    .then(() => {
      //Force formal questions for now.
      entry.questionType = "formal";
      if (entry.questionType !== "offSchedule") {
        sendToSQS(entry);
      }
    });
}

exports.handler = (event, context, callback) => {
  let body = JSON.parse(event.body);
  console.log("parsing the body token: ", body);

  const jwtChallenge = body.jwt;
  const questionDetails = body.details;

  parseSecret("JWT_SECRET")
    .then(jwtSecret => {
      return new Promise((resolve, reject) => {
        try {
          let decoded = jwt.verify(jwtChallenge, jwtSecret);
          resolve(decoded);
        } catch (err) {
          console.log("failed to decode jwtSecret: ", err);
          reject(err);
        }
      });
    })
    .then(decodedDetails => scheduleQuestion(decodedDetails, questionDetails))
    .then(() => returnCallbackResponse(callback, "200"))
    .catch(err => returnCallbackResponse(callback, "400"));
};
