import React, { Component } from 'react';
import {Link} from "react-router-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";

class Register extends Component{
    constructor(){
        super();
        this.state = {
            username2: '',
            password2: '',
            email2: '',
            email_err2: '',
            username_err2: '',
            password_err2: ''
        };
        this.handleChange = this.handleChange.bind(this);
        this.register = this.register.bind(this);
    }

    handleChange(e){
       const {id, value} = e.target;
       this.setState({
           [id]: value
       })
    }

    register(e){
      fetch('/api/validate/register',{
          method: 'POST',
          body: JSON.stringify(this.state),
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          }
      })
      .then(res => res.json())
      .then(data => {
          console.log(data);
          M.toast({html: 'Trying to register'});
          this.setState({username2: '', password2: '', email2: '' , email_err2: data.email_err || '', 
          username_err2: data.username_err || '' , 
          password_err2: data.password_err || ''});
          if(data.success===true){
              window.location.replace('../v/login');
          }
        //  this.fetchUsers();
        //console.log(this.state);
      })
      .catch(err => console.error(err));
      e.preventDefault();
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
            if(data.success === true && dir === '/'){
                window.location.replace('../app');
            }else if(data.success === false && dir != '/'){
                localStorage.removeItem('authtoken');
            }
        })
    }
    toHome(){
      window.location.replace('/');
    }
    render(){
        return(
            <div className="container">
        <div style={{ marginTop: "10%" , marginBottom: "10%"}} className="row">
          <div className="col s12 m12  l8 offset-l2">
          <Link onClick={this.toHome} className="btn-flat waves-effect">
              <i className="material-icons left">keyboard_backspace</i> Back to
              home
            </Link>
            <div className="col s12" style={{ paddingLeft: "11.250px" }}>
            <img src="../assets/images/logo-icon.png" style={{ float: 'right' }}/>
              <h4>
                <b>Register</b> now
              </h4>
            </div>

            <form onSubmit={this.register} >
              <div className="input-field col s12">
              <div className="input-field">
                <input
                  onChange={this.handleChange}
                  value={this.state.username2}
                  id="username2"
                  type="text"
                />
                <label htmlFor="username2">Username</label>
              </div>
              <div className="input-field">
                <input
                  onChange={this.handleChange}
                  value={this.state.email2}
                  id="email2"
                  type="email"
                />
                <label htmlFor="email2">Email</label>
              </div>

              <div className="input-field">
                <input
                  onChange={this.handleChange}
                  value={this.state.password2}
                  id="password2"
                  type="password"
                />
                <label htmlFor="password2">Password</label>
              </div>
            <style>
            </style>
            <div>{this.state.email_err2}</div>
            <div>{this.state.username_err2}</div>
            <div>{this.state.password_err2}</div>
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
                  Register
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

export default Register;