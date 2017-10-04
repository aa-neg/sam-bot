const AWS = require("aws-sdk");
const queryString = require("querystring");
const request = require("../common/requestHelpers.js");
const questionTemplates = require("../common/questionTemplates.js");
const awsHelpers = require("../common/awsHelpers.js");
const slack = require("../common/slackApiWrapers.js");
const s3 = require("../common/s3Wrappers.js");

let botToken = "";
process.env.TZ = "Australia/Sydney";

AWS.config.update({ region: process.env.AWS_REGION });

const updateMessage = "/api/chat.updateMessage";

function generateResponse(err) {
  let responseMessage = "";

  const response = {
    statusCode: "200",
    body: "",
    headers: {
      "Content-Type": "application/json"
    }
  };

  return response;
}

function generateSentimentModel(details) {
  const result = {
    sentiment: details.actions[0],
    user: details.user,
    channel: details.channel
  };

  return JSON.stringify(result);
}

const responses = [
  "Awesome thanks for your response!",
  "Yeah me too!",
  "Cool :)",
  "Nice answer!",
  "YES!",
  "Covfefe",
  "You know what! you look just dashing today :)",
  "Woop woop!"
];

function generateResponse(event) {
  if (event.original_message.attachments[0].actions.length === 2) {
    const responseIndex = questionTemplates.getRandomInt(0, responses.length);
    return responses[responseIndex];
  } else {
    return "Thank you for your time!";
  }
}

exports.handler = (event, context, callback) => {
  let bucketName = "";
  const payLoadSections = event.callback_id.split(":");
  const date = payLoadSections[1];
  let currentQuestion = "";
  if (payLoadSections[2]) {
    currentQuestion = payLoadSections[2];
  } else {
    currentQuestion = event.actions[0].name;
  }

  if (payLoadSections[3]) {
    bucketName = payLoadSections[3];
  }

  awsHelpers
    .decryptSlackToken()
    .then(function(token) {
      slack.setBotToken(token);

      const key = date + "/" + event.user.id + "/" + currentQuestion;
      console.log("here is our key ", key);
      console.log(
        "here is our sentiment model to upload",
        generateSentimentModel(event)
      );
      console.log("here is our bucket?", bucketName);

      return s3.uploadObject({
        Bucket: bucketName,
        Key: key,
        Body: generateSentimentModel(event)
      });
    })
    .then(function(result) {
      return slack.updateMessage(
        event.message_ts,
        event.channel.id,
        generateResponse(event)
      );
      // }
    })
    .then(function(result) {
      callback();
    })
    .catch(function(err) {
      console.error("Failed to handle response.", err);
      callback(err);
    });
};
