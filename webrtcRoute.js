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
      })
      .catch((error) => {
        console.error('Error setting remote description:', error);
      });
  });

  ws.on('message', (data) => {
    console.log('Received video frame');
    videoFrames.push(data);
    if (videoFrames.length > 0) {
      setTimeout(() => {
        decodeAndStreamToYouTubeAndTwitch();
      }, 5000);
    }
  });
});

function decodeAndStreamToYouTubeAndTwitch() {
  const input = new ffmpeg();

  try {
    videoFrames.forEach((frame) => {
      // Ensure frame is correctly formatted before adding as input
      if (frame instanceof ArrayBuffer) {
        const frameData = new Uint8Array(frame);
        input.input(frameData);
      } else {
        console.error('Invalid frame format');
      }
    });

    input
      .inputFPS(30)
      .videoCodec('libx264')
      .on('end', () => {
        console.log('Decoding finished');
        videoFrames = [];
        try {
          console.log('Starting stream...');
          startYouTubeAndTwitchStream();
        } catch (error) {
          console.error('Error starting the stream:', error);
        }
      })
      .on('error', (err) => {
        console.error('Error during decoding:', err);
      })
      .output('rtmp://a.rtmp.youtube.com/live2/YOUR_YOUTUBE_STREAM_KEY') // YouTube Stream Key
      .output('rtmp://live.twitch.tv/app/live/YOUR_TWITCH_STREAM_KEY') // Twitch Stream Key
      .run();
  } catch (error) {
    console.error('Error processing video frames:', error);
  }
}

function isValidFrame(frame) {
  // Implement validation for the frame format here
  // You may need to check the frame data to ensure it's a valid format.
  // Return true if it's valid, false otherwise.
  return true; // Update this based on your frame format validation.
}

function startYouTubeAndTwitchStream() {
  // Implement your stream start logic here
  // This function will be called when decoding finishes
  // and it's time to start streaming to YouTube and Twitch.
  console.log('Starting YouTube and Twitch streams...');
}

server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
