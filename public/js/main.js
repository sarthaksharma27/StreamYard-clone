let localStream;
const canvas = document.getElementById('canvas');
let mediaRecorder;
const chunks = [];
let isRecording = false;

const goLiveButton = document.getElementById('golive');

function showStreamingAlert() {
  window.alert('Streaming has started!');
}

goLiveButton.addEventListener('click', () => {
  if (isRecording) {
    stopRecordingAndSend();
    if (localStream) {
      const tracks = localStream.getTracks();
      tracks.forEach(track => track.stop());
    }
    goLiveButton.textContent = 'Start';
  } else {
    init();
    showStreamingAlert();
    goLiveButton.textContent = 'End';
  }
  isRecording = !isRecording;
});

async function init() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('user').srcObject = localStream;

    const ctx = canvas.getContext('2d');

    function captureAndDrawFrame() {
      ctx.drawImage(document.getElementById('user'), 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(captureAndDrawFrame);
    }

    captureAndDrawFrame();

    mediaRecorder = new MediaRecorder(canvas.captureStream(), {
      mimeType: 'video/webm;codecs=h264',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    initializeWebRTC();
  } catch (error) {
    console.error('Error initializing media stream:', error);
  }
}

function initializeWebRTC() {
  const configuration = { iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }] };
  const peerConnection = new RTCPeerConnection(configuration);

  const canvasStream = canvas.captureStream();
  canvasStream.getTracks().forEach(track => peerConnection.addTrack(track, canvasStream));

  const dataChannel = peerConnection.createDataChannel('video');

  dataChannel.onopen = () => sendDataFrames(dataChannel);

  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => {
      const offerMessage = {
        type: 'offer',
        sdp: peerConnection.localDescription.sdp,
      };

      console.log('Offer Message:', offerMessage);

      const websocket = new WebSocket('ws://localhost:8080');
      websocket.onopen = () => websocket.send(JSON.stringify(offerMessage));
      websocket.onerror = error => console.error('WebSocket error:', error);
    })
    .catch(error => console.error('Error creating offer:', error));
}

function sendDataFrames(dataChannel) {
  mediaRecorder.start();

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
}

function stopRecordingAndSend() {
  mediaRecorder.stop();

  const h264VideoBlob = new Blob(chunks, { type: 'video/webm;codecs=h264' });

  // Replace 'http://your-backend-server:8080/upload' with your actual backend URL
  sendToBackend(h264VideoBlob);
}

// Implement the logic to send the Blob to your backend (e.g., via AJAX or WebSocket).
function sendToBackend(blob) {
  const xhr = new XMLHttpRequest();

  // Replace with the actual URL of your backend endpoint
  xhr.open('POST', 'http://your-backend-server:8080', true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      console.log('Video sent to backend successfully');
    } else {
      console.error('Error sending video to the backend');
    }
  };

  xhr.send(blob);
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
