import "whatwg-fetch";

const awsSlackEndPoint =
  "https://emd6u7ve98.execute-api.ap-southeast-2.amazonaws.com/prod/slack-hop";
const awsCheckValidJWT =
  "https://emd6u7ve98.execute-api.ap-southeast-2.amazonaws.com/prod/jwt-check";

const submitQuestionsEndpoint =
  "https://emd6u7ve98.execute-api.ap-southeast-2.amazonaws.com/prod/site-questions";

function getCookie(name) {
  let value = "; " + document.cookie;
  let parts = value.split("; " + name + "=");
  if (parts.length == 2) {
    return parts
      .pop()
      .split(";")
      .shift();
  }
}

function submitQuestions(details) {
  const cookie = getCookie("sam-slack-cookie");

  return fetch(submitQuestionsEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ jwt: cookie, details: details })
  }).then(result => {
    if (result.ok) {
      return Promise.resolve();
    } else {
      return Promise.reject(result.status);
    }
  });
}

function parseJwt() {
  let samsCookie = getCookie("sam-slack-cookie");
  if (samsCookie) {
    const base64Url = samsCookie.split(".")[1];
    const base64 = base64Url.replace("-", "+").replace("_", "/");

    return JSON.parse(window.atob(base64));
  } else {
    return {};
  }
}

function checkJWT(cookie) {
  return new Promise(function(resolve, reject) {
    let samsCookie = getCookie("sam-slack-cookie");
    fetch(awsCheckValidJWT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ jwt: samsCookie })
    })
      .then(function(response) {
        if (response.status !== 200) {
          resolve();
        } else {
          resolve({ redirect: "/home" });
        }
      })
      .catch(function(err) {
        resolve();
      });
  });
}

export default {
  getCookie: getCookie,
  awsSlackEndPoint: awsSlackEndPoint,
  awsCheckValidJWT: awsCheckValidJWT,
  checkJWT: checkJWT,
  submitQuestions: submitQuestions,
  parseJwt: parseJwt
};
