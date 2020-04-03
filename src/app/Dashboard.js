import React, { Component } from 'react';
import {Modal, Buttom } from 'react-materialize';
import {Chart} from 'react-google-charts';
import Topbar from './Topbar';

class Dashboard extends Component{
    
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

    render(){
        return(
            <div>
            
            <div >
                <h4><b>Balances</b></h4>
            </div>
            
              
                  {this.state.Wallets.map(data => {
                      return(
                        <div className="card ">
                            <div className="card-content ">
                        <img src="../assets/images/bitcoinlogo.png" style={{height: '60px'}} alt="" className="circle"/>
                        <span style={{float: 'right'}}>
                            <Topbar 
                                Bitcoin_price={this.props.Bitcoin_price}
                                balance={this.props.balance}
                                address_map={this.props.address_map}
                            /> 
                        </span>
                        <span className="title">{data.name}{data.currency}</span>
                        <span style={{float: 'right'}}>
                            <div style={{fontSize: '24px'}}><b>${(this.props.balance*this.props.Bitcoin_price).toFixed(2)}</b></div>
                            <div>{this.props.balance} BTC</div>
                        </span>
                        
                       
                            </div>
                        </div>
                      )
                  })}
            <div >
                <h4><b>Security</b></h4>
            </div>
              </div>
        )
    }
}

export default Dashboard;