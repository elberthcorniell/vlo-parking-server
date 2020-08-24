import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Login from './Login'
import Outnav from "./Outnav";

class App extends Component {
    constructor() {
        super();
        this.state = {
        };
    }
    render() {
        return (
            <Router>
                <Route exact path="/" render={(props) => <Login {...props}
                    setPath={(path) => { this.setState({ path }) }}
                    loggedIn={this.state.loggedIn}
                    langIndex={this.state.langIndex}
                />}
                />
            </Router>
        )
    }
}

export default App;