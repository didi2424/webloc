export const getAvailableCameras = async (
    setAvailableCameras: React.Dispatch<React.SetStateAction<MediaDeviceInfo[]>>,
    setSelectedCamera: React.Dispatch<React.SetStateAction<string>>,
    setCameraSeleted: React.Dispatch<React.SetStateAction<string>>
  ) => {
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