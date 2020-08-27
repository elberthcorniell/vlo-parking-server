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
import toaster from 'toasted-notes';
import io from 'socket.io-client'
import { Line, Chart } from 'react-chartjs-2';
Chart.defaults.scale.gridLines.display = false
let { cameraHost } = require('../config/keys')
let socket
import GoogleMapReact from 'google-map-react';
export default class Live extends Component {
    constructor(props) {
        super(props);
        this.state = {
            temp: [],
            hum: [],
            tripEvents: [],
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
            this.getTemp()
            this.getHum()
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
                this.getTripEvents()
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
    getTripEvents() {
        fetch(`/api/admin/events/${this.state.tripId}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                let { success, events } = data
                this.setState({
                    tripEvents: events || []
                })
            })
    }

    getTemp() {
        fetch(`/api/admin/metrics/temp`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                const { success, metrics } = data
                let dataFeed = []
                let dataDate = []
                metrics.reverse().map(data => {
                    dataFeed.push(data.value)
                    dataDate.push(this.formatDate(data.date))
                })
                success ?
                    this.setState({
                        temp: (canvas) => {
                            const ctx = canvas.getContext("2d")
                            const gradient = ctx.createLinearGradient(0, 350, 0, 0);
                            gradient.addColorStop(0, 'rgba(34,80,238,0)');
                            gradient.addColorStop(1, 'rgba(34,80,238,0.3)');
                            return {
                                labels: dataDate,
                                datasets: [
                                    {
                                        label: 'Value',
                                        backgroundColor: gradient,
                                        borderColor: '#5b86e5',
                                        pointBorderColor: 'rgba(34,80,238,0)',
                                        borderWidth: 4,
                                        hoverBackgroundColor: 'rgba(34,80,238,0.4)',
                                        hoverBorderColor: 'rgba(34,80,238,1)',
                                        data: dataFeed
                                    }
                                ]
                            }
                        }
                    }) : ''
            })
    }
    getHum() {
        fetch(`/api/admin/metrics/hum`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                const { success, metrics } = data
                let dataFeed = []
                let dataDate = []
                metrics.reverse().map(data => {
                    dataFeed.push(data.value)
                    dataDate.push(this.formatDate(data.date))
                })
                success ?
                    this.setState({
                        hum: (canvas) => {
                            const ctx = canvas.getContext("2d")
                            const gradient = ctx.createLinearGradient(0, 350, 0, 0);
                            gradient.addColorStop(0, 'rgba(34,80,238,0)');
                            gradient.addColorStop(1, 'rgba(34,80,238,0.3)');
                            return {
                                labels: dataDate,
                                datasets: [
                                    {
                                        label: 'Value',
                                        backgroundColor: gradient,
                                        borderColor: '#5b86e5',
                                        pointBorderColor: 'rgba(34,80,238,0)',
                                        borderWidth: 4,
                                        hoverBackgroundColor: 'rgba(34,80,238,0.4)',
                                        hoverBorderColor: 'rgba(34,80,238,1)',
                                        data: dataFeed
                                    }
                                ]
                            }
                        }
                    }) : ''
            })
    }
    render() {
        return (
            <Container>
                <Row>
                    <strong className="blue-title">Live View</strong>
                    <Col style={{ marginTop: 10 }}>
                        <div style={{
                            float: 'right'
                        }}>
                            <Button
                                onClick={() => {
                                    this.setState({
                                        unlock_modal: true
                                    })
                                }}
                                className="btn-tab-active"
                            ><strong>CAM</strong></Button>
                        </div>
                    </Col>
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
                        <h1>Trip events</h1><br />
                        {this.state.tripEvents.length > 0 ?
                            <Table borderless responsive>
                                <div style={{
                                    height: 400,
                                    overflow: 'scroll'
                                }}>
                                    {this.state.tripEvents.map((info, index) => {
                                        return (
                                            <div style={{
                                                padding: 10,
                                                borderRadius: 5,
                                                backgroundColor: info.type == null ? 'red' : info.type ? '#f3f5f7' : 'orange',
                                                margin: 10
                                            }}>
                                                <strong>{info.description}</strong><br />
                                                <strong style={{ color: info.type ? '#a1a1a1' : 'white' }}>{info.date}</strong>
                                            </div>)
                                    })
                                    }
                                </div>
                            </Table>
                            :
                            <Card.Body style={{ backgroundColor: '#f3f5f7', textAlign: 'center', borderRadius: 5, paddingTop: 50, paddingBottom: 50, marginTop: 20 }}>
                                <img src='../assets/images/notfound.png' width={150} style={{ marginBottom: 20 }} /><br />
                                <strong style={{ color: '#a1a1a1' }}>There's no records found</strong>
                            </Card.Body>
                        }
                    </Col>
                    <Col lg={6}>
                        <h1>Parking State</h1><br />
                        {this.state.temp.length > 0 ?
                            <div>
                                <strong>Temperature:</strong>
                                <Line
                                    className="hidden"
                                    options={{
                                        responsive: true,
                                        legend: {
                                            display: false
                                        },
                                        scales: {
                                            xAxes: [{
                                                ticks: {
                                                    display: false
                                                }
                                            }],
                                            yAxes: [{
                                                ticks: {
                                                    display: false
                                                }
                                            }]
                                        }
                                    }}
                                    data={this.state.temp}
                                />
                            </div>
                            :
                            <Card.Body style={{ backgroundColor: '#f3f5f7', textAlign: 'center', borderRadius: 5, paddingTop: 50, paddingBottom: 50, marginTop: 20 }}>
                                <img src='../assets/images/notfound.png' width={150} style={{ marginBottom: 20 }} /><br />
                                <strong style={{ color: '#a1a1a1' }}>There's no records found</strong>
                            </Card.Body>}
                        {this.state.hum.length > 0 ?
                            <div>
                                <strong>Humidity:</strong>
                                <Line
                                    className="hidden"
                                    options={{
                                        responsive: true,
                                        legend: {
                                            display: false
                                        },
                                        scales: {
                                            xAxes: [{
                                                ticks: {
                                                    display: false
                                                }
                                            }],
                                            yAxes: [{
                                                ticks: {
                                                    display: false
                                                }
                                            }]
                                        }
                                    }}
                                    data={this.state.hum}
                                />
                            </div>
                            :
                            <Card.Body style={{ backgroundColor: '#f3f5f7', textAlign: 'center', borderRadius: 5, paddingTop: 50, paddingBottom: 50, marginTop: 20 }}>
                                <img src='../assets/images/notfound.png' width={150} style={{ marginBottom: 20 }} /><br />
                                <strong style={{ color: '#a1a1a1' }}>There's no records found</strong>
                            </Card.Body>}
                    </Col>
                </Row>
                <Modal style={{ overflow: 'hidden', maxHeight: '100vh' }} size="lg" show={this.state.unlock_modal} onHide={() => this.setState({
                    unlock_modal: false
                })}>
                    <div style={{ zIndex: 5, width: 'fit-content', height: 'fit-content', position: 'absolute', top: 10, right: 10, cursor: 'pointer' }} onClick={() => this.setState({ unlock_modal: false })}>
                        <i className="material-icons left" style={{ fontSize: 18 }}>clear</i>
                    </div>
                    <Modal.Body style={{ padding: 5, overflowY: 'scroll', overflowX: 'hidden' }}>
                        <video id="video" src={cameraHost} autoPlay="autoplay" width="100%" height="100%">
                        </video>
                    </Modal.Body>
                </Modal>
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