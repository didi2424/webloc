const socket = new WebSocket('wss://192.168.1.6:3001');

socket.onopen = () => {
  console.log('WebSocket connected on the client side');
};

// Assuming you have a video element in your HTML with id "videoElement"
const videoElement = document.getElementById('videoElement');

socket.onmessage = (event) => {
  const frameData = event.data;
  console.log('Received frame data:', frameData);
  const blob = new Blob([frameData], { type: 'image/jpeg' });
  console.log('Blob created:', blob);
  if (videoElement) {
    const blob = new Blob([frameData], { type: 'image/jpeg' });
    const blobUrl = URL.createObjectURL(blob);
    console.log('Blob URL:', blobUrl);


    // Revoke the previous Blob URL
    // if (videoElement.src) {
    //   URL.revokeObjectURL(videoElement.src);
    // }

    // Update the video element with the new Blob URL
    videoElement.src = blobUrl;
  }
};

// Handle errors on the WebSocket connection
socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Clean up resources when the WebSocket is closed
socket.onclose = () => {
  console.log('WebSocket connection closed');
  // Optionally, you can clean up the Blob URL here as well
//   if (videoElement && videoElement.src) {
//     URL.revokeObjectURL(videoElement.src);
//   }
};