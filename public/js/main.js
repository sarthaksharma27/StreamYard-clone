let localStream;
let canvas = document.getElementById('canvas');

let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); 
  document.getElementById('user').srcObject = localStream;

  let ctx = canvas.getContext('2d');

  function captureAndDrawFrame() {
    ctx.drawImage(document.getElementById('user'), 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(captureAndDrawFrame);
  }

  captureAndDrawFrame();

  initializeWebRTC();
};

function initializeWebRTC() {
  const configuration = { iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }] };
  const peerConnection = new RTCPeerConnection(configuration);

  const canvasStream = canvas.captureStream();
  canvasStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, canvasStream);
  });

  const dataChannel = peerConnection.createDataChannel('video'); 

  dataChannel.onopen = () => {
    sendDataFrames(dataChannel);
  };

  peerConnection.createOffer()
    .then((offer) => {
      return peerConnection.setLocalDescription(offer);
    })
    .then(() => {
      const offerMessage = {
        type: 'offer',
        sdp: peerConnection.localDescription.sdp,
      };

      
      console.log('Offer Message:', offerMessage);

      // Send the offer to your backend via WebSocket
      const websocket = new WebSocket('ws://localhost:8080');
      websocket.onopen = () => {
        websocket.send(JSON.stringify(offerMessage));
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    })
    .catch((error) => {
      console.error('Error creating offer:', error);
    });
}

function sendDataFrames(dataChannel) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  function captureAndSendFrame() {
    ctx.drawImage(document.getElementById('user'), 0, 0, canvas.width, canvas.height);
    const frameData = canvas.toDataURL('image/jpeg');
    dataChannel.send(frameData);
    requestAnimationFrame(captureAndSendFrame);
  }

  captureAndSendFrame();
}

init();


let toggleCamera = async () => {
  let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

  if (videoTrack.enabled) {
    videoTrack.enabled = false
    document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
  } else {
    videoTrack.enabled = true
    document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
  }
}

let toggleMic = async () => {
  let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')

  if (audioTrack.enabled) {
    audioTrack.enabled = false
    document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
  } else {
    audioTrack.enabled = true
    document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
  }
}

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
