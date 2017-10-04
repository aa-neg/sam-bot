import React, { Component } from "react";
import ReactDOM from "react-dom";
import "whatwg-fetch";
import common from "./common.js";
import {
  Button,
  FormGroup,
  ControlLabel,
  FormControl,
  HelpBlock,
  Accordion,
  Panel,
  ListGroup,
  ListGroupItem,
  InputGroup,
  Alert
} from "react-bootstrap";
import ErrorAlerts from "./errorAlerts";
import ConfirmationModal from "./confirmationModal";
import QuestionForm from "./questionForm";
import { arrayMove } from "react-sortable-hoc";

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      question: "",
      options: [],
      newOption: "",
      errorMessageState: {
        style: "danger",
        show: false
      },
      showModal: false,
      questionType: "offSchedule"
    };
  }

  dismissAlert = e => {
    this.setState({
      errorMessageState: {
        ...this.state.errorMessageState,
        show: false
      }
    });
  };

  sameOptionExists = e => {
    const noDuplicates = this.state.options.filter(
      (option, index, self) =>
        self.findIndex(t => t.answer === option.answer) === index
    );
    if (noDuplicates.length !== this.state.options.length) {
      return true;
    } else {
      return false;
    }
  };

  checkSubmition = e => {
    return new Promise((resolve, reject) => {
      if (this.state.options.length < 2 || this.state.options.length > 5) {
        reject({
          ...this.state.errorMessageState,
          show: true,
          style: "danger",
          message: "Please specify only 2-5 options."
        });
      } else if (this.sameOptionExists()) {
        reject({
          ...this.state.errorMessageState,
          show: true,
          style: "danger",
          message: "Sorry you appear to have duplicate options."
        });
      } else if (!this.state.questionType) {
        reject({
          ...this.state.errorMessageState,
          show: true,
          style: "danger",
          message: "Please select a question type."
        });
      } else if (this.state.question.trim().length === 0) {
        reject({
          ...this.state.errorMessageState,
          show: true,
          style: "danger",
          message: "Please specify a question."
        });
      } else if (
        this.state.options.filter(option => {
          return option.answer.length > 32;
        }).length > 0
      ) {
        reject({
          ...this.state.errorMessageState,
          show: true,
          style: "danger",
          message: "Please ensure your options are no longer than 32 chars."
        });
      } else if (
        this.state.questionType === "offSchedule" &&
        this.state.options.length !== 2
      ) {
        reject({
          ...this.state.errorMessageState,
          show: true,
          style: "danger",
          message:
            "Please ensure your off scheudle question only has 2 responses."
        });
      } else {
        resolve();
      }
    });
  };

  submitQuestions = e => {
    e.preventDefault();
    this.checkSubmition()
      .then(() => {
        console.log("successfully sending off");
        this.setState({
          showModal: true
        });
      })
      .catch(errMessage => {
        if (errMessage.show) {
          this.setState({
            errorMessageState: errMessage
          });
        }
      });
  };

  handleChange = (e, key) => {
    this.setState({ [key]: e.target.value });
  };

  deleteOption = optionId => {
    let filteredOptions = this.state.options.filter(
      option => option.key !== optionId
    );
    this.setState({
      options: this.state.options.filter(option => option.key !== optionId)
    });
  };

  generateMaxKey = list => {
    let highestId = 0;
    list.forEach(item => {
      if (item.key && item.key > highestId) {
        highestId = item.key;
      }
    });
    return highestId + 1;
  };

  addOption = () => {
    if (this.state.newOption === "") {
      this.setState({
        errorMessageState: {
          ...this.state.errorMessageState,
          show: true,
          message: "Please specify a response option"
        }
      });
      return;
    } else if (this.state.options && this.state.options.length === 4) {
      this.setState({ isAddOptionDisabled: true });
    } else {
      this.setState({ isAddOptionDisabled: false });
    }
    this.state.options.push({
      answer: this.state.newOption,
      key: this.generateMaxKey(this.state.options)
    });
    this.setState({ newOption: "" });
    this.setState({ options: this.state.options });
  };

  onSortEnd = ({ oldIndex, newIndex }) => {
    this.setState({
      options: arrayMove(this.state.options, oldIndex, newIndex)
    });
  };

  linkKeyDown = (event, callback) => {
    if (event.charCode === 13) {
      callback();
    }
  };

  closeModal = () => {
    this.setState({
      showModal: false
    });
  };

  postSubmition = () => {
    //Currently only support non off schedule question types
    const submitDetails = {
      question: this.state.question,
      options: this.state.options,
      questionType: "formalQuestion"
    };

    common
      .submitQuestions(submitDetails)
      .then(data => {
        console.log("things were fine here is our data", data);
        this.setState({
          showModal: false
        });
        this.setState({
          errorMessageState: {
            ...this.state.errorMessageState,
            show: true,
            style: "success",
            message: "Your message has been queued! :)"
          }
        });
      })
      .catch(err => {
        this.setState({
          ...this.state.errorMessageState,
          show: true,
          message:
            "We were unable to sned through your question. Please try again later."
        });
      });
  };

  render() {
    return (
      <div className="container">
        <h4>You can create your own questions ask to the group</h4>
        <hr />
        <ErrorAlerts
          {...this.state.errorMessageState}
          onDismiss={this.dismissAlert}
        />
        <ConfirmationModal
          question={this.state.question}
          options={this.state.options}
          showModal={this.state.showModal}
          submitConfirmation={this.postSubmition}
          onClose={this.closeModal}
        />
        <form onSubmit={e => e.preventDefault()}>
          <FormGroup controlId="formControlsSelect">
            <ControlLabel>
              What type of question would you like to create?
            </ControlLabel>
            <FormControl
              value={this.state.questionType}
              onChange={event => this.handleChange(event, "questionType")}
              componentClass="select"
              placeholder="select"
            >
              {/* <option value="offSchedule">Informal</option> */}
              <option value="mainSchedule">Formal</option>
            </FormControl>
          </FormGroup>
          <QuestionForm
            {...this.state}
            handleChange={this.handleChange}
            deleteOption={this.deleteOption}
            addOption={this.addOption}
            onSortEnd={this.onSortEnd}
            submitQuestions={this.submitQuestions}
            linkKeyDown={this.linkKeyDown}
          />
        </form>
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
