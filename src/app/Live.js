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
import io from 'socket.io-client'
let socket
import GoogleMapReact from 'google-map-react';
export default class Live extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activity: [],
            devices: [],
            users: [],
            business: [],
            businessTrips: [],
            index: 0,
            show: false,
            businessLocation: {
                lat: 19.214453,
                lng: -70.519168
            },
            carLocation: {
                lat: 19.214453,
                lng: -70.519168
            },
            keyLocation: {
                lat: 19.214453,
                lng: -70.519168
            },
            valetLocation: {
                lat: 19.214453,
                lng: -70.519168
            },
            userLocation: {
                lat: 19.214453,
                lng: -70.519168
            }
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleDropdown = this.handleDropdown.bind(this);
    }
    componentDidMount() {
        this.props.verify(() => {
            socket = io()
            socket.on('valetLocation', data => {
                let { latitude, longitude, speed } = data
                this.setState({
                    valetLocation: {
                        lat: latitude,
                        lng: longitude
                    }
                })
            })
            socket.on('userLocation', data => {
                let { latitude, longitude, speed } = data
                this.setState({
                    userLocation: {
                        lat: latitude,
                        lng: longitude
                    }
                })
            })
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
    copy(id) {
        var copyText = document.getElementById(id);
        copyText.select();
        document.execCommand("copy");
        this.notify('Referal link copied', true)
    }
    getBusinessTrips() {
        fetch(`/api/admin/trips/${this.state.businessId}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                let { success, businessTrips } = data
                if (success) {
                    this.setState({
                        businessTrips
                    })
                }
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
    linkToTrip(tripId) {
        this.setState({
            tripId
        })
        socket.emit('joinTrip', {
            tripId
        }, data => {
            let { valetLocation,
                userLocation,
                carLocation,
                keyLocation } = data
            if (data != "FAIL") {
                this.setState({
                    valetLocation,
                    userLocation,
                    carLocation,
                    keyLocation
                })
            } else {
                this.notify('Failed to open Trip', false)
            }
        })
    }
    render() {
        return (
            <Container>
                <Row>
                    <strong className="blue-title">Live View</strong>
                </Row>
                <div style={{ height: '80vh', width: '100%' }}>
                    <div
                        style={{
                            position: 'relative',
                            left: 60,
                            top: 20,
                            width: 400,
                            height: 480,
                            zIndex: 20,
                            marginBottom: -480
                        }}>
                        <Row>
                            <Col lg={6}>
                                <h1>Business</h1>
                                {this.props.business.map(info => {
                                    return (
                                        <div className="businessTab" onClick={() => {
                                            let { businessId } = info;
                                            this.setState({
                                                businessLocation: {
                                                    lat: info.latitude,
                                                    lng: info.longitude,
                                                },
                                                businessId
                                            }, () => {
                                                this.getBusinessTrips()
                                            })
                                        }}>
                                            <strong style={{ color: 'black' }}>{info.name}</strong><br />
                                            <strong style={{ whiteSpace: 'nowrap' }}>{info.businessId}</strong>
                                        </div>
                                    )
                                })}
                                <div className="businessTab" style={{ color: 'black' }}>
                                    <strong>Legend</strong>
                                    <ul>
                                        <li>🙋‍♂️ Client</li>
                                        <li>🤵 Valet</li>
                                        <li>🚗 Car</li>
                                        <li>🔑 Key</li>
                                    </ul>
                                </div>
                            </Col>
                            <Col lg={6} >
                                <h1>Trips</h1>
                                <div style={{
                                    maxHeight: '60vh',
                                    overflow: 'scroll'
                                }}>
                                    {this.state.businessTrips.length ?
                                        this.state.businessTrips.map(info => {
                                            return (
                                                <div className="businessTab" onClick={() => {
                                                    this.linkToTrip(info.tripId)
                                                }}>
                                                    {info.dateEnd == null && <div style={{
                                                        color: 'lightgreen', fontSize: 12, fontWeight: 'bold', float: 'right'
                                                    }}>Live</div>}
                                                    <strong style={{ color: 'black', whiteSpace: 'nowrap' }}>{info.username}</strong><br />
                                                    <strong style={{ whiteSpace: 'nowrap' }}>{info.dateStart}</strong>
                                                </div>
                                            )
                                        }) :
                                        <div>
                                            <strong>No trips found</strong>
                                        </div>
                                    }
                                </div>
                            </Col>
                        </Row>
                    </div>
                    <GoogleMapReact
                        bootstrapURLKeys={{ key: 'AIzaSyAc6m5osCM9PuElq7I5rTeE8OA0OqXpN3g' }}
                        defaultCenter={{ lat: 19.214453, lng: -70.519168 }}
                        center={this.state.businessLocation}
                        defaultZoom={20}
                    >
                        <Business
                            {...this.state.businessLocation}
                            src={this.state.businessImg}
                        />
                        <Valet
                            lat={this.state.valetLocation ? this.state.valetLocation.latitude : 0}
                            lng={this.state.valetLocation ? this.state.valetLocation.longitude : 0}
                        />
                        <User
                            lat={this.state.userLocation ? this.state.userLocation.latitude : 0}
                            lng={this.state.userLocation ? this.state.userLocation.longitude : 0}
                        />
                        <Car
                            lat={this.state.carLocation ? this.state.carLocation.latitude : 0}
                            lng={this.state.carLocation ? this.state.carLocation.longitude : 0}
                        />
                        <Key
                            lat={this.state.keyLocation ? this.state.keyLocation.latitude : 0}
                            lng={this.state.keyLocation ? this.state.keyLocation.longitude : 0}
                        />
                    </GoogleMapReact>
                </div>
                <Row>
                    <Col lg={6}>
                        <h1>Trip events</h1>
                    </Col>
                    <Col lg={6}>
                        <h1>Parking State</h1>
                    </Col>
                </Row>
                <div style={{ height: 60 }}></div>
            </Container >
        )
    }
}
const Business = ({ src }) => <img src={src || '../assets/images/logo.png'} width={50} />
const Valet = () => <div style={{ fontSize: 36 }}>🤵</div>
const User = () => <div style={{ fontSize: 36 }}>🙋‍♂️</div>
const Car = () => <div style={{ fontSize: 36 }}>🚗</div>
const Key = () => <div style={{ fontSize: 36 }}>🔑</div>