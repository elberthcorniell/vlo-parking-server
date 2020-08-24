import React, { Component } from 'react';
import { Link } from "react-router-dom";
import {
  Modal,
  Col,
  Row,
  Button,
  Form
} from 'react-bootstrap'
import Authenticator from './Authenticator'

export default class PopUpLogin extends Component {

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
      fetch('/api/validate/login', {
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
          if (data.success == true) {
            if (data["2fa"]) {
              this.setState({
                login_otp: true,
                "2fa": data["2fa"],
                token: data.token
              })
            } else {
              localStorage.setItem('authtoken', data.token);
              localStorage.setItem('username', this.state.username);
              localStorage.setItem('lastDate', Date.now());
              this.props.onLogin()
              this.setState({
                username: ''
              })
            }
          } else {
            this.setState({
              password: '', password_err: data.password_err || '',
              username_err: data.username_err || ''
            }, () => {
              setTimeout(() => {
                this.setState({
                  password_err: '',
                  username_err: ''
                })
              }, 3000)
            });
          }
        })
        .catch(err => console.error(err));
    })
    e.preventDefault();
  }

  handleChange(e) {
    const { id, value } = e.target;
    this.setState({
      [id]: value
    })
  }

  componentDidMount() {
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
        <Modal style={{ overflow: 'hidden', maxHeight: '100vh' }} show={this.props.loginModal}>
            <div style={{ zIndex: 5, width: 'fit-content', height: 'fit-content', position: 'absolute', top: 10, right: 10, cursor: 'pointer' }} onClick={() => window.location.replace('../?callback=' + window.location.pathname)}>
                <i className="material-icons left" style={{ fontSize: 18 }}>clear</i>
            </div>
            <Modal.Body style={{ padding: 20, maxHeight: '90vh', overflowY: 'scroll' }}>
        {this.state.login_otp ?
          <Authenticator
            callback={() => {
              localStorage.setItem('authtoken', this.state.token);
              localStorage.setItem('username', this.state.username);
              localStorage.setItem('lastDate', Date.now());
              this.props.onLogin()
              this.setState({
                username: ''
              })
            }}
            cancel={() => { this.setState({ login_otp: false }) }}
            secret={this.state["2fa"]}
          />
          : ''
        }
        <Row style={{ marginTop: "5%" }}>
          <Col>
            <Col style={{ paddingLeft: "11.250px", marginBottom: 50 }}>
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
                    <text>{this.state.username.substr(0,3)}***{this.state.username.substr(this.state.username.length-3,this.state.username.length)}</text><br />
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
                  backgroundColor: '#ff4040'
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
            </Modal.Body>
        </Modal>
    )
  }

}