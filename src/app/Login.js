import React, { Component } from 'react';
import {Link} from "react-router-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";

class Login extends Component{
    constructor(){
        super();
        this.state = {
            username: '',
            password: '',
            password_err: '',
            username_err: ''
        };
        this.handleChange = this.handleChange.bind(this);
        this.login = this.login.bind(this);
    }
    login(e){
        fetch('/api/validate/login',{
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            M.toast({html: 'Trying to log in', classes:'error'});
            this.setState({username: '', password: '', password_err: data.password_err || '', 
            username_err: data.username_err || ''});
            if(data.success===true){
                window.location.replace('../app');
                localStorage.setItem('authtoken', data.token);
            }
          //  this.fetchUsers();
          //console.log(this.state);
        })
        .catch(err => console.error(err));
        e.preventDefault();
    }
    handleChange(e){
       const {id, value} = e.target;
       this.setState({
           [id]: value
       })
    }
    componentDidMount(){
        fetch('/api/validate/',{
            method: 'POST',
            body: JSON.stringify(this.state),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
        .then(res => res.json())
        .then(data => {
            var url = window.location.origin.toString();
            var dir = window.location.toString();
            dir = dir.substring(url.length,url.length+2);
            if(data.success === true && dir === '/v'){
                window.location.replace('../app');
            }else if(data.success === false && dir != '/v'){
                localStorage.removeItem('authtoken');
                window.location.replace('../v');
            }else if(data.success === false){
                localStorage.removeItem('authtoken');
            }
        })
    }
    render(){
        return(
            <div className="container">
        <div style={{ marginTop: "10%", marginBottom: "10%" }} className="row">
          <div className="col s12 m12  l8 offset-l2">
            <Link to="/" className="btn-flat waves-effect">
              <i className="material-icons left">keyboard_backspace</i> Back to
              home
            </Link>
            <div className="col s12" style={{ paddingLeft: "11.250px" }}>
            <img src="../assets/images/logo-icon.png" style={{ float: 'right' }}/>
              <h4>
                <b>Login</b> below
              </h4>
              <p className="grey-text text-darken-1">
                Don't have an account? <Link to="/v/register">Register</Link>
              </p>
            </div>

            <form onSubmit={this.login} >
              <div className="input-field col s12">
              <div className="input-field">
                <input
                  onChange={this.handleChange}
                  value={this.state.username}
                  id="username"
                  type="text"
                />
                <label htmlFor="username">Username</label>
              </div>
              <div className="input-field">
                <input
                  onChange={this.handleChange}
                  value={this.state.password}
                  id="password"
                  type="password"
                />
                <label htmlFor="password">Password</label>
              </div>
            <style>
            </style>
            <div>{this.state.password_err}</div>
            <div>{this.state.username_err}</div>
              </div>
              <div className="col s12" style={{ paddingLeft: "11.250px" }}>
                <button
                  style={{
                    width: "100%",
                    borderRadius: "3px",
                    letterSpacing: "1.5px",
                    marginTop: "1rem"
                  }}
                  type="submit"
                  className="btn btn-large waves-effect waves-light hoverable blue accent-3"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
            /*
                    <form onSubmit={this.login}>
                        <div className="row">
                            <div className="input-field col s12">
                            <div>{this.state.password_err}</div>
                            <div>{this.state.username_err}</div>
                                
                            </div>
                        </div>
                        <button type="submit" style={{
                        minWidth: '100%'
                    }} className="btn btn-light-blue btn-darken-4">login</button>
                    </form>       */       
        )
    }
}

export default Login;