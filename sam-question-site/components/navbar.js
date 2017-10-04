import { Navbar, Nav, NavItem } from "react-bootstrap";

import React, { Component } from "react";
import common from "./common.js";

export default class SamNavbar extends React.Component {
  constructor(props) {
    super(props);
    this.user = props.user;
  }

  componentWillMount() {
    this.user = common.parseJwt().data.user;
    console.log(this.user);
  }

  render() {
    return (
      <Navbar inverse collapseOnSelect>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="#">Sentimental Sam</a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav pullRight>
            <NavItem eventKey={1}>
              Welcome {this.user.name}!
            </NavItem>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}
