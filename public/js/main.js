let localStream;
const canvas = document.getElementById('canvas');
let mediaRecorder; // Add a variable for MediaRecorder
const chunks = [];

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

    // Initialize the MediaRecorder with H.264 codec
    mediaRecorder = new MediaRecorder(canvas.captureStream(), {
      mimeType: 'video/webm;codecs=h264',
    });

    // Handle data available from MediaRecorder
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

  // This function will handle the data available event and push the data to the 'chunks' array.
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
}

// When you want to stop recording and send the video to the backend
function stopRecordingAndSend() {
  mediaRecorder.stop();

  // Convert 'chunks' to a Blob
  const h264VideoBlob = new Blob(chunks, { type: 'video/webm;codecs=h264' });

  // Send the Blob to your backend for further processing by FFmpeg
  sendToBackend(h264VideoBlob);
}

// Add event listener for stopping the recording and sending
document.getElementById('stop-btn').addEventListener('click', stopRecordingAndSend);

// You may need to implement the 'sendToBackend' function to send the Blob to your backend.
function sendToBackend(blob) {
  // Implement the logic to send the Blob to your backend (e.g., via AJAX or WebSocket).
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
