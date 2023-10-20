const http = require('http');
const WebSocket = require('ws');
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');
const ffmpeg = require('fluent-ffmpeg');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket and WebRTC Backend\n');
});

const wss = new WebSocket.Server({ server });

let videoFrames = [];

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

        ws.on('message', (data) => {
          videoFrames.push(data); 
          if (videoFrames.length > 0) {
            setTimeout(() => {
              decodeAndStreamToYouTube();
            }, 5000); // 5 seconds
          }
        });
      })
      .catch((error) => {
        console.error('Error setting remote description:', error);
      });
  });
});

function decodeAndStreamToYouTube() {
  const input = new ffmpeg();
  videoFrames.forEach((frame) => {
    input.input(frame);
  });

  input
    .inputFormat('image2pipe')
    .inputFPS(30)
    .videoCodec('libx264')
    .on('end', () => {
      console.log('Decoding finished');
      videoFrames = [];
    })
    .on('error', (err) => {
      console.error('Error:', err);
    })
    .output('rtmp://a.rtmp.youtube.com/live2/YOUR_STREAM_KEY') // Replace with your YouTube Stream Key
    .run();
}

server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
