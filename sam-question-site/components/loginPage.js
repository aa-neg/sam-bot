import React, { Component } from "react";
import ReactDOM from "react-dom";
import queryString from "query-string";
import "whatwg-fetch";
import common from "./common.js";

function constructSlackOAuthRequest() {
  // const localDevURL = encodeURI("http://localhost:8080");
 
  // return `https://slack.com/oauth/authorize?scope=identity.basic,identity.email,identity.team&client_id=83008945605.182111489510&redirect_url=${localDevURL}`;


  //Will need to change this to redirect to the s3 bucket location (29/09/2017)
  const sentimentalSamURL = encodeURI("https://sentimentalsam.com");
  return `https://slack.com/oauth/authorize?scope=identity.basic,identity.email,identity.team&client_id=83008945605.182111489510&redirect_url=${sentimentalSamURL}`;
}

function determineValidSlackRedirect(search) {
  const parsed = queryString.parse(search);
  let slackToken = parsed.code;

  const checkAuth = {
    code: slackToken
  };

  return fetch(common.awsSlackEndPoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(checkAuth)
  })
    .then(response => response.json())
    .then(response => {
      document.cookie =
        "sam-slack-cookie=" +
        response.jwt +
        "; expires=Fri, 31 Dec 2080 23:59:59 GMT";
    });
}

export default class Login extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const scope = this;
    return common
      .checkJWT()
      .then(redirect => {
        if (redirect && redirect.redirect) {
          this.props.history.push(redirect.redirect);
        } else {
          return determineValidSlackRedirect(this.props.location.search);
        }
      })
      .then(() => {
        return common.checkJWT();
      })
      .then(redirect => {
        if (redirect && redirect.redirect) {
          scope.props.history.push(redirect.redirect);
        }
      })
      .catch(function(err) {
        console.log("our error", err);
      });
  }

  render() {
    return (
      <div style={styles.container}>
        <h3>Discover insights into your company and inner workings</h3>
        <a href={constructSlackOAuthRequest()}>
          <img
            alt="Sign in with Slack"
            height="40"
            width="172"
            src="https://platform.slack-edge.com/img/sign_in_with_slack.png"
            srcSet="https://platform.slack-edge.com/img/sign_in_with_slack.png 1x, https://platform.slack-edge.com/img/sign_in_with_slack@2x.png 2x"
          />
        </a>
      </div>
    );
  }
}

const styles = {
  container: {
    paddingTop: 40,
    textAlign: "center"
  }
};
