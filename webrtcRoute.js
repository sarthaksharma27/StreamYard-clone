const http = require('http');
const WebSocket = require('ws');
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');
const fs = require('fs');
const child_process = require('child_process');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket and WebRTC Backend\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }],
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    }
  };

  ws.on('message', (message) => {
    const offer = JSON.parse(message);

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        console.log('Remote description set successfully.');
      })
      .catch((error) => {
        console.error('Error setting remote description:', error);
      });
  });

  ws.on('message', (data) => {
    console.log('Received video frame');

    // Save the received video frame to a file (H.264 format)
    fs.writeFileSync('received-frame.h264', data, { encoding: 'binary' });

    // Process the received frames using GStreamer
    const gstProcess = child_process.spawn('gst-launch-1.0', [
      'filesrc', 'location=received-frame.h264',
      '!', 'h264parse',
      '!', 'flvmux', '!', 'rtmpsink', 'location=rtmp://live.twitch.tv/app/live_973388968_yWal4qVyVRWA0a9lI7OK2AIW7QceTh', // Replace with your RTMP server URL
    ]);

    gstProcess.stdout.on('data', (data) => {
      console.log('GStreamer stdout:', data.toString());
    });

    gstProcess.stderr.on('data', (data) => {
      console.error('GStreamer stderr:', data.toString());
    });

    gstProcess.on('close', (code) => {
      console.log(`GStreamer process exited with code ${code}`);
    });
  });
});

server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
