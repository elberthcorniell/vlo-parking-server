import React, { Component } from 'react';
import { Link } from "react-router-dom";
import {
  Container,
  Col,
  Row,
  Button,
  Form
} from 'react-bootstrap'

class Register extends Component {
  constructor() {
    super();
    this.state = {
      username: '',
      password: '',
      email: '',
      email_err2: '',
      username_err2: '',
      password_err2: '',
      sponsor_err: '',
      disabled: false,
      u: true,
      index: 0
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleEmailValidation = this.handleEmailValidation.bind(this);
    this.onKeyPressed = this.onKeyPressed.bind(this);
    this.register = this.register.bind(this);
    this.validateEmail = this.validateEmail.bind(this);
  }

  handleChange(e) {
    const { id, value } = e.target;
    this.setState({
      [id]: value
    })
  }

  validateEmail(e) {
    this.setState({
      disabled: true
    })
    const digits = Math.floor(100000 + Math.random() * 900000)
    localStorage.setItem("6digitcode", digits)
    fetch("/api/validate/email", {
      method: 'POST',
      body: JSON.stringify({
        digits,
        email: this.state.email
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
      .then(data => {
        this.setState({
          index: data.success ? this.state.index + 1 : this.state.index,
          email_err: data.email_err,
          disabled: false
        })
      })
    e.preventDefault()
  }

  login(e) {
    fetch('/api/validate/login', {
      method: 'POST',
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success == true) {
          if (data["2fa"]) {
            this.setState({
              login_otp: true,
              "2fa": data["2fa"],
              token: data.token
            })
          } else {
            window.location.replace('../app');
            localStorage.setItem('authtoken', data.token);
            localStorage.setItem('username', this.state.username2);
            localStorage.setItem('lastDate', Date.now());
          }
        } else {
          this.setState({
            username: '', password: '', password_err: data.password_err || '',
            username_err: data.username_err || ''
          });
        }
      })
      .catch(err => console.error(err));
    e.preventDefault();
  }

  handleEmailValidation(e) {
    const { id, value } = e.target;
    if (value.toString().length == 6) {
      this.setState({
        "1": parseInt(value.toString().slice(0, 1)),
        "2": parseInt(value.toString().slice(1, 2)),
        "3": parseInt(value.toString().slice(2, 3)),
        "4": parseInt(value.toString().slice(3, 4)),
        "5": parseInt(value.toString().slice(4, 5)),
        "6": parseInt(value.toString().slice(5, 6)),
      }, () => {
        setTimeout(() => {
          if (value == localStorage.getItem('6digitcode')) {
            this.setState({
              index: this.state.index + 1
            })
          } else {
            this.setState({
              validation_err: 'Invalid validation code'
            }, () => {
              setTimeout(() => {
                this.setState({
                  validation_err: ''
                })
              }, 2000)
            })
            document.getElementById("1").focus()
            this.setState({
              "1": '',
              "2": '',
              "3": '',
              "4": '',
              "5": '',
              "6": '',
              fail: this.state.fail + 1
            })
          }
        }, 1000)
      })
    }
    if (value.length <= 1) {
      this.setState({
        [id]: value.toString()
      })
      if (value.length == 1) {
        if (id == "6") {
          if (this.state["1"] + this.state["2"] + this.state["3"] + this.state["4"] + this.state["5"] + value == localStorage.getItem("6digitcode")) {
            this.setState({
              index: this.state.index + 1
            })
          } else {
            this.setState({
              validation_err: 'Invalid validation code'
            }, () => {
              setTimeout(() => {
                this.setState({
                  validation_err: ''
                })
              }, 2000)
            })
            document.getElementById("1").focus()
            this.setState({
              "1": '',
              "2": '',
              "3": '',
              "4": '',
              "5": '',
              "6": '',
              fail: this.state.fail + 1
            })
          }
        } else {
          document.getElementById((parseInt(id) + 1).toString()).focus()
        }
      }
    }
  }

  register(e) {
    this.setState({
      disabled: true
    }, () => {
      fetch('/api/validate/register', {
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
            this.setState({
              index: this.state.index + 1
            })
          } else {
            this.setState({
              username: '', password: '',
              username_err2: data.username_err || '',
              password_err2: data.password_err || '', sponsor_err: data.sponsor_err || ''
            });
          }
        })
        .catch(err => console.error(err));
    })
    e.preventDefault();
  }

  onKeyPressed(event) {
    if ((event.keyCode == 8 || event.keyCode == 46) & event.target.value.length == 0) {
      document.getElementById((parseInt(event.target.id) - 1).toString()).focus()
    }
  }

  componentDidMount() {
    this.props.setPath(window.location.pathname)
    var url_string = window.location.href;
    var url = new URL(url_string);
    var u = url.searchParams.get("u");
    var email = url.searchParams.get("e");
    u != undefined ? sessionStorage.setItem('u', u) : ''
    this.setState({
      u: u != undefined,
      email: email || '',
      sponsor: u || sessionStorage.getItem('u')
    }, () => {
      if (email != undefined) {
        var btn = document.getElementById("emailBtn")
        btn.click()
      }
    })
    window.addEventListener('load',()=>{
      document.title = `${document.getElementById('page-title').textContent} | Inverte`
    }) 
  }

  areaToShow(index) {
    switch (index) {
      case 0:
      default:
        return (
          <Row style={{ marginTop: "5%" }}>
            <Col lg={4} md={3}></Col>
            <Col lg={4} md={6}>
              <Col style={{ paddingLeft: "11.250px", marginBottom: 50 }}>
                <img src="../assets/images/logo.png" width="40px" style={{ float: 'right' }} />
                <text id="page-title" className="blue-title">Create Account</text>
              </Col>

              <Form id="emailInput" onSubmit={this.validateEmail}>
                <div className="dark-form"
                  style={{
                    marginTop: 20
                  }}>
                  <Form.Control
                    onChange={this.handleChange}
                    value={this.state.email}
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="Email"
                    required
                  />
                </div>
                <div><text style={{ color: 'red' }}>{this.state.email_err}</text></div>
                <Button
                  id="emailBtn"
                  disabled={this.state.disabled}
                  style={{
                    width: "100%",
                    height: 40,
                    marginTop: 20,
                  }}
                  type="submit"
                  className="btn-dark"
                >
                  {!this.state.disabled ? <text>Register<i style={{ fontSize: 12 }} className="material-icons">arrow_forward</i></text> : <img src="../assets/images/spinner.gif" width="30" />}
                </Button>
              </Form>
              <text>By signing up you agree to the <Link>Terms of Service</Link> and <Link>Privacy Policy</Link></text>

            </Col>
          </Row>
        )
      case 1: return (
        <Row style={{ marginTop: "5%" }}>
          <Col lg={4} md={3}></Col>
          <Col lg={4} md={6}>
            <Col style={{ paddingLeft: "11.250px", marginBottom: 30 }}>
              <img src="../assets/images/logo.png" width="40px" style={{ float: 'right' }} />
              <text className="blue-title">Validate email</text><br />
            </Col>

            <text>Please input the 6 digit validation code we have sent to <b>{this.state.email}</b>. <Link onClick={this.validateEmail}>Send new code</Link></text>
            <Form style={{ marginBottom: 40, marginTop: 40 }}>
              <div className="dark-form" style={{ margin: 5, display: 'inline-block', width: 'calc(16.6% - 10px)' }}>
                <Form.Control id="1" value={this.state["1"]} className="form-input" onChange={this.handleEmailValidation} onKeyDown={this.onKeyPressed} tabIndex="0" autoComplete="off" inputMode="numeric" style={{ textAlign: 'center' }}></Form.Control>
              </div>
              <div className="dark-form" style={{ margin: 5, display: 'inline-block', width: 'calc(16.6% - 10px)' }}>
                <Form.Control id="2" value={this.state["2"]} className="form-input" onChange={this.handleEmailValidation} onKeyDown={this.onKeyPressed} tabIndex="0" autoComplete="off" inputMode="numeric" style={{ textAlign: 'center' }}></Form.Control>
              </div>
              <div className="dark-form" style={{ margin: 5, display: 'inline-block', width: 'calc(16.6% - 10px)' }}>
                <Form.Control id="3" value={this.state["3"]} className="form-input" onChange={this.handleEmailValidation} onKeyDown={this.onKeyPressed} tabIndex="0" autoComplete="off" inputMode="numeric" style={{ textAlign: 'center' }}></Form.Control>
              </div>
              <div className="dark-form" style={{ margin: 5, display: 'inline-block', width: 'calc(16.6% - 10px)' }}>
                <Form.Control id="4" value={this.state["4"]} className="form-input" onChange={this.handleEmailValidation} onKeyDown={this.onKeyPressed} tabIndex="0" autoComplete="off" inputMode="numeric" style={{ textAlign: 'center' }}></Form.Control>
              </div>
              <div className="dark-form" style={{ margin: 5, display: 'inline-block', width: 'calc(16.6% - 10px)' }}>
                <Form.Control id="5" value={this.state["5"]} className="form-input" onChange={this.handleEmailValidation} onKeyDown={this.onKeyPressed} tabIndex="0" autoComplete="off" inputMode="numeric" style={{ textAlign: 'center' }}></Form.Control>
              </div>
              <div className="dark-form" style={{ margin: 5, display: 'inline-block', width: 'calc(16.6% - 10px)' }}>
                <Form.Control id="6" value={this.state["6"]} className="form-input" onChange={this.handleEmailValidation} onKeyDown={this.onKeyPressed} tabIndex="0" autoComplete="off" inputMode="numeric" style={{ textAlign: 'center' }}></Form.Control>
              </div>

              <div><text style={{ color: 'red' }}>{this.state.validation_err}</text></div>
            </Form>

            <text style={{ marginTop: 40 }}>If you haven't received the email, please try the following:
              <ul>
                <li>Make sure the email address you provided is correct.</li>
                <li>Check your Spam or Junk mail folders.</li>
                <li>Add Inverte to your email address whitelist. <Link>Learn more</Link></li>
                <li>Change email provider. <Link>How to change email provider?</Link></li>
                <li>Make sure your email is functioning normally.</li>
              </ul>
            </text>
          </Col>
        </Row>

      )
      case 2:
        return (
          <Row style={{ marginTop: "5%" }}>
            <Col lg={4} md={3}></Col>
            <Col lg={4} md={6}>
              <Col style={{ paddingLeft: "11.250px", marginBottom: 50 }}>
                <img src="../assets/images/logo.png" width="40px" style={{ float: 'right' }} />
                <text className="blue-title">Create Account</text>
              </Col>

              <Form onSubmit={this.register} >
                <div className="dark-form"
                  style={{
                    marginTop: 20
                  }}>
                  <Form.Control
                    onChange={this.handleChange}
                    value={this.state.username}
                    id="username"
                    type="text"
                    className="form-input"
                    placeholder="Username"
                  />
                </div>

                <div><text style={{ color: 'red' }}>{this.state.username_err2}</text></div>
                <div className="dark-form"
                  style={{
                    marginTop: 20
                  }}>
                  <Form.Control
                    onChange={this.handleChange}
                    value={this.state.password}
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="Password"
                  />
                </div>
                <div><text style={{ color: 'red' }}>{this.state.password_err2}</text></div>
                <Button
                  disabled={this.state.disabled}
                  style={{
                    width: "100%",
                    height: 40,
                    marginTop: 40,
                  }}
                  type="submit"
                  className="btn-dark"
                >
                  {!this.state.disabled ? <text>Register<i style={{ fontSize: 12 }} className="material-icons">arrow_forward</i></text> : <img src="../assets/images/spinner.gif" width="30" />}
                </Button>
              </Form>
              <text>By signing up you agree to the <Link>Terms of Service</Link> and <Link>Privacy Policy</Link></text>
            </Col>
          </Row>
        )
      case 3:
        return (
          <Row style={{ marginTop: "5%" }}>
            <Col lg={4} md={3}></Col>
            <Col lg={4} md={6}>
              <Col style={{ paddingLeft: "11.250px", marginBottom: 30 }}>
                <img src="../assets/images/logo.png" width="40px" style={{ float: 'right' }} />
                <text className="blue-title">You're Ready!</text>
              </Col>
              <text style={{ marginTop: 40 }}>Next steps:
              <ul>
                  <li>Wait for the admin to grant you access.</li>
                  <li>Enable all security features such as 2fa and anti pishing codes. <Link>Learn more</Link></li>
                  <li>Download Vlo Valet app.<Link>here</Link></li>
                </ul>
              </text>
            </Col>
          </Row>
        )
    }
  }

  render() {
    return (
      <Container style={{ maxWidth: '100vw' }}>
        {this.areaToShow(this.state.index)}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <text style={{ width: '100%', }}>Please check that you are visiting the correct URL:</text>
          <div className="gray-pill">
            <img src="../assets/images/safe.svg" />
              &nbsp;{window.location.protocol + '//' + window.location.host}
          </div>
        </div>
      </Container>
    )
  }
}

export default Register;