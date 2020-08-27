import React from 'react';

export default class Camera extends React.Component {
    
    render() {
        return (
            <video id="video" src="http://10.0.0.4:8080" autoPlay="autoplay" width="100%" height="100%">
            </video>
        )
    }
};