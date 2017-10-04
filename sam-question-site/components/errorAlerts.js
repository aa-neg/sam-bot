import { Alert } from "react-bootstrap";

import React, { Component } from "react";

export default class ErrorAlerts extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.show) {
      return (
        <Alert
          onDismiss={this.props.onDismiss}
          bsStyle={this.props.style}
          style={styles.basic}
        >
          {this.props.message}
        </Alert>
      );
    } else {
      return null;
    }
  }
}

const styles = {
  basic: {}
};
