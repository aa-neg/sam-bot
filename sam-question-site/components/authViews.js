import React, { Component } from "react";
import {
  BrowserRouter,
  Route,
  Link,
  Redirect,
  withRouter
} from "react-router-dom";
import Navbar from "./navbar";
import Home from "./homePage";
const styles = {};

const routes = [
  {
    path: "/auth/home",
    main: () => <Home />
  }
];

export default class AuthViews extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    common.checkJWT().then(redirect => {
      if (!redirect) {
        this.props.history.push("/login");
      }
    });
  }

  render() {
    return (
      <div>
        <Navbar />
        <SideBar routes={routes} />
        <div style={{ flex: 1, padding: "10px" }}>
          {routes.map((route, index) =>
            // Render more <Route>s with the same paths as
            // above, but different components this time.
            <Route
              key={index}
              path={route.path}
              exact={route.exact}
              component={route.main}
            />
          )}
        </div>
      </div>
    );
  }
}
