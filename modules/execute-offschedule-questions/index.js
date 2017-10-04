const bucketName = "sam.questions.hypothesis";
const SqsURL =
  "https://sqs.ap-southeast-2.amazonaws.com/235281544521/sentimentalsam-hypothesisteam";

const request = require("../common/requestHelpers.js");
const slack = require("../common/slackApiWrapers.js");
const awsHelpers = require("../common/awsHelpers.js");
const questionTemplates = require("../common/questionTemplates.js");
const AWS = require("aws-sdk");
const sqs = new AWS.SQS();
const s3 = require("../common/s3Wrappers.js");
const functionName = "sam-modules-prod-handle-response";

const postedQuestionKey = "postedQuestions/basePostQuestionObject.json";

process.env.TZ = "Australia/Sydney";

let botToken = "";

function generateInitialGreeting(name) {
  return "Hey " + name + "! Hope life is awesome.";
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function getPostedQuestions() {
  return s3.getObject({
    Bucket: bucketName,
    Key: postedQuestionKey
  });
}

function updatePostedQuestions(newQuestion) {
  return getPostedQuestions().then(oldList => {
    oldList.keys.push(newQuestion.Key);
    return s3.uploadObject({
      Bucket: bucketName,
      Key: postedQuestionKey,
      Body: JSON.stringify(oldList)
    });
  });
}

function generateTemplate(questionKey, questionTemplate) {
  return new Promise((resolve, reject) => {
    console.log("our details required", questionKey);

    s3
      .getObject({
        Bucket: bucketName,
        Key: questionKey.Key
      })
      .then(question => {
        console.log("here is the actual question", question);
        generateQuestionTemplate(question, questionTemplate);
        console.log("our created questionTempalte: ", questionTemplate);
        resolve();
      });
  });
}

function determineQuestion() {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Delimiter: ",",
      Prefix: "offSchedule"
    };

    s3.listObjects(params).then(listings => {
      getPostedQuestions().then(postedQuestionList => {
        const potentialQuestions = listings.Contents.filter(question => {
          if (postedQuestionList.keys.indexOf(question.Key) === -1) {
            return true;
          } else {
            return false;
          }
        });

        if (potentialQuestions.length) {
          const randomQuestion =
            potentialQuestions[getRandomInt(0, potentialQuestions.length)];
          console.log("our random question found: ", randomQuestion);
          resolve(randomQuestion);
        } else {
          reject();
        }
      });
    });
  });
}

function postMessages(event) {
  return new Promise(function(resolve, reject) {
    let questionTemplate = {
      value: "",
      greeting: ""
    };

    let userIdMapping = {};
    let questionKey = {};

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
        return determineQuestion();
      })
      .then(question => {
        questionKey = question;
        return generateTemplate(question, questionTemplate);
      })
      .then(() => {
        return slack.getIMchannelList();
      })
      .then(function(channels) {
        channels.forEach(function(channel) {
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
      })
      .then(() => {
        return updatePostedQuestions(questionKey);
      });
  });
}

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
