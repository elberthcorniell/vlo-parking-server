import React, { Component } from 'react';
import Topbar from './Topbar';
import {Link} from "react-router-dom";
import {Modal, Buttom } from 'react-materialize';
import {Chart} from 'react-google-charts';

class Resume extends Component{
  /*  
    constructor(){
        super();
        this.state = {
            Wallets: []
        };
        this.getWallet = this.getWallet.bind(this);
    } 
    getWallet(){
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
            Wallets: data['wallets']
          })
        })
      }
    
    handleChange(e){
       const {name, value} = e.target;
       this.setState({
           [name]: value
       })
    }
    componentDidMount(){
      this.getWallet()
    }
*/
    render(){
        return(
        <div>
                        <center style={{marginTop: '20%'}}>
                        <div style={{ fontSize: '14px', color: '#808080'}}>Available Balance</div>
                        <div style={{fontSize: '32px'}}><b>${(this.props.balance*this.props.Bitcoin_price).toFixed(2)}</b></div>
                        <div style={{ fontSize: '14px', color: '#808080'}}>{this.props.balance} BTC</div>

                        </center>
        </div> 
        )
    }
}

export default Resume;