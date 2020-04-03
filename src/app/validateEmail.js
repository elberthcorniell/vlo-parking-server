import React, { Component } from 'react';

class validateEmail extends Component {
    constructor() {
        super();
        this.state = {
            valid: false,
            secret: ''
        };
    }

    componentDidMount() {
        var url = new URL(window.location.href);
        var secret = url.searchParams.get("secret")
        this.validate(secret)
    }
    validate(secret){
        fetch('/api/validate/email/secret', {
            method: 'POST',
            body: JSON.stringify({
                secret
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('authtoken')
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.setState({
                        valid: true,
                        username: data.username,
                        email: data.email
                    })
                } else {
    
                }
            })
    }
    render() {
        return (
            <div className="container">
                <div style={{ marginTop: "10%", marginBottom: "10%" }} className="row">
                    <div className="col s12 m12  l8 offset-l2">
                        <div style={{backgroundColor: '#f3f5f7', border: 'solid 0px #fff', margin: 'auto', padding: 0, borderRadius: 500, width: 'fit-content', height: 'fit-content', textAlign: 'center'}}>
                        {this.state.valid ?
                            <i className="material-icons" style={{fontSize: 200, color: 'green', margin: 0}}>check_circle</i>
                            :
                            <i className="material-icons" style={{fontSize: 200, color: 'red', margin: 0}}>cancel</i>
                        }
                      
                        </div>
                        {this.state.valid ?
                           
<p>successful email verification for the email address<strong>{this.state.email}</strong> of the user <strong>{this.state.username}</strong>.</p>
  :
                        ''  }
                    </div>
                </div>
            </div>
        )
    }
}

export default validateEmail;