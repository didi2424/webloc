import React, { useEffect, useRef, useCallback, useState } from 'react';

const CameraStream = () => {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusMessage1, setStatusMessage1] = useState('');
  const [statusMessage2, setStatusMessage2] = useState('');
  const [statusMessage3, setStatusMessage3] = useState('');
  const [captureTimeout, setCaptureTimeout] = useState<NodeJS.Timeout | undefined>(undefined);
  const constraints = {
    video: {
      facingMode: 'environment',
    },
  };


  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        setStatusMessage1('Camera on');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatusMessage1('Camera Not Found');
    }
  }, [constraints]);

  const startWebSocket = useCallback(() => {
    setIsConnected(true);
    socketRef.current = new WebSocket('wss://192.168.1.6:3001');

    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
      setStatusMessage('connected')
      
    };

  }, []);

  const stopWebSocket = useCallback(() => {
    setIsConnected(false);
    
    // Clear the existing timeout
    if (captureTimeout) {
      clearTimeout(captureTimeout);
      setCaptureTimeout(undefined); // Stop further capturing and sending frames
    }
  
    // Close the WebSocket connection and handle any cleanup
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
      setStatusMessage('disconnected');
      setStatusMessage2(isConnected.toString());
    }

    if (webcamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = webcamRef.current.videoWidth;
      canvas.height = webcamRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
  
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setStatusMessage3('Not Capturing Frame');
        setStatusMessage2('Not Sending Frame');
      }
    }
  }, [captureTimeout, isConnected]);
   

  useEffect(() => {
    initCamera()
    const captureAndSendFrame = async () => {
      setStatusMessage2(isConnected.toString());
      if (webcamRef.current && isConnected) {
        const canvas = document.createElement('canvas');
        canvas.width = webcamRef.current.videoWidth;
        canvas.height = webcamRef.current.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(webcamRef.current, 0, 0, canvas.width, canvas.height);
          setStatusMessage3('Capturing frame...');
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

        setCaptureTimeout(setTimeout(captureAndSendFrame, 33.33));
      }
    };

    if (isConnected) {
      captureAndSendFrame();
    }

    return () => {
      
      if (captureTimeout) {
        clearTimeout(captureTimeout);
      }
    };
  }, [isConnected]);


  const toggleStreaming = async () => {
    if (!isStreaming) {
      setIsStreaming(true);
      initCamera();
      startWebSocket();
    
    } else {
      setIsStreaming(false);
      stopWebSocket();
    }
  };
const handleRefresh = () => {
    window.location.reload();
  };
 

  return (
      <div>
       <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', backgroundColor:'white'}}>
            <video style={{width:280, height:300}} ref={webcamRef} autoPlay playsInline />
        </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 40, marginRight: 40, marginTop:20 }}>
              <button style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', width: 120, height: 40, backgroundColor: '#FFF', borderRadius: 30 }} onClick={toggleStreaming}>
                  {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
              </button>

              <button style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', width: 120, height: 40, backgroundColor: '#FFF', borderRadius: 30 }} onClick={handleRefresh}>
                  Refresh Page
              </button>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <p style={{ margin: 'auto', color: isConnected ? 'green' : 'red' }}>
                  {statusMessage}
              </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <p style={{ width: 120, height: 30, color: isConnected ? 'green' : 'red' }}>
                  {statusMessage1}
              </p>

              <p style={{ width: 120, height: 30, color: isConnected ? 'green' : 'red' }}>
                  {statusMessage2}
              </p>
              <p style={{ width: 120, height: 30, color: isConnected ? 'green' : 'red' }}>
                  {statusMessage3}
              </p>

            

          </div>
      </div>
  );
};

export default CameraStream;
