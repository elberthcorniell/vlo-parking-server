import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import Sidebar from './Sidebar';
import PopUpLogin from './PopUpLogin'
import Settings from './Settings';
import Permissions from './Permissions';
class Backoffice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            callback: '/',
            email:'',
            devices: []
        };
    }
    componentDidMount(){
        this.verify()
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
                    <Route exact path="/admin/permissons" render={(props) => <Permissions {...props}
                            email={this.state.email}
                            verify={e=>{this.verify(e)}}
                            devices={this.state.devices}
                        />}
                    />
                    <Route exact path="/admin/settings" render={(props) => <Settings {...props}
                            email={this.state.email}
                            verify={e=>{this.verify(e)}}
                            devices={this.state.devices}
                        />}
                    />

                </div>
                <PopUpLogin
                    loginModal={this.state.loginModal}
                    onLogin={() => { this.verify(()=>{
                        this.setState({
                            loginModal: false
                        })
                    }) }}
                />
            </Router>
        )
    }
}

export default Backoffice;