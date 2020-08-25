import React, { Component } from 'react';
import { Link } from "react-router-dom";

export default class Sidebar extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    render() {
        return (
            <div className="icon-bar">
                <ul>
                    <li style={{ textAlign: 'center' }}>
                        <a href="/" style={{ width: '100%' }}>
                            <img src="../assets/images/logo.png" style={{ width: 85 }} />
                        </a>
                    </li>
                    <hr />
                    <li><Link to="/admin/"><i className="material-icons left">dashboard</i>Dashboard</Link></li>
                    <li><Link to="/admin/live"><i className="material-icons left">location_on</i>Live</Link></li>
                    <li><Link to="/admin/permissons"><i className="material-icons left">person</i>Permissions</Link></li>
                    <li><Link to="/admin/settings"><i className="material-icons left">settings</i>Settings</Link></li>
                    <hr />
                    <div style={{ height: 168, overflowY: 'scroll', overflowX: 'hidden' }}>
                    </div>
                    <hr />
                    <div style={{ height: 112, position: 'absolute', bottom: 0 }}>
                        <li>
                            <Link
                                onClick={() => { localStorage.setItem('authtoken', '').then(window.location.replace('../')) }}>
                                <i className="material-icons left">chevron_left</i>Sign out
                            </Link>
                        </li>
                    </div>
                </ul>
            </div>
        )
    }
}