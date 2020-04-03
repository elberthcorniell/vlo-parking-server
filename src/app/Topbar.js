import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import {Modal, Button, Select} from 'react-materialize';
import 'materialize-css';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

class Topbar extends Component{
    constructor(){
        super();
        this.state = {
            send_address: '',
            send_amount: '',
            send_currency: 'Bitcoin',
            receive_address: '',
            receive_currency: 'Bitcoin',
            receive_amount: '',
            hour_fee: '',
            fast_fee: '',
            send_method: '+1 hour',
            fee: '',
            send_total_inputs: 1,
            Wallet: [],
            send_wallet: ''
        };
        this.handleChange = this.handleChange.bind(this);
        this.receive = this.receive.bind(this);
        this.send = this.send.bind(this);
        this.getfee = this.getfee.bind(this);
        this.getWallets = this.getWallets.bind(this);
    } 
    handleChange(e){
       const {id, value} = e.target;
       this.setState({
           [id]: value
       })
       this.getfee()
    }
    getWallets(){
      fetch('/api/wallet/get', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem('authtoken')
        }
    })
      .then(res => res.json())
      .then(data =>{
        this.setState({
          Wallet: data['wallets']
        })
      })
    }
    getfee(){
      fetch('https://api.blockchain.info/mempool/fees')
      .then(res => res.json())
      .then(data =>{
        this.setState({
          fast_fee: data.priority,
          hour_fee: data.regular
        })
        switch(this.state.send_method){
          case '+1 hour': this.setState({fee: (parseInt(data.regular))})
          break;
          case '0-60 min': this.setState({fee: (parseInt(data.priority)) })
          break;
        }
      })
      
    }
    receive(e){
        try{
            e.preventDefault();
        }catch(err){
        }
        fetch('/api/wallet/receive',{
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
        .then(res => res.json())
        .then(data => {
            if(data.success==='true'){
            this.setState({ receive_address: data.address || ''});
            }else{
                M.toast({html: 'Something went wrong'});
                this.setState({receive_address: 'err',})
            }
        })
        .catch(err => console.error(err));
        console.log(this.state)
        
    }
    send(e){
     
          fetch('/api/wallet/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            },
            body: JSON.stringify({
              username: 'elberthcorniell',
              address_map: this.props.address_map,
              amount: this.state.send_amount,
              fee: this.state.fee,
              to: this.state.send_address
            })
        })
          .then(res => res.json())
          .then(data =>{
              if(data.success==='true'){
                console.log(data.txID)
              }else{
                console.log(data.err)
              }
          })
          console.log(this.props.address_map)
    }
    
    componentDidMount(){
        this.getfee()
        this.getWallets()
    }

    render(){

        const alt = "Chart?cht=qr&amp;chl=bitcoin%3a"+this.state.receive_address+"%3famount%3d0"
        const QR = "https://chart.googleapis.com/chart?cht=qr&chl=bitcoin%3A"+this.state.receive_address+"%3Famount%3D"+this.state.receive_amount+"&choe=UTF-8&chs=500x500"
        return(
            <div style={{
                float: 'right'
            }}>
                <Modal header="Send" trigger={<Button style={{margin: '10px'}}  className="hoverable blue"  ><i className="material-icons left">arrow_upward</i>Send</Button>}>
       
          
        
                <Select onChange={this.handleChange} id="send_currency" value={this.state.send_currency} >
                    <option data-icon="../assets/images/bitcoinlogo.png">Bitcoin</option>
                </Select>
                <Select onChange={this.handleChange} id="send_currency" value={this.state.send_currency} >
                {this.state.Wallet.map(data =>{
                  return(
                    <option data-icon="../assets/images/bitcoinlogo.png">{data.name}</option>
                  )
                })}
                </Select>
              <div className="input-field">
                <input
                  onChange={this.handleChange}
                  value={this.state.send_address}
                  id="send_address"
                  type="text"
                />
                <label htmlFor="send_address">Address or @username</label>
              </div>
             
              <div>
                <Select onChange={this.handleChange} id="send_method" value={this.state.send_method} >
                    <option value='+1 hour'>Regular</option>
                    <option value='0-60 min'>Priority</option>
                </Select>
                </div>
              <div  style={{minWidth: '60%' ,float: 'left'}}>
                   <div className="input-field" >
              <input
                  onChange={this.handleChange}
                  value={this.state.send_amount}
                  id="send_amount"
                  type="number"
                />
                <label htmlFor="send_amount">{this.state.send_currency}</label>
                </div>
              </div>
              <div style={{maxWidth: '30%', float: 'right'}}>
              <div className="input-field" >
              <input
                  id="USD"
                  type="number"
                />
                <label htmlFor="USD">USD</label>
              </div>
              </div>
                <div>Fee: {Math.round(this.state.fee*((181*this.state.send_total_inputs + 34 + 10)/100000000)*this.props.Bitcoin_price*100)/100} USD</div>
              
              <div className="col s12" style={{ paddingLeft: "11.250px" }}>
                <button
                onClick={this.send  }
                  style={{
                    width: "100%",
                    borderRadius: "3px",
                    letterSpacing: "1.5px",
                    marginTop: "1rem"
                  }}
                  type="submit"
                  className="btn btn-large hoverable blue"
                >
                  Send {this.state.send_amount} in {this.state.send_currency}
                </button>
              </div>
            
                </Modal>
               
                <Modal  header="Receive" trigger={
                <Button style={{margin: '10px'}} onClick={this.receive} className="hoverable blue" > <i className="material-icons left">arrow_downward</i>Receive
                </Button>
            }>
                <center>
                <img width="300" height="300" alt={alt} src={QR} />
                <div>{this.state.receive_address}</div>
               <form  >
          
        
                <Select onChange={this.handleChange} id="send_currency" value={this.state.receive_currency} >
                    <option value="Bitcoin" data-icon="../assets/images/bitcoinlogo.png">Bitcoin</option>
                </Select>
              
             
             
              <div  style={{minWidth: '60%' ,float: 'left'}}>
                   <div className="input-field" >
              <input
                  onChange={this.handleChange}
                  value={this.state.receive_amount}
                  id="receive_amount"
                  type="number"
                />
                <label htmlFor="receive_amount">{this.state.receive_currency}</label>
                </div>
              </div>
              <div style={{maxWidth: '30%', float: 'right'}}>
              <div className="input-field" >
              <input
                 
                  id="receive_USD"
                  type="number"
                />
                <label htmlFor="receive_USD">USD</label>
              </div>
              </div>
              
            <button className="btn hoverable blue" type="submit" onClick={this.receive}>New address</button>
              
            </form>
                </center>
                </Modal>
                
                </div>
        )}
}

export default Topbar;