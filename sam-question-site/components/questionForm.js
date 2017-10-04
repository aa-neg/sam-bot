import {
  FormControl,
  FormGroup,
  ControlLabel,
  Alert,
  ListGroupItem,
  ListGroup,
  Button,
  InputGroup
} from "react-bootstrap";
import {
  SortableContainer,
  SortableElement,
  arrayMove,
  SortableHandle
} from "react-sortable-hoc";
import { FaTrashO } from "react-icons/lib/fa";

import React, { Component } from "react";

export default class QuestionForm extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const DragableSection = SortableHandle(({ value }) =>
      <span style={styles.listAnswer}>
        {value.answer}
      </span>
    );

    const SortableItem = SortableElement(({ value }) =>
      <ListGroupItem style={styles.listItem}>
        <DragableSection value={value} />
        <a
          style={styles.trashIcon}
          onClick={() => this.props.deleteOption(value.key)}
        >
          <FaTrashO />
        </a>
      </ListGroupItem>
    );

    const SortableList = SortableContainer(({ items }) => {
      return (
        <ListGroup>
          {items.map((value, index) =>
            <SortableItem key={value.key} index={index} value={value} />
          )}
        </ListGroup>
      );
    });
    return (
      <div>
        <FormGroup controlId="newQuestionQuestion">
          <ControlLabel>What question would you like to ask:</ControlLabel>
          <FormControl
            name="question"
            value={this.props.question}
            onChange={event => this.props.handleChange(event, "question")}
            componentClass="textarea"
            placeholder="Enter your question"
            type="text"
          />
        </FormGroup>

        <FormGroup controlId="newQuestionOptions">
          <ControlLabel style={styles.optionLabel}>
            What are the possible options for your question?
          </ControlLabel>
          <ControlLabel style={styles.noteOption}>
            <i><strong>Note:</strong> If your options have implicit ranking ensure the ordering is from worst to best.</i>
          </ControlLabel>
          <InputGroup>
            <FormControl
              type="text"
              name="optionValue"
              value={this.props.newOption}
              onKeyPress={event =>
                this.props.linkKeyDown(event, this.props.addOption)}
              onChange={event => this.props.handleChange(event, "newOption")}
              placeholder="Add an additonal response option"
            />
            <InputGroup.Button>
              <Button onClick={this.props.addOption} disabled={this.props.isAddOptionDisabled}>Add option</Button>
            </InputGroup.Button>
          </InputGroup>
        </FormGroup>

        <SortableList
          items={this.props.options}
          onSortEnd={this.props.onSortEnd}
          useDragHandle={true}
        />

        <Button onClick={this.props.submitQuestions}>Submit</Button>
      </div>
    );
  }
}

const styles = {
  infoAlert: {
    width: "100%"
  },
  optionLabel: {
    display: "inline-flex",
    width: "100%"
  },
  noteOption: {
    fontSize: "12px",
    fontWeight: "400"
  },
  listItem: {
    display: "inline-flex",
    width: "100%"
  },
  listAnswer: {
    width: "100%"
  },
  trashIcon: {
    fontSize: "20px",
    float: "right",
    color: "red",
    cursor: "pointer"
  }
};
