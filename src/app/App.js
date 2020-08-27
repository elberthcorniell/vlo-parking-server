import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import Login from './Login'
import Outnav from "./Outnav";
import Register from './Register';
import Camera from './Camera';

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
                <Route exact path="/register" render={(props) => <Register {...props}
                    setPath={(path) => { this.setState({ path }) }}
                    loggedIn={this.state.loggedIn}
                    langIndex={this.state.langIndex}
                />}
                />
                <Route exact path="/camera" render={(props) => <Camera {...props}
                />}
                />
            </Router>
        )
    }
}

export default App;