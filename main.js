const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
const serverConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const constraints = { video: true, audio: true };

// Get local video stream
navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        setupPeerConnection();
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(serverConfig);

    // Add local stream to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Handle remote stream
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            sendSignal({ 'ice': event.candidate });
        }
    };

    // Create an offer and set local description
    peerConnection.createOffer()
        .then(offer => {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            sendSignal({ 'offer': peerConnection.localDescription });
        })
        .catch(error => {
            console.error('Error creating an offer.', error);
        });
}

// Handle signals (for demo purposes, this should be replaced with a signaling server)
function sendSignal(signal) {
    console.log('Sending signal:', signal);
    // Here you would send the signal to the other peer (e.g., via WebSocket)
}

function receiveSignal(signal) {
    if (signal.offer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.offer))
            .then(() => peerConnection.createAnswer())
            .then(answer => peerConnection.setLocalDescription(answer))
            .then(() => sendSignal({ 'answer': peerConnection.localDescription }));
    } else if (signal.answer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.answer));
    } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
}

// Simulate receiving a signal from another peer
// This would typically be handled by a signaling server
setTimeout(() => {
    receiveSignal({
        offer: {
            type: 'offer',
            sdp: '...' // SDP offer from the other peer
        }
    });
}, 1000);