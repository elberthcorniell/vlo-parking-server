import React, { Component } from 'react';
import {Link} from "react-router-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import validateEmail from './validateEmail'
import Outnav from "./Outnav";

class App extends Component{
    constructor(){
        super();
        this.state = {
        };
    }
    render(){
        return(
            <Router>
                <Outnav />
                <div className="App">
                <Route exact path="/auth/validate" component={validateEmail} />
                </div>
            </Router>
                
        )
    }
}

export default App;