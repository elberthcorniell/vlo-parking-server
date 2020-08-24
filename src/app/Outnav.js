import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { 
    Navbar,
    Col,
    Row
} from 'react-bootstrap'
import { BrowserRouter as Router, Route } from "react-router-dom";

class Outnav extends Component {
    constructor() {
        super();
    }
    render() {
        return (
            <Row>
                <Col>
                    <Link>mmg</Link>
                </Col>
            </Row>
        )
    }
}

export default Outnav;