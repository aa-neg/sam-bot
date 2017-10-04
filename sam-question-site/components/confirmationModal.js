import { Modal, Button } from "react-bootstrap";

import React, { Component } from "react";

export default class ConfirmationModal extends React.Component {
  constructor(props) {
    super(props);
  }

  optionFormatting = e => {
    this.props.options.forEach(() => {});
  };

  render() {
    return (
      <Modal show={this.props.showModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm question submition</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Question: {this.props.question}
          Options: <br />
          <ul>
            {this.props.options.map((option, key) => {
              return (
                <li key={key}>
                  {option.answer}
                </li>
              );
            })}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.onClose}>Close</Button>
          <Button bsStyle="success" onClick={this.props.submitConfirmation}>
            Schedule question
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

const styles = {
  basic: {}
};
