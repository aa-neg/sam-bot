const SqsURL =
  "https://sqs.ap-southeast-2.amazonaws.com/235281544521/sentimentalsam-hypothesisteam";
const bucketName = "sam.questions.hypothesis";

const request = require("../common/requestHelpers.js");
const slack = require("../common/slackApiWrapers.js");
const awsHelpers = require("../common/awsHelpers.js");
const questionTemplates = require("../common/questionTemplates.js");
const AWS = require("aws-sdk");
const sqs = new AWS.SQS();
const s3 = require("../common/s3Wrappers.js");
const functionName = "sam-modules-prod-handle-response";

process.env.TZ = "Australia/Sydney";

let botToken = "";

function generateInitialGreeting(name) {
  return "Hey " + name + "! just a question trying to get some feedback.";
}

function generateRandomGreeting(name) {
  return "Hey did you have a sec to answer a random question?";
}

function postMessages(event) {
  return new Promise(function(resolve, reject) {
    let questionTemplate = {
      value: "",
      greeting: ""
    };

    let userIdMapping = {};

    return slack
      .getUserList()
      .then(function(userList) {
        return Promise.all(
          userList.map(function(user) {
            userIdMapping[user.id] = user.name;
            // if (testMemberList.indexOf(user.name) > -1) {
            return slack.openChannel(user.id);
            // }
          })
        );
      })
      .then(() => {
        return getQuestionDetails(questionTemplate);
      })
      .then(() => {
        return slack.getIMchannelList();
      })
      .then(function(channels) {
        channels.forEach(function(channel) {
          //Tweak this to send to only yourself.
          // if (channel.user === "U41LE35LN") {
          if (channel.user !== "USLACKBOT") {
            console.log("we are about to post our question");
            console.log(questionTemplate.value);
            slack.postMessage(
              generateInitialGreeting(userIdMapping[channel.user]),
              channel.id,
              questionTemplate.value
            );
          }
        });
      });
  });
}

function generateRandomQuestion() {}

function createTemplateQuestionKey(userId, questionType, epochKey) {
  return questionType + "/" + userId + "/" + epochKey;
}

function generateQuestionTemplate(details, questionTemplate) {
  let currentDate = new Date();
  const responseBucketName = "sam.questions.hypothesis.responses";
  const dateKey =
    questionTemplates.paddDate(currentDate.getDate().toString()) +
    questionTemplates.paddDate((currentDate.getMonth() + 1).toString()) +
    currentDate.getFullYear().toString();

  let baseTemplate = {
    fallback: "You don't know how you feel?",
    callback_id:
      functionName +
      ":" +
      dateKey +
      ":" +
      details.user.id +
      ":" +
      responseBucketName,
    color: "#3AA3E3",
    attachment_type: "default",
    text: details.question
  };

  const templateKey = createTemplateQuestionKey(
    details.user.id,
    details.questionType,
    details.epochKey
  );

  baseTemplate.actions = details.options.map((option, index) => {
    return {
      name: templateKey,
      text: option.answer,
      type: "button",
      value: option.key
    };
  });

  questionTemplate.value = [baseTemplate];
  questionTemplate.greeting = generateInitialGreeting(details.user.name);
  return questionTemplate;
}

function getQuestionDetails(questionTemplate) {
  return new Promise((resolve, reject) => {
    const params = {
      QueueUrl: SqsURL,
      MaxNumberOfMessages: 1
    };

    sqs.receiveMessage(params, function(err, data) {
      if (err) {
        console.log("thing sfailed to send", err);
        reject(err);
      } else {
        console.log("here is our message", data);
        if (data.Messages && data.Messages.length) {
          let messageBody = data.Messages[0].Body;
          generateQuestionTemplate(JSON.parse(messageBody), questionTemplate);
          console.log("finished generating");
          resolve(deleteMessage(data.Messages[0].ReceiptHandle));
        } else {
          console.log("we should generate a random question");
          reject();
          //   resolve(generateRandomQuestion(questionTemplate));
        }
      }
    });
  });
}

function deleteMessage(receiptHandle) {
  return new Promise((resolve, reject) => {
    const params = {
      QueueUrl: SqsURL,
      ReceiptHandle: receiptHandle
    };
    sqs.deleteMessage(params, function(err, data) {
      if (err) {
        console.log("shit happened delete our message", err);
        reject(err);
      } else {
        console.log("things got deleted?");
        resolve(data);
      }
    });
  });
}

exports.handler = (event, context, callback) => {
  awsHelpers
    .decryptSlackToken()
    .then(function(token) {
      slack.setBotToken(token);
      return postMessages(event);
    })
    .then(function() {
      callback();
    })
    .catch(function(err) {
      console.log("Failed to post messages.");
      callback(err);
    });
};
