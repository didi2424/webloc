"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function Camera() {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const socketRef = useRef<WebSocket | null>(null);

  const [statusCameraSelected, setCameraSeleted] = useState('');

  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStatusNetwork, setStatusNetwork] = useState('');

  const [captureTimeout, setCaptureTimeout] = useState<NodeJS.Timeout | undefined>(undefined);

  const [statusCapturingFrame, setStatusCapturingFrame] = useState('');

  const [isChecked, setIsChecked] = useState(false);
  const handleCheckBoxChange = () => {
    setIsChecked(!isChecked);
  }

  const getAvailableCameras = async () => {
    try {
      // Request user media access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Enumerate devices after successful access
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Close the stream as it's no longer needed
      stream.getTracks().forEach((track) => track.stop());

      const cameraDevices = devices.filter((device) => device.kind === 'videoinput');
      setAvailableCameras(cameraDevices);

      // Set the initial selected camera to the first available camera
      if (cameraDevices.length > 0) {
        setSelectedCamera(cameraDevices[0].deviceId);
        setCameraSeleted(`Selected camera: ${cameraDevices[0].label}`);
      }
    
    } catch (error) {
      console.error('Error accessing or enumerating media devices:', error);
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    setCameraSeleted(`Selected camera: ${availableCameras.find((camera) => camera.deviceId === deviceId)?.label || ''}`);
    clearCanvas()
  };

  useEffect(() => {
    getAvailableCameras();
  }, []);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedCamera },
        });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    initializeCamera();

    if (webcamRef.current) {
      const stream = webcamRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [selectedCamera]);

  const clearCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = webcamRef.current?.videoWidth || 0;
    canvas.height = webcamRef.current?.videoHeight || 0;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    const captureAndSendFrame = async () => {
      if (webcamRef.current && isConnected) {
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
                setStatusCapturingFrame('Sending Frame');
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
    } else {
      setStatusCapturingFrame('Not Sending Frame');
    }

    return () => {

      if (captureTimeout) {
        clearTimeout(captureTimeout);
      }
    };
  }, [isConnected]);

  const startWebSocket = useCallback(() => {

    socketRef.current = new WebSocket('wss://192.168.1.6:3001');

    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
      setStatusNetwork('connected');
    };

    socketRef.current.onerror = () => {
      console.error('WebSocket connection error');
      setStatusNetwork('disconnected');
    };
  }, []);

  const stopWebSocket = useCallback(() => {
    setIsConnected(false);
    setStatusNetwork('disconnected');
    // Clear the existing timeout
    if (captureTimeout) {
      clearTimeout(captureTimeout);
      setCaptureTimeout(undefined); // Stop further capturing and sending frames
    }

    // Close the WebSocket connection and handle any cleanup
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();

    }

    if (webcamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = webcamRef.current.videoWidth;
      canvas.height = webcamRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

  }, [captureTimeout, isConnected]);


  const toggleStreaming = async () => {
    if (!isStreaming) {
      setIsConnected(true);
      setIsStreaming(true);

      startWebSocket()
    } else {
      setIsStreaming(false);
      stopWebSocket()

    }
  };

  return (
    <div >

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <video style={{ width: 320, height: 500 }} ref={webcamRef} autoPlay playsInline />
      </div>

    <div style={{display:'flex',flexDirection:'row', justifyContent:'space-between',alignContent:'center',alignItems:'center'}}>
      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'black',marginTop:20 }}>

        <h3>Select Cameras:</h3>
        <select style={{ backgroundColor: '#ccc', color: '#000',fontSize:12,width:180 }} value={selectedCamera} onChange={(e) => handleCameraChange(e.target.value)}>
          {availableCameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label}
            </option>
          ))}
        </select>

        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#333',display:'flex',marginTop:10 }}>
          {statusCameraSelected}
        </p>

          
        
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckBoxChange}
            
          />
          Mirror Camera
        </label>
      </div>

      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',  // Vertical centering
        justifyContent: 'center',  // Horizontal centering
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20

      }}>
        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
          {isStatusNetwork}

        </p>
      </div>

      <div style={{ display: 'flex',alignItems:'center', alignContent:'center', flexDirection: 'column', marginTop: 10 }}>
        
        <button style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', width: 120, height: 40, backgroundColor: 'white', borderRadius: 30 }} onClick={toggleStreaming} >
          {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
        </button>

        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#333',marginTop:10 }}>{statusCapturingFrame}</p>
      </div>
      
     
    </div>
  );
}