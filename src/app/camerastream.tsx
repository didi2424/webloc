import React, { useEffect, useRef, useCallback, useState } from 'react';

const CameraStream = () => {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  let shouldCaptureFrames = false;
  const constraints = {
    video: {
      facingMode: 'user', // 'user' for front camera, 'environment' for back camera
      // Additional constraints can be added if needed
      // width: { min: 640, ideal: 1280, max: 1920 },
      // height: { min: 480, ideal: 720, max: 1080 },
    },
  };
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, []);

  
  const captureAndSendFrame = async () => {
    if (shouldCaptureFrames && webcamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = webcamRef.current.videoWidth;
      canvas.height = webcamRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(webcamRef.current, 0, 0, canvas.width, canvas.height);

        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(blob);
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            resolve();
          }, 'image/jpeg', 0.82);
        });
      }
    }

    // Schedule the next capture
    setTimeout(() => {
      requestAnimationFrame(captureAndSendFrame);
    }, 33.33);
  };

    const toggleStreaming = () => {
      if (isStreaming) {
        setIsStreaming(false);
        initCamera();

        shouldCaptureFrames = false;
        if (socketRef.current) {
          // Send 'revokeBlobURL' message to the server when stopping streaming
          const revokeBlobURLMessage = 'revokeBlobURL';
          socketRef.current.send(revokeBlobURLMessage);
          console.log(socketRef.current.send(revokeBlobURLMessage));
          // Close the WebSocket connection
          socketRef.current.close();
          console.log('WebSocket disconected');
        }
      } else {
        setIsStreaming(true);
        
        initCamera();
        socketRef.current = new WebSocket('wss://192.168.1.6:3001');
        socketRef.current.onopen = () => {
            console.log('WebSocket connected');
          };
          
        // Wait for the WebSocket connection to open before capturing and sending frames
        socketRef.current.addEventListener('open', () => {
          // Start capturing and sending frames when the connection is open
          shouldCaptureFrames = true;
          captureAndSendFrame();
        });
    
        // Cleanup: Close the WebSocket connection when the component unmounts
        return () => {
          if (socketRef.current) {
            socketRef.current.close();
          }
        };

      }
    };



  return (
    <div>
        <video ref={webcamRef} autoPlay playsInline />
        <button onClick={toggleStreaming}>{isStreaming ? 'Stop Streaming' : 'Start Streaming'}</button>
    </div>
  ) 
};

export default CameraStream;