import React, { Component } from 'react';
import {Link} from "react-router-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";

class Outnav extends Component{
    constructor(){
        super();
    }
    render(){
        return(
            <nav className="z-depth-0">
    <div class="nav-wrapper white">
    <Link
                    to="/"
                   
                    className="col s6 brand-logo hide-on-med-and-down"
                    >
                    <img src="https://oneauth.do/src/images/text_logo.png"  
                    style={{
                        marginLeft: "80px",
                        height: '30px'
                    }}
                    />
                    </Link>
                    <Link
                    to="/"
                   
                    className="col s6 brand-logo offset-s3 hide-on-large-only"
                    >
                    <img src="https://oneauth.do/src/images/text_logo.png"  
                    style={{
                        marginLeft: "",
                        height: '30px'
                    }}
                    />
                    </Link>
      <ul id="nav-mobile" className="right hide-on-med-and-down black-text">
        <li><a href="sass.html">Sass</a></li>
        <li><a href="badges.html">Components</a></li>
        <li><a href="collapsible.html">JavaScript</a></li>
      </ul>
    </div>
  </nav>
                    
        )
    }
}

export default Outnav;