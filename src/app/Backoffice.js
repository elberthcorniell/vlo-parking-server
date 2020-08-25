import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import Sidebar from './Sidebar';
import PopUpLogin from './PopUpLogin'
import Settings from './Settings';
import Permissions from './Permissions';
import Live from './Live';
class Backoffice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            callback: '/',
            email: '',
            devices: [],
            business: []
        };
    }
    componentDidMount() {
        this.verify(() => {
            this.getBusiness()
        })
    }

    getBusiness() {
        fetch('/api/admin/business', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                let { success, business, msg } = data
                if (!success)
                    this.notify(msg || data.message, false)
                if (success)
                    this.setState({
                        business
                    })
            })
    }
    verify(callback) {
        fetch('/api/validate/', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    this.setState({
                        loginModal: true,
                        callback
                    })
                } else {
                    if (callback) {
                        callback()
                    }
                    const { username } = data
                    this.setState({
                        username,
                        token: data['2fa']
                    })
                }
            })
            .catch(err => console.error(err));
    }
    render() {
        return (
            <Router>
                <div className="side-bar">
                    <Sidebar

                    />
                </div>
                <div className="content">
                    <div style={{ height: 10, width: '100%' }} className="hidden">
                    </div>
                    <Route exact path="/admin" render={(props) => <div {...props}

                    />}
                    />
                    <Route exact path="/admin/live" render={(props) => <Live {...props}
                        email={this.state.email}
                        verify={e => { this.verify(e) }}
                        devices={this.state.devices}
                        business={this.state.business}
                        getBusiness={() => this.getBusiness()}
                    />}
                    />
                    <Route exact path="/admin/permissons" render={(props) => <Permissions {...props}
                        email={this.state.email}
                        verify={e => { this.verify(e) }}
                        devices={this.state.devices}
                        business={this.state.business}
                    />}
                    />
                    <Route exact path="/admin/settings" render={(props) => <Settings {...props}
                        email={this.state.email}
                        verify={e => { this.verify(e) }}
                        devices={this.state.devices}
                        business={this.state.business}
                        getBusiness={() => this.getBusiness()}
                    />}
                    />

                </div>
                <PopUpLogin
                    loginModal={this.state.loginModal}
                    onLogin={() => {
                        this.verify(() => {
                            this.setState({
                                loginModal: false
                            })
                        })
                    }}
                />
            </Router>
        )
    }
}

export default Backoffice;