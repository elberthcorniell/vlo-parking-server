import React, { Component } from 'react';
import {
    Card,
    Col,
    Container,
    Row,
    Button,
    Form,
    Modal,
    Table
} from "react-bootstrap"
import { QRCode } from 'react-qrcode-logo';
import toaster from 'toasted-notes';
import { authenticator } from '../public/otplib-browser'
import Authenticator from './Authenticator'
export default class Permissions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activity: [],
            devices: [],
            users: [],
            business: [],
            index: 0,
            show: false,
        };
        this.handleChange = this.handleChange.bind(this);
        this.setAsValet = this.setAsValet.bind(this);
        this.handleDropdown = this.handleDropdown.bind(this);
    }
    componentDidMount() {
        this.props.verify(() => {
            this.getActivity()
            this.getUsers()
            this.getBusiness()
        })
    }

    handleDropdown(id, on) {
        if (on) {
            document.getElementById(id).classList.add("show");
        } else {
            document.getElementById(id).classList.toggle("show");
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
        return (date.getDate() + ' ' + monthNames[date.getMonth()] + ', ' + date.getFullYear())
    }
    deleteDevice(id) {
        if (confirm('Are you sure you want to delete this Item?')) {
            fetch(`/api/admin/device`, {
                method: 'DELETE',
                body: JSON.stringify({
                    deviceId: id
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'authorization': localStorage.getItem('authtoken')
                }
            })
                .then(res => res.json())
                .then(data => {
                    let { success, msg } = data
                    this.notify(msg, success)
                    if (success)
                        this.getDevices()
                })
        } else {
            this.notify('Action canceled', false)
        }
    }
    getActivity() {
        fetch('/api/validate/activity/', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success == true) {
                    this.setState({
                        activity: data.result
                    })
                } else {

                }
            })
    }
    copy(id) {
        var copyText = document.getElementById(id);
        copyText.select();
        document.execCommand("copy");
        this.notify('Referal link copied', true)
    }
    setPassword() {
        fetch('/api/validate/password/change', {
            method: 'POST',
            body: JSON.stringify({
                password: this.state.password,
                new_password: this.state.new_password
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                let { success, password_err } = data
                this.notify(password_err ? password_err : 'Password changed succesfully', success)
            })
    }
    setAsValet(e) {
        e.preventDefault()
        this.setState({
            disabled: true
        }, () => {
            if (this.state.type != 'type') {
                let { userId, username, businessId } = this.state
                fetch('/api/admin/valet', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId, username, businessId
                    }),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'authorization': localStorage.getItem('authtoken')
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        let { success, msg } = data
                        this.notify(msg, success)
                            this.setState({
                                disabled: false
                            }, () => {
                                if(success)
                                this.getValets()
                            })
                    })
            } else {
                this.notify('Invalid Device Type', false)
            }
        })
    }
    getUsers() {
        fetch('/api/admin/user', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                let { success, users, msg } = data
                if (!success)
                    this.notify(msg || data.message, false)
                if (success)
                    this.setState({
                        users
                    })
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
    setToken() {
        fetch('/api/validate/token', {
            method: 'POST',
            body: JSON.stringify({
                token: this.state.secret
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                let { success, message } = data
                this.notify(message, success)
                if (success)
                    this.props.update()
                this.setState({
                    twofa: false
                })
            })
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
    formatEmail(data) {
        var email = data.split('@')
        return email[0].slice(0, 2) + '***@' + email[1]
    }
    logout() {
        localStorage.removeItem('authtoken')
        window.location.replace('../auth/login')
    }
    areaToShow(area) {
        switch (area) {
            case 0: return (
                <Row>
                    <Col lg={6} xs={12}>
                        <strong>Add valet</strong>
                        <Form onSubmit={this.setAsValet}>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="text" id='userId' placeholder="userId" value={this.state.userId} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 10, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="text" id='username' placeholder="username" value={this.state.username} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 10, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="text" id='businessId' placeholder="username" value={this.state.businessId} className="form-input" ></Form.Control>
                            </div>
                            <Button
                                className="btn-blue"
                                type="submit"
                                disabled={this.state.disabled}
                                style={{
                                    padding: 10,
                                    width: '100%',
                                    marginTop: 15
                                }}
                            > {this.state.disabled ? <img src="../assets/images/spinner.gif" width="30" /> : <strong>Set As Valet</strong>}
                            </Button>
                        </Form>


                    </Col>
                    <Col lg={6} xs={12}>
                        <Row>
                            <Col lg={12}>
                                <strong>Current users</strong>
                                {this.state.users.length > 0 ?
                                    <Table borderless responsive>
                                        <tbody>
                                            {this.state.users.map((info, index) => {
                                                return (
                                                    <tr onClick={() => {
                                                        let { userId, username } = info;
                                                        this.setState({
                                                            userId, username
                                                        })
                                                    }}
                                                        style={{
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <td>{info.userId}</td>
                                                        <td>{info.username}</td>
                                                    </tr>
                                                )
                                            })
                                            }
                                        </tbody>
                                    </Table>
                                    :
                                    <Card.Body style={{ backgroundColor: '#f3f5f7', textAlign: 'center', borderRadius: 5, paddingTop: 50, paddingBottom: 50, marginTop: 20 }}>
                                        <img src='../assets/images/notfound.png' width={150} style={{ marginBottom: 20 }} /><br />
                                        <strong style={{ color: '#a1a1a1' }}>There's no records found</strong>
                                    </Card.Body>
                                }
                            </Col>

                            <Col lg={12}>
                                <strong>Current business</strong>
                                {this.state.business.length > 0 ?
                                    <Table borderless responsive>
                                        <tbody>
                                            {this.state.business.map((info, index) => {
                                                return (
                                                    <tr onClick={() => {
                                                        let { businessId } = info;
                                                        this.setState({
                                                            businessId
                                                        })
                                                    }}
                                                        style={{
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <td>{info.businessId}</td>
                                                        <td>{info.name}</td>
                                                    </tr>
                                                )
                                            })
                                            }
                                        </tbody>
                                    </Table>
                                    :
                                    <Card.Body style={{ backgroundColor: '#f3f5f7', textAlign: 'center', borderRadius: 5, paddingTop: 50, paddingBottom: 50, marginTop: 20 }}>
                                        <img src='../assets/images/notfound.png' width={150} style={{ marginBottom: 20 }} /><br />
                                        <strong style={{ color: '#a1a1a1' }}>There's no records found</strong>
                                    </Card.Body>
                                }
                            </Col>
                        </Row>
                    </Col>
                </Row>
            )
        }
    }
    render() {
        return (
            <Container>
                <Row>
                    <Col style={{ marginTop: 10 }}>
                        <div style={{
                            float: 'right'
                        }}>
                            <Button onClick={() => { this.setState({ index: 0 }) }} className={this.state.index == 0 ? 'btn-tab-active' : 'btn-tab'}><strong>Valets</strong></Button>
                            <Button onClick={() => { this.setState({ index: 1 }) }} className={this.state.index == 1 ? 'btn-tab-active' : 'btn-tab'}><strong>Admins</strong></Button>
                        </div>
                    </Col>
                </Row>
                {this.areaToShow(this.state.index)}
                <div style={{ height: 60 }}></div>
            </Container>
        )
    }
}