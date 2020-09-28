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
export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activity: [],
            devices: [],
            business: [],
            parking: [],
            index: 0,
            new_address: '',
            address_err: '',
            new_address_ETH: '',
            address_err_ETH: '',
            password: '',
            new_password: '',
            show: false,
            secret: authenticator.generateSecret(),
            twofa: false,
            twofa_err: '',
            setting_index: 0,
            type: 'type',
            deviceType: []
        };
        this.handleChange = this.handleChange.bind(this);
        this.addDevice = this.addDevice.bind(this);
        this.addBusiness = this.addBusiness.bind(this);
        this.addParking = this.addParking.bind(this);
        this.handleDropdown = this.handleDropdown.bind(this);
    }
    componentDidMount() {
        this.props.verify(() => {
            this.getDeviceType()
            this.getDevices()
            this.getParking()
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
    getDeviceType() {
        fetch('/api/admin/device/type')
            .then(res => res.json())
            .then(data => {
                let { success, deviceType } = data
                if (!success) {
                    this.notify('Network Error', success)
                } else {
                    this.setState({
                        deviceType
                    })
                }
            })
    }
    getDevices() {
        fetch('/api/admin/device')
            .then(res => res.json())
            .then(data => {
                console.log(data)
                let { success, devices } = data
                if (!success) {
                    this.notify('Network Error', success)
                } else {
                    this.setState({
                        devices
                    })
                }
            })
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
    addDevice(e) {
        e.preventDefault()
        this.setState({
            disabled: true
        }, () => {
            if (this.state.type != 'type') {
                let { deviceId, type, description } = this.state
                fetch('/api/admin/device', {
                    method: 'POST',
                    body: JSON.stringify({
                        deviceId, type, description
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
                            if (success)
                                this.getDevices()
                        })
                    })
            } else {
                this.notify('Invalid Device Type', false)
                this.setState({
                    disabled: false
                })
            }
        })
    }
    deleteBusiness(id) {
        if (confirm('Are you sure you want to delete this Item?')) {
            fetch(`/api/admin/business`, {
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
                        this.props.getBusiness()
                })
        } else {
            this.notify('Action canceled', false)
        }
    }
    addBusiness(e) {
        e.preventDefault()
        this.setState({
            disabled: true
        }, () => {
            console.log(this.state)
            let { name, latitude, longitude, areaRadius, maxSpeed } = this.state
            fetch('/api/admin/business', {
                method: 'POST',
                body: JSON.stringify({
                    name, latitude, longitude, areaRadius, maxSpeed
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
                        if (success)
                            this.props.getBusiness()
                    })
                })
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
    settingToShow(index) {
        switch (index) {
            case 0: return (
                <Card style={{ height: 'fit-content' }}>
                    {this.props.token == null ?
                        <div>
                            {this.state.twofa == true ?
                                <Authenticator
                                    cancel={() => { this.setState({ twofa: false }) }}
                                    callback={() => this.setToken()}
                                    secret={this.state.secret}
                                />
                                :
                                ''}
                            <Card.Body>
                                <strong>2 Factor Authentication</strong>
                                <div style={{ width: 'calc(100% - 60px)', textAlign: 'center', margin: 30 }}>
                                    <QRCode
                                        style={{
                                        }}
                                        value={"otpauth://totp/Inverte - " + this.props.username + "?secret=" + this.state.secret + "&issuer=Inverte"}
                                        size='180'
                                        bgColor='#fff'
                                        fgColor='#01153d'
                                        logoImage='../assets/images/qr_logo.png'
                                        logoWidth='45'
                                        quietZone=''
                                    />
                                    <div>
                                        <strong style={{ fontSize: 18, marginTop: 10, color: '#01153d' }}>{this.state.secret}</strong>
                                    </div>
                                </div>
                                <div><strong style={{ color: 'red' }}>{this.state.twofa_err}</strong></div>
                                <Button
                                    onClick={() => { window.location.replace("otpauth://totp/Inverte - " + this.props.username + "?secret=" + this.state.secret + "&issuer=Inverte") }}
                                    style={{
                                        width: '100%',
                                        padding: 10,
                                        color: '#FFF',
                                        marginTop: 15,
                                        backgroundColor: '#5b86e5',
                                        borderColor: 'rgba(0,0,0,0)',
                                    }}><strong>Set</strong></Button>
                                <Button
                                    onClick={() => { this.setState({ twofa: true }) }}
                                    className="btn-blue"
                                    style={{
                                        width: '100%',
                                        padding: 10,
                                        color: '#FFF',
                                        marginTop: 15
                                    }}><strong>Verify</strong></Button>
                                <p><strong>Reminder: </strong>Allways have your mnemonics words in a secure place in case of password loss.</p>
                            </Card.Body>
                        </div>
                        :
                        <div>
                            <Card.Body>
                                <strong>2 Factor Authentication</strong>
                                <div style={{ width: '100%', textAlign: 'center' }}>
                                    <img height='80' style={{ margin: 40 }} src={'../assets/images/oneauth_light@2x.png'} />
                                    <div>
                                        <strong>2 factor authentification successfully set</strong>
                                        <p style={{ marginTop: 10 }}>Lost access to your 2fa? <a href="https://bitnationdo.freshdesk.com/"><strong>Click here.</strong></a></p>
                                    </div>
                                </div>
                                <p><strong>Reminder: </strong>Allways have your mnemonics words in a secure place in case of password loss.</p>

                            </Card.Body>
                        </div>
                    }

                </Card>

            )
            case 1: return (
                <Card style={{ height: 'calc(100% - 10px)' }}>
                    <Card.Body>
                        <strong>Password</strong>
                        <div style={{ width: '100%', textAlign: 'center' }}>
                            <img height='80' style={{ margin: 40 }} src={'../assets/images/insurance.png'} />
                        </div>
                        <div className="dark-form" style={{ whiteSpace: 'nowrap', marginTop: 15, textAlign: 'left' }}>
                            <p style={{ display: 'inline-block', marginLeft: 15, marginBottom: 0, width: '30%' }}><strong>PASSWORD</strong></p>
                            <Form.Control id='password' type="password" value={this.state.password} className="form-dark" onChange={this.handleChange} style={this.form_dark_2} ></Form.Control>
                        </div>
                        <div className="dark-form" style={{ whiteSpace: 'nowrap', marginTop: 15, textAlign: 'left' }}>
                            <p style={{ display: 'inline-block', marginLeft: 15, marginBottom: 0, width: '30%' }}><strong>NEW</strong></p>
                            <Form.Control id='new_password' type="password" value={this.state.new_password} className="form-dark" onChange={this.handleChange} style={this.form_dark_2} ></Form.Control>
                        </div>
                        <div><strong style={{ color: 'red' }}>{this.state.password_err}</strong></div>
                        <Button
                            className='btn-blue'
                            onClick={() => { this.setPassword() }}
                            disabled={this.state.new_password < 6 | this.state.password < 6}
                            style={{
                                width: '100%',
                                padding: 10,
                                color: '#FFF',
                                marginTop: 15
                            }}><strong>Set Password</strong></Button>
                        <p><strong>Reminder: </strong>Allways have your mnemonics words in a secure place in case of password loss.</p>
                    </Card.Body>
                </Card>

            )
            case 2: return (
                <Card style={{ height: 'calc(100% - 10px)' }}>
                    <Card.Body>
                        <strong>Ethereum Withdraw address</strong>
                        <div style={{ width: '100%', textAlign: 'center' }}>
                            <img height='80' style={{ margin: 40 }} src={'../assets/images/ETH.png'} />
                        </div>
                        <div className="dark-form" style={{ whiteSpace: 'nowrap', marginTop: 15, textAlign: 'left' }}>
                            <p style={{ display: 'inline-block', marginLeft: 15, marginBottom: 0, width: '30%' }}><strong>ADDRESS</strong></p>
                            <Form.Control id='withdraw_address_ETH' value={this.props.withdraw_address_ETH} className="form-dark" style={this.form_dark_2} ></Form.Control>
                        </div>
                        <div className="dark-form" style={{ whiteSpace: 'nowrap', marginTop: 15, textAlign: 'left' }}>
                            <p style={{ display: 'inline-block', marginLeft: 15, marginBottom: 0, width: '30%' }}><strong>NEW</strong></p>
                            <Form.Control id='new_address_ETH' value={this.state.new_address_ETH} className="form-dark" onChange={this.handleChange} style={this.form_dark_2} ></Form.Control>
                        </div>
                        <div><strong style={{ color: 'red' }}>{this.state.address_err_ETH}</strong></div>
                        <Button
                            className='btn-blue'
                            onClick={() => { this.setETHAddress() }}
                            disabled={this.state.new_address_ETH.length < 25}
                            style={{
                                width: '100%',
                                padding: 10,
                                color: '#FFF',
                                marginTop: 15
                            }}><strong>Set address</strong></Button>
                        <p>Withdrawal via Shield will be processed with your OneAuth username.</p>
                    </Card.Body>
                </Card>
            )
            case 3: return (
                <Card style={{ height: 'calc(100% - 10px)' }}>
                    <Card.Body>
                        <strong>Bitcoin Withdraw address</strong>
                        <div style={{ width: '100%', textAlign: 'center' }}>
                            <img height='80' style={{ margin: 40 }} src={'../assets/images/BTC.png'} />
                        </div>
                        <div className="dark-form" style={{ whiteSpace: 'nowrap', marginTop: 15, textAlign: 'left' }}>
                            <p style={{ display: 'inline-block', marginLeft: 15, marginBottom: 0, width: '30%' }}><strong>ADDRESS</strong></p>
                            <Form.Control id='insurance' value={this.props.withdraw_address} className="form-dark" style={this.form_dark_2} ></Form.Control>
                        </div>
                        <div className="dark-form" style={{ whiteSpace: 'nowrap', marginTop: 15, textAlign: 'left' }}>
                            <p style={{ display: 'inline-block', marginLeft: 15, marginBottom: 0, width: '30%' }}><strong>NEW</strong></p>
                            <Form.Control id='new_address' value={this.state.new_address} className="form-dark" onChange={this.handleChange} style={this.form_dark_2} ></Form.Control>
                        </div>
                        <div><strong style={{ color: 'red' }}>{this.state.address_err}</strong></div>
                        <Button
                            className='btn-blue'
                            onClick={() => { this.setAddress() }}
                            disabled={this.state.new_address.length < 25}
                            style={{
                                width: '100%',
                                padding: 10,
                                color: '#FFF',
                                marginTop: 15
                            }}><strong>Set address</strong></Button>
                        <p>Withdrawal via Shield will be processed with your OneAuth username.</p>
                    </Card.Body>
                </Card>

            )
        }
    }
    areaToShow(area) {
        switch (area) {
            case 0: return (
                <Row>
                    <Col lg={6} xs={12}>
                        <Card style={{ height: 'fit-content' }}>
                            <Card.Body>
                                <strong>Profile resume</strong>
                                <div className="profile-widget" style={{ textAlign: 'center' }}>
                                    <p style={{ width: '100%', fontWeight: 500, fontSize: 24 }} >{this.formatEmail(this.props.email)}</p>
                                    <div style={{ padding: 5, display: 'inline-block', backgroundColor: 'rgba(54,209,220,0.1)', border: 'none 0px white', borderRadius: 5, color: '#5b86e5', fontWeight: 500, width: 'fit-content' }}>
                                        Admin
                                    </div>
                                </div>
                                <Button
                                    className='btn-blue'
                                    onClick={() => { this.logout() }}
                                    style={{
                                        width: 'calc(50% - 20px)',
                                        padding: 10,
                                        color: '#FFF',
                                        margin: 10
                                    }}><strong>Logout</strong></Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )
            case 1: return (
                <Row>
                    <Col lg={6} xs={12}>
                        <strong>Add device</strong>
                        <Form onSubmit={this.addDevice}>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="text" id='deviceId' placeholder="deviceId" min="10" step="1" onChange={this.handleChange} value={this.state.unlock_amount} className="form-input" ></Form.Control>
                            </div>
                            <div className="dropdown" style={{ width: '100%' }}>
                                <button type="button" onClick={() => this.handleDropdown('investmentDropdown')} style={{ marginTop: 10 }} className="coinbtn">{this.state.type}<i style={{ fontSize: 18, color: 'black', float: 'right' }} className="large material-icons">arrow_drop_down</i></button>
                                <div id="investmentDropdown" className="dropdown-coin">
                                    {
                                        this.state.deviceType.map((info, index) => {
                                            if (!info.disabled) {
                                                return (
                                                    <a style={{ color: '#a1a1a1' }} href="#" onClick={() => { this.setState({ type: info.typeId }, () => { this.handleDropdown('investmentDropdown') }) }}>
                                                        <div style={{ width: '50%', display: 'inline-block', verticalAlign: 'middle' }}>
                                                            <strong>{info.typeId}</strong>
                                                        </div>
                                                        <div style={{ width: '50%', display: 'inline-block', color: 'black', whiteSpace: 'nowrap', textAlign: 'right', textOverflow: 'ellipsis', overflow: 'hidden', verticalAlign: 'middle' }}>
                                                            <strong>{info.name}</strong>
                                                        </div>
                                                    </a>
                                                )
                                            }
                                        })
                                    }
                                </div>
                            </div>
                            <div className="dark-form" style={{ marginTop: 10, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="textbox" id='description' placeholder="description" min="10" step="1" onChange={this.handleChange} value={this.state.unlock_amount} className="form-input" ></Form.Control>
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
                            > {this.state.disabled ? <img src="../assets/images/spinner.gif" width="30" /> : <strong>Add Device</strong>}
                            </Button>
                        </Form>


                    </Col>
                    <Col lg={6} xs={12}>
                        <strong>Current devices</strong>
                        {this.state.devices.length > 0 ?
                            <Table borderless responsive>
                                <tbody>
                                    {this.state.devices.map((info, index) => {
                                        return (
                                            <tr>
                                                <td>{info.name == 'gpsCard' ? <i className="material-icons" style={{ color: 'darkcyan' }}>gps_fixed</i> : ''}</td>
                                                <td className="hidden" style={{ width: 200 }}><strong>{info.name}</strong><br /><strong style={{ color: '#a1a1a1' }}>{info.deviceId}</strong></td>
                                                <td><strong style={{ color: info.status ? '#15CD72' : 'red' }}>{info.status ? 'Active' : 'Disabled'} {info.currency}</strong><br /><strong style={{ color: (info.status ? '#a1a1a1' : info.status == null ? 'red' : 'darkorange') }}>{info.status == 1 ? this.formatDate(info.dateAdded) : info.status == null ? 'Failed' : 'Pending...'}</strong></td>
                                                <td><div className="circle-btn"><i onClick={() => { this.deleteDevice(info.deviceId) }} className="material-icons">delete</i></div></td>
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
            )
            case 2: return (
                <Row>
                    <Col lg={6} xs={12}>
                        <strong>Add Business</strong>
                        <Form onSubmit={this.addBusiness}>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="text" id='name' placeholder="name" onChange={this.handleChange} value={this.state.unlock_amount} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="number" id='latitude' placeholder="latitude" step="0.00000001" onChange={this.handleChange} value={this.state.unlock_amount} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="number" id='longitude' placeholder="longitude" step="0.00000001" onChange={this.handleChange} value={this.state.unlock_amount} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="number" id='areaRadius' placeholder="Area Radius" min="0" step="0.01" onChange={this.handleChange} value={this.state.unlock_amount} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="number" id='maxSpeed' placeholder="Max. Speed Allowed" min="0" step="0.01" onChange={this.handleChange} value={this.state.unlock_amount} className="form-input" ></Form.Control>
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
                            > {this.state.disabled ? <img src="../assets/images/spinner.gif" width="30" /> : <strong>Add Business</strong>}
                            </Button>
                        </Form>
                    </Col>
                    <Col lg={6} xs={12}>
                        <strong>Current business</strong>
                        {this.props.business.length > 0 ?
                            <Table borderless responsive>
                                <tbody>
                                    {this.props.business.map((info, index) => {
                                        return (
                                            <tr>
                                                <td><i className="material-icons" style={{ color: 'darkcyan' }}>business</i></td>
                                                <td className="hidden" style={{ width: 200 }}><strong>{(info.latitude || 0).toFixed(8)}</strong><br /><strong style={{ color: '#a1a1a1' }}>{(info.longitude || 0).toFixed(8)}</strong></td>
                                                <td><strong style={{ color: info.status ? '#15CD72' : 'red' }}>{info.name}</strong><br /><strong style={{ color: '#a1a1a1' }}>{this.formatDate(info.dateAdded)}</strong></td>
                                                <td><div className="circle-btn"><i className="material-icons">mode_edit</i></div><div className="circle-btn"><i onClick={() => { this.deleteBusiness(info.businessId) }} className="material-icons">delete</i></div></td>
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
            )

            case 3: return (
                <Row>
                    <Col lg={6} xs={12}>
                        <strong>Add Parking Lot</strong>
                        <Form onSubmit={this.addParking}>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="text" id='businessId' placeholder="Business Id" onChange={this.handleChange} value={this.state.businessId} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="number" id='latitude' placeholder="latitude" step="0.00000001" onChange={this.handleChange} value={this.state.latitude} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="number" id='longitude' placeholder="longitude" step="0.00000001" onChange={this.handleChange} value={this.state.longitude} className="form-input" ></Form.Control>
                            </div>
                            <div className="dark-form" style={{ marginTop: 20, display: 'inline-block', width: '100%' }}>
                                <Form.Control type="number" id='parkNum' placeholder="Parking Number" min="0" step="1" onChange={this.handleChange} value={this.state.parkNum} className="form-input" ></Form.Control>
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
                            > {this.state.disabled ? <img src="../assets/images/spinner.gif" width="30" /> : <strong>Add Parking Lot</strong>}
                            </Button>
                        </Form>
                    </Col>
                    <Col lg={6} xs={12}>
                        <Row>
                            <Col>
                                <strong>Current Parkng Lots</strong>
                                {this.state.parking.length > 0 ?
                                    <Table borderless responsive>
                                        <tbody>
                                            {this.state.parking.map((info, index) => {
                                                return (
                                                    <tr>
                                                        <td><i className="material-icons" style={{ color: 'darkcyan' }}>business</i></td>
                                                        <td className="hidden" style={{ width: 200 }}><strong>{(info.latitude || 0).toFixed(8)}</strong><br /><strong style={{ color: '#a1a1a1' }}>{(info.longitude || 0).toFixed(8)}</strong></td>
                                                        <td><strong style={{ color: info.status ? '#15CD72' : 'red' }}>Paking lot: {info.parkNum}</strong><br /><strong style={{ color: '#a1a1a1' }}>{this.formatDate(info.dateAdded)}</strong></td>
                                                        <td><div className="circle-btn"><i className="material-icons">mode_edit</i></div><div className="circle-btn"><i onClick={() => { this.deleteParking(info.parkId) }} className="material-icons">delete</i></div></td>
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
                                {this.props.business.length > 0 ?
                                    <Table borderless responsive>
                                        <tbody>
                                            {this.props.business.map((info, index) => {
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

            case 4: return (
                <Row>
                    <Col lg={4} xs={12}>
                        <Button
                            style={{
                                width: '100%',
                                height: 40,
                                marginTop: 20
                            }}
                            onClick={() => { this.setState({ setting_index: 0 }) }}
                        >
                            <strong>Two factor Authentication</strong>
                        </Button>
                        <Button
                            style={{
                                width: '100%',
                                height: 40,
                                marginTop: 20
                            }}
                            onClick={() => { this.setState({ setting_index: 1 }) }}
                        >
                            <strong>Password</strong>
                        </Button>
                        <Button
                            style={{
                                width: '100%',
                                height: 40,
                                marginTop: 20
                            }}
                            onClick={() => { this.setState({ setting_index: 2 }) }}
                        >
                            <strong>ETH Default Address</strong>
                        </Button>
                        <Button
                            style={{
                                width: '100%',
                                height: 40,
                                marginTop: 20
                            }}
                            onClick={() => { this.setState({ setting_index: 3 }) }}
                        >
                            <strong>BTC Default Address</strong>
                        </Button>
                    </Col>
                    <Col lg={8} xs={12}>
                        {this.settingToShow(this.state.setting_index)}
                    </Col>
                </Row>
            )
        }
    }
    getParking() {
        fetch('/api/admin/parking')
            .then(res => res.json())
            .then(data => {
                console.log(data)
                let { success, parking } = data
                if (!success) {
                    this.notify('Network Error', success)
                } else {
                    this.setState({
                        parking
                    })
                }
            })
    }
    deleteParking(id) {
        if (confirm('Are you sure you want to delete this Item?')) {
            fetch(`/api/admin/parking`, {
                method: 'DELETE',
                body: JSON.stringify({
                    parkId: id
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
                        this.getParking()
                })
        } else {
            this.notify('Action canceled', false)
        }
    }
    addParking(e) {
        e.preventDefault()
        this.setState({
            disabled: true
        }, () => {
            let { businessId, parkNum, latitude, longitude } = this.state
            fetch('/api/admin/parking', {
                method: 'POST',
                body: JSON.stringify({
                    businessId, parkNum, latitude, longitude
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
                        if (success)
                            this.getParking()
                    })
                })
        })
    }
    render() {
        return (
            <Container>
                <Row>
                    <Col style={{ marginTop: 10 }}>
                        <div style={{
                            float: 'right'
                        }}>
                            <Button onClick={() => { this.setState({ index: 0 }) }} className={this.state.index == 0 ? 'btn-tab-active' : 'btn-tab'}><strong>Profile</strong></Button>
                            <Button onClick={() => { this.setState({ index: 1 }) }} className={this.state.index == 1 ? 'btn-tab-active' : 'btn-tab'}><strong>Devices</strong></Button>
                            <Button onClick={() => { this.setState({ index: 2 }) }} className={this.state.index == 2 ? 'btn-tab-active' : 'btn-tab'}><strong>Business</strong></Button>
                            <Button onClick={() => { this.setState({ index: 3 }) }} className={this.state.index == 3 ? 'btn-tab-active' : 'btn-tab'}><strong>Parking</strong></Button>
                        </div>
                    </Col>
                </Row>
                {this.areaToShow(this.state.index)}
                <div style={{ height: 60 }}></div>
            </Container>
        )
    }
}