import React, { Component } from 'react';
import { Link } from "react-router-dom";
import {
  Container,
  Col,
  Row,
  Button,
  Form
} from 'react-bootstrap'
import Authenticator from './Authenticator'
import toaster from 'toasted-notes'

class Login extends Component {

  constructor() {
    super();
    this.state = {
      username: '',
      password: '',
      password_err: '',
      username_err: '',
      disabled: true,
      device_used: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.login = this.login.bind(this);
  }

  login(e) {
    this.setState({
      disabled: true
    }, () => {
      fetch('/api/validate/login/admin', {
        method: 'POST',
        body: JSON.stringify(this.state),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          this.setState({
            disabled: false
          })
          let {success, token, password_err, username_err} = data
          this.notify(password_err || username_err || "Successfull login" ,success)
          if (success) {
            if (data["2fa"]) {
              this.setState({
                login_otp: true,
                "2fa": data["2fa"],
                token: data.token
              })
            } else {
              window.location.replace(this.state.callback || '../admin/live');
              localStorage.setItem('authtoken', token);
              localStorage.setItem('username', this.state.username);
              localStorage.setItem('lastDate', Date.now());
            }
          }
        })
        .catch(err => console.error(err));
    })
    e.preventDefault();
  }

  notify(msg, type) {
    toaster.notify(({ onClose }) => <div
      style={{
        backgroundColor: type ? 'rgba(21,205,114,0.7)' : 'rgba(255,0,0,0.7)',
        paddingRight: 20,
        paddingLeft: 10,
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 5,
        marginBottom: 100,
        color: 'white'
      }}>
      <i className="material-icons" style={{ color: type ? 'rgb(21,205,114)' : 'yellow' }}>{type ? 'check' : 'warning'}</i>&nbsp;&nbsp;&nbsp;
<strong>{msg}</strong>&nbsp;&nbsp;
        <i onClick={onClose} className="material-icons" style={{ color: 'white', cursor: 'pointer' }}>close</i>
    </div>, {
      duration: 10000,
      position: 'bottom',
    })
  }
  handleChange(e) {
    const { id, value } = e.target;
    this.setState({
      [id]: value
    })
  }

  componentDidMount() {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var callback = url.searchParams.get("callback");
    this.setState({
      callback: callback ? '..' + callback : undefined
    })
    fetch('/api/validate/ip')
      .then(data => data.json())
      .then(data => {
        this.setState({
          ip: data.ip,
          location: data.location,
          os: 'Web',
          disabled: false
        })
      })
    if (localStorage.getItem("username") != undefined) {
      this.setState({
        device_used: true,
        username: localStorage.getItem("username"),
        last_date: localStorage.getItem('lastDate')
      })
    }
    window.addEventListener('load', () => {
      document.title = `${document.getElementById('page-title').textContent} | Vlo Parking`
    })
  }

  formatDate(date) {
    date = new Date(date)
    var monthNames = [
      "Jan", "Feb", "Mar",
      "Apr", "May", "Jun", "Jul",
      "Aug", "Sep", "Oct",
      "Nov", "Dec"
    ];
    var string = ''
    return (date.getDate() + ' ' + monthNames[date.getMonth()] + ', ' + date.getFullYear())
  }

  render() {
    return (
      <Container style={{ maxWidth: '100vw' }}>
        {this.state.login_otp ?
          <Authenticator
            callback={() => {
              window.location.replace(this.state.callback || '../admin/live');
              localStorage.setItem('authtoken', this.state.token);
              localStorage.setItem('username', this.state.username);
              localStorage.setItem('lastDate', Date.now());
            }}
            cancel={() => { this.setState({ login_otp: false }) }}
            secret={this.state["2fa"]}
          />
          : ''
        }
        <Row style={{ marginTop: "5%" }}>
          <Col lg={4} md={3}></Col>
          <Col lg={4} md={6}>
            <Col style={{ paddingLeft: "11.250px", marginBottom: 50 }}>
              <img src="../assets/images/logo.png" width="40px" style={{ float: 'right' }} />
              <text id="page-title" className="blue-title">Login below</text>
            </Col>

            <Form onSubmit={this.login} >
              {this.state.device_used ?
                <div className="form-input" style={{ height: 'fit-content', borderRadius: 5, padding: 10 }}>

                  <text
                    onClick={() => {
                      this.setState({
                        device_used: false,
                        last_date: undefined,
                        username: ''
                      }, () => {
                        localStorage.removeItem("username")
                        localStorage.removeItem("lastDate")
                      })
                    }}
                  >
                    <i
                      className="fas fa-times"
                      style={{
                        float: 'right',
                        fontSize: 14,
                        color: '#a1a1a1',
                        cursor: 'pointer'
                      }}
                    ></i></text>
                  <div className="profile-element">
                    <img src='../assets/images/profile.png' style={{ height: '3rem', marginRight: 20, borderRadius: '50%' }} />
                  </div>
                  <div className="profile-element">
                    <text>{this.state.username.substr(0, 3)}***{this.state.username.substr(this.state.username.length - 3, this.state.username.length)}</text><br />
                    <text style={{ color: '#a1a1a1' }}>Last login: {this.formatDate(parseInt(this.state.last_date))}</text>
                  </div>
                </div>
                :
                <div className="dark-form"
                  style={{
                    marginTop: 20
                  }}>
                  <Form.Control
                    onChange={this.handleChange}
                    value={this.state.username}
                    placeholder="Username"
                    id="username"
                    type="text"
                    className="form-input"
                  />
                </div>
              }
              <div><text style={{ color: 'red' }}>{this.state.username_err}</text></div>
              <div className="dark-form" style={{
                marginTop: 20
              }}>
                <Form.Control
                  onChange={this.handleChange}
                  value={this.state.password}
                  placeholder="Password"
                  id="password"
                  type="password"
                  className="form-input"
                />
              </div>
              <div><text style={{ color: 'red' }}>{this.state.password_err}</text></div>
              <Button
                disabled={this.state.disabled}
                className="btn-dark"
                id="login-btn"
                style={{
                  width: "100%",
                  marginTop: 40,
                  height: 40,
                }}
                type="submit"
              >
                {this.state.disabled ? <img src="../assets/images/spinner.gif" width="30" /> : <text>Login</text>}
              </Button>
              <text style={{ textAlign: 'center' }} className="grey-text text-darken-1">
                <Link to="/auth/recover">Forgot your password?</Link>
              </text>
            </Form>
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <text style={{ width: '100%', }}>Please check that you are visiting the correct URL:</text>
              <div className="gray-pill">
                <img src="../assets/images/safe.svg" />
            &nbsp;{window.location.protocol + '//' + window.location.host}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    )
  }

}

export default Login;