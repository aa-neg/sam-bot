import React, { Component } from "react";
import ReactDOM from "react-dom";
import Login from "./components/loginPage";
import Home from "./components/homePage";
import AuthView from "./components/authViews";
import {
  BrowserRouter,
  Route,
  Link,
  Redirect,
  withRouter
} from "react-router-dom";

const styles = {
  app: {
    paddingTop: 40,
    textAlign: "center"
  }
};

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <Route exact path="/" component={Login} />
          <Route path="/home" component={Home} />
        </div>
      </BrowserRouter>
    );
  }
}

const root = document.querySelector("#app");
ReactDOM.render(<App />, root);
