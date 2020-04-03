import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import Dashboard from './Dashboard';
import Topbar from './Topbar';
import Resume from './Resume';
import {Modal} from 'react-materialize';
import 'materialize-css';

class Backoffice extends Component{
    constructor(props) {
        super(props);
        this.state = {
            Bitcoin_price: '',
            balance: 0,
            unconfirmedBalance: 0,
            address_map: []
        };
      }
      getPrice(){
        fetch('https://bitpay.com/api/rates')
        .then(res => res.json())
        .then(data =>{
         // var obj= JSON.parse(data)
          var price = 0
          for (var key in data) {
            if(data[key].code ==='USD') {
              price = data[key].rate
            }
          }
          this.setState({
            Bitcoin_price: price
          })
        })
      }
      balance(){
        fetch('/api/wallet/balance',{
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'authorization': localStorage.getItem('authtoken'),
          }
      })
      .then(res => res.json())
      .then(data => {
          if(data.success==='true'){
           var balance, unconfirmedBalance = 0
           data.balance.map((info)=>{
             balance = info.balance
             unconfirmedBalance = info.unconfirmedBalance
           })
           
          this.setState({ balance: (balance+unconfirmedBalance)/100000000 || 0, unconfirmedBalance: (unconfirmedBalance)/100000000 || 0 ,  send_total_inputs: data.inputs, address_map: data.balance});
          }else{
              M.toast({html: 'Something went wrong'});
              this.setState({receive_address: 'err'})
          }
          
      })
      .catch(err => console.error(err));
      }
      componentDidMount(){
        this.getPrice()
        this.balance()
    }
    
    render(){
        return(
            <Router>
                <div className="App">
                
                <div className="row">
                  <div className="col l3">
                        <Resume 
                            Bitcoin_price={this.state.Bitcoin_price}
                            balance={this.state.balance}
                        />
                  </div>
                  <div className="col s12 m12 l9">
                        <Dashboard
                            Bitcoin_price={this.state.Bitcoin_price}
                            balance={this.state.balance}
                            address_map={this.state.address_map}
                         />
                  </div>
                        
                        
                </div>
                
                </div>
            </Router>
        )
    }
}

export default Backoffice;