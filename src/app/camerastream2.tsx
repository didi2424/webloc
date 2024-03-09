import React, { useEffect, useRef, useCallback, useState } from 'react';

const CameraStream = () => {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusMessage1, setStatusMessage1] = useState('');
  const [statusMessage2, setStatusMessage2] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  let shouldCaptureFrames = false;
  const handleRefresh = () => {
    window.location.reload();
  };

  const constraints = {
    video: {
      facingMode: 'user', 
    },
  };
  const initCamera = useCallback(async () => {
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        setStatusMessage1('Camera on')
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatusMessage1('Camera Not Found')
    }
  }, []);

  
  
  const disconnectCamera = () => {
    try {
      if (webcamRef.current && webcamRef.current.srcObject) {
        
  
        const tracks = (webcamRef.current.srcObject as MediaStream).getTracks();
  
        if (tracks) {
          tracks.forEach(track => track.stop());
          setStatusMessage1('Camera off')
        }
  
        webcamRef.current.srcObject = null;
        setCameraStream(null);
        
      } else {
        setStatusMessage1('Error turning Camera off')
      }
    } catch (error) {
      console.error('Error disconnecting camera:', error);
      
    }
  };

  const captureAndSendFrame = async () => {
    if (webcamRef.current && shouldCaptureFrames) {
      
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
              setStatusMessage2('Capturing frame...');
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            resolve();
          }, 'image/jpeg', 0.82);
        });
      }
  
      // Schedule the next capture if shouldCaptureFrames is still true
      if (shouldCaptureFrames) {
        setTimeout(() => {
          requestAnimationFrame(captureAndSendFrame);
          
        }, 33.33);
      }
    } else {
      console.log('Not capturing frame. Streaming stopped or webcamRef not available.');
      setStatusMessage2('NOT Capturing frame...');
    }
  };
  
    const toggleStreaming = () => {

      const startFrameCapturing = () => {
       
        shouldCaptureFrames = true;
        captureAndSendFrame();
      };
      
      const stopFrameCapturing = () => {
        
        shouldCaptureFrames = false;
        captureAndSendFrame();
      };

      if (isStreaming === false) {
       
        setIsStreaming(true)

        initCamera()
        socketRef.current = new WebSocket('wss://192.168.1.6:3001');
        socketRef.current.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true)
          };
          
        socketRef.current.addEventListener('open', () => {

          startFrameCapturing();
         
        });

      } else {
        stopFrameCapturing()
       
        setIsStreaming(false)
        setIsConnected(false)
        
        disconnectCamera()
        if (socketRef.current) {
          const revokeBlobURLMessage = 'revokeBlobURL';
          socketRef.current.send(revokeBlobURLMessage);
          // Close the WebSocket connection
          socketRef.current.close();
          
          
        }
      }
    }

  return (
    <div>
        <video ref={webcamRef} autoPlay playsInline />
        <div style={{ display: 'flex', justifyContent: 'space-between',marginLeft:40,marginRight:40 }}>
          <button style={{ fontSize: '12px', fontWeight: 'bold', color: '#333',width: 120,height:40,backgroundColor: '#FFF',borderRadius: 30 }} onClick={toggleStreaming}>
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </button>
        
          <button style={{ fontSize: '12px', fontWeight: 'bold', color: '#333',width: 120,height:40,backgroundColor: '#FFF',borderRadius: 30 }} onClick={handleRefresh}>
            Refresh Page
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',marginTop: 10 }}>
          <p style={{ margin: 'auto', color: isConnected ? 'green' : 'red' }}>
            {isConnected ? 'Connected' : 'Disconnect'}
            </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',marginTop: 10 }}>
        <p style={{ width:120,height:30, color: isConnected ? 'green' : 'red' }}>
            {statusMessage1}
            </p>
          <p style={{ width:120,height:30, color: isConnected ? 'green' : 'red' }}>
            {statusMessage}
            </p>
           
            <p style={{ width:120,height:30, color: isConnected ? 'green' : 'red' }}>
            {statusMessage2}
            </p>
        </div>
      
    </div>
  ) 
};

export default CameraStream;