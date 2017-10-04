// Required environment variables

/*
SLACK_CLIENT_SECRET
JWT_SECRET
SLACK_CLIENT_ID
SLACK_BOT_TOKEN
*/

const request = require("../common/requestHelpers.js");
const slackApiPath = "slack.com";
const AWS = require("aws-sdk");
const kms = new AWS.KMS();
const jwt = require("jsonwebtoken");

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

function parseAndSetSecrets() {
  return new Promise(function(resolve, reject) {
    let bodyElements = {
      code: "",
      client_id: "",
      client_secret: "",
      botToken: ""
    };

    parseSecret("SLACK_BOT_TOKEN")
      .then(function(botToken) {
        bodyElements.botToken = botToken;
        return parseSecret("SLACK_CLIENT_ID");
      })
      .then(function(clientId) {
        bodyElements.client_id = clientId;
        return parseSecret("SLACK_CLIENT_SECRET");
      })
      .then(function(clientSecret) {
        bodyElements.client_secret = clientSecret;
        return parseSecret("JWT_SECRET");
      })
      .then(function(jwtSecret) {
        bodyElements.jwt_secret = jwtSecret;
        resolve(bodyElements);
      })
      .catch(function(err) {
        console.error("Failed to parse and set secrets", err);
        reject(bodyElements);
      });
  });
}

function checkSlackAuth(bodyElements, codeToken) {
  return new Promise(function(resolve, reject) {
    const options = {
      hostname: slackApiPath,
      path: "/api/oauth.access"
    };

    let body = {
      code: codeToken,
      client_id: bodyElements.client_id,
      client_secret: bodyElements.client_secret,
      jwt_secret: bodyElements.jwt_secret
    };

    console.log("here is our slack auth we are about to send off");
    console.log(body);

    request
      .post(options, body)
      .then(function(res) {
        resolve({ data: res.data, jwtSecret: body.jwt_secret });
      })
      .catch(function(err) {
        reject(err);
      });
  });
}

function generateJWTfromResponse(response) {
  return new Promise(function(resolve, reject) {
    let jwtContent = {
      user: response.data.user,
      team: {
        id: response.data.team.id,
        name: response.data.team.name,
        domain: response.data.team.domain
      }
    };

    console.log("here is the content we will sign", jwtContent);

    var signedJWT = jwt.sign(
      {
        data: jwtContent
      },
      response.jwtSecret,
      { expiresIn: "60 days" }
    );

    console.log("here is our signed JWT", signedJWT);

    resolve(signedJWT);
  });
}

exports.handler = (event, context, callback) => {
  let body = JSON.parse(event.body);
  console.log("here is our body:", body);

  parseAndSetSecrets()
    .then(function(bodyElements) {
      return checkSlackAuth(bodyElements, body.code);
    })
    .then(function(response) {
      console.log("we have checked the token.", response);
      return generateJWTfromResponse(response);
    })
    .then(function(jwt) {
      callback(null, {
        statusCode: "200",
        body: JSON.stringify({ jwt: jwt }),
        headers: {
          "Set-Cookie": "jwt=" + jwt + ";",
          "Access-Control-Allow-Origin": "*"
        }
      });
    })
    .catch(function(err) {
      console.error("failed : ", err);
      callback(null, {
        statusCode: "400",
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      });
    });
};
