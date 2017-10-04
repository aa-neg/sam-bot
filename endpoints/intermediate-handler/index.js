// API gateway endpoint
// https://wfzjwhj523.execute-api.ap-southeast-2.amazonaws.com/prod

const AWS = require("aws-sdk");
const queryString = require("querystring");
AWS.config.update({ region: process.env.AWS_REGION });

exports.handler = (event, context, callback) => {
  var requestDetails = JSON.parse(queryString.parse(event.body).payload);

  const payLoadSections = requestDetails.callback_id.split(":");
  const functionName = payLoadSections[0];

  //Will need to change this up when setting up dev environment.
  functionName = "sam-modules-prod-" + functionName;

  let lambda = new AWS.Lambda();

  lambda.invoke(
    {
      FunctionName: functionName,
      Payload: JSON.stringify(requestDetails),
      InvocationType: "Event"
    },
    function(error, data) {
      callback(null, {
        statusCode: "200",
        body: "One moment . . .",
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  );
};
