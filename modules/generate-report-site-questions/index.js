const AWS = require("aws-sdk");
const queryString = require("querystring");
const request = require("../common/requestHelpers.js");
const questionTemplates = require("../common/questionTemplates.js");
const awsHelpers = require("../common/awsHelpers.js");
const slack = require("../common/slackApiWrapers.js");
const s3 = require("../common/s3Wrappers.js");
const generateChart = require("../common/generateCharts.js");

let botToken = "";
process.env.TZ = "Australia/Sydney";

AWS.config.update({ region: process.env.AWS_REGION });

const bucketName = "sam.questions.hypothesis.responses";
//This test bucket isn't used but should be implemented ;P
const testBucket = "dev.hypothesis.slack.sentimentalbot";
const testUsers = ["U41LE35LN"];

const questionBucketName = "sam.questions.hypothesis";

// const slackPostReportChannel = "#testingspam";
const slackPostReportChannel = "#general";

let startDate = "";
let endDate = "";

function getAllResponses(itemsToGet) {
  return new Promise(function(resolve, reject) {
    let allSentiment = {};

    Promise.all(
      itemsToGet.map(function(sentiment) {
        return s3
          .getObject({
            Bucket: bucketName,
            Key: sentiment.Key
          })
          .then(function(results) {
            const parsedName = results.sentiment.name.replace(/\//g, "-");
            if (!allSentiment[parsedName]) {
              allSentiment[parsedName] = [results.sentiment.value];
            } else {
              allSentiment[parsedName].push(results.sentiment.value);
            }
          });
      })
    ).then(() => {
      resolve(allSentiment);
    });
  });
}

function findAverage(responseArray) {
  function add(a, b) {
    return parseInt(a) + parseInt(b);
  }

  return (responseArray.reduce(add, 0) / responseArray.length).toFixed(2);
}

function generateFields(values, question) {
  function formatValue(responseArray) {
    const average = findAverage(responseArray);
    const rounded = Math.round(average).toString();
    return (
      average.toString() +
      "    :    " +
      questionTemplates.sentimentValueMappings[rounded]
    );
  }

  let fields = [];

  // let results = {
  //   title: "Average " + question,
  //   value: formatValue(values),
  //   short: true
  // };

  let results = {
    title: question,
    short: true
  };

  let stats = {
    title: "Number of responses",
    value: values.length.toString(),
    short: true
  };

  fields.push(results);
  fields.push(stats);

  return fields;
}

function generateRandomQuestionPrelude(question, results) {
  let questionStatement = {
    title: "Question",
    value: question.question,
    short: true
  };

  let majorityStatement = {
    title:
      "Majority response: " +
      results.heighestResponse.total +
      "/" +
      results.totalResponses,
    value: results.heighestResponse.answer,
    short: true
  };

  return [questionStatement, majorityStatement];
}

function formatDate(date) {
  return (
    date[0] +
    date[1] +
    "-" +
    date[2] +
    date[3] +
    "-" +
    date[4] +
    date[5] +
    date[6] +
    date[7]
  );
}

//Convert sequence into totals
function parseValues(values, groupsArray) {
  let parsedValues = [];
  for (i = 0; i < groupsArray.length; i++) {
    parsedValues.push(0);
  }

  values.forEach(function(value) {
    parsedValues[value - 1] += 1;
  });

  return parsedValues;
}

function appendValuesForAll(formattedGraphObject, sentiments, date) {
  Object.keys(formattedGraphObject).forEach(function(question) {
    formattedGraphObject[question].x.push(date);
    if (sentiments[question]) {
      formattedGraphObject[question].y.push(findAverage(sentiments[question]));
    } else {
      //No response found.
      formattedGraphObject[question].y.push(-1);
    }
  });
}

function generateReport(sentiments) {
  let attachments = [];

  const barChartLegendValues = questionTemplates.sentimentValueBarMappings;

  questionTemplates.reportQuestionsFormatted.forEach(function(question) {
    if (sentiments[question.value]) {
      let values = sentiments[question.value];

      const xAxisName = "Sentiment value";
      const yAxisName = "Responses";

      let baseReport = {
        fields: generateFields(values, question.name),
        image_url: generateChart.pie(
          question.name,
          barChartLegendValues,
          parseValues(values, barChartLegendValues),
          xAxisName,
          yAxisName
        )
      };

      attachments.push(baseReport);
    }
  });

  return attachments;
}

function reportTitle() {
  return (
    "*Hey guys! Here's the Weekly Sentiment report from " +
    formatDate(startDate) +
    " to " +
    formatDate(endDate) +
    "*"
  );
}

function generateDuoQuestionReport(details, results) {
  const totalAnswers = {};

  results.forEach(result => {
    if (!totalAnswers[result]) {
      totalAnswers[result] = 1;
    } else {
      totalAnswers[result] += 1;
    }
  });

  let heighestResponse = { total: 0 };

  Object.keys(totalAnswers).forEach(function(answer) {
    if (totalAnswers[answer] > heighestResponse.total) {
      heighestResponse = {
        total: totalAnswers[answer],
        answer: details.options.filter(option => {
          return option.key.toString() === answer.toString();
        })[0].answer
      };
    }
  });

  totalAnswers.heighestResponse = heighestResponse;
  totalAnswers.totalResponses = results.length;

  const randomQuestionReport = {
    fields: generateRandomQuestionPrelude(details, totalAnswers)
  };

  return [randomQuestionReport];
}

function generateStandardReport(details, results) {
  const pieChartLegendMappings = details.options.map(option => {
    return option.answer;
  });

  const xAxisName = "Sentiment value";
  const yAxisName = "Responses";

  return [
    {
      fields: generateFields(results, details.question),
      image_url: generateChart.pie(
        details.question,
        pieChartLegendMappings,
        parseValues(results, pieChartLegendMappings),
        xAxisName,
        yAxisName
      )
    }
  ];
}

function postReport(sentiments) {
  return Promise.all(
    Object.keys(sentiments).map(sentiment => {
      return new Promise((resolve, reject) => {
        const bucketKey =
          sentiment.split("-")[0] +
          "/" +
          sentiment.split("-")[1] +
          "/" +
          sentiment.split("-")[2];

        s3
          .getObject({
            Bucket: questionBucketName,
            Key: bucketKey
          })
          .then(questionDetails => {
            const reportDetails = {
              question: questionDetails.question,
              options: questionDetails.options
            };

            switch (questionDetails.options.length) {
              case 2:
                resolve(
                  generateDuoQuestionReport(
                    reportDetails,
                    sentiments[sentiment]
                  )
                );
                break;
              default:
                resolve(
                  generateStandardReport(reportDetails, sentiments[sentiment])
                );
                break;
            }
          });
      });
    })
  ).then(reportArrays => {
    return slack.postMessage(
      reportTitle(),
      slackPostReportChannel,
      [].concat.apply([], reportArrays)
    );
  });
}

function produceLastWeekArray() {
  return [0, 1, 2, 3, 4, 5, 6].map(function(minusDays) {
    // return [0, 1].map(function(minusDays) {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - minusDays);
    return questionTemplates.formattDate(currentDate);
  });
}

exports.handler = (event, context, callback) => {
  let allSentiments = [];

  // let produceMonthArray = produceMonthArray();

  let lastWeekArray = produceLastWeekArray();
  startDate = lastWeekArray[lastWeekArray.length - 1];
  endDate = lastWeekArray[0];

  Promise.all(
    lastWeekArray.map(function(date) {
      return new Promise(function(resolve, reject) {
        s3
          .listObjects({
            Bucket: bucketName,
            Delimiter: ",",
            Prefix: date.toString()
          })
          .then(function(content) {
            allSentiments = allSentiments.concat(content.Contents);
            resolve();
          });
      });
    })
  )
    .then(() => {
      return getAllResponses(allSentiments);
    })
    .then(function(sentiments) {
      return awsHelpers.decryptSlackToken().then(function(token) {
        slack.setBotToken(token);
        return postReport(sentiments);
      });
    })
    .then(function() {
      callback();
    })
    .catch(function(err) {
      callback(err);
    });
};
