import { useState, useRef, useCallback } from 'react';
import api from '../services/api';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('MediaDevices or getUserMedia is not supported in this browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerRef.current);
      };

      recorder.start(1000); // 1s slice
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      return true;
    } catch (err) {
      console.error('Audio recorder error:', err);
      let msg = 'Failed to access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. Emergency audio capture unavailable.';
      }
      setError(msg);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  }, []);

  const uploadEvidence = useCallback(async (incidentId, blobOverride = null) => {
    const blobToUpload = blobOverride || audioBlob;
    if (!blobToUpload) {
      throw new Error('No audio recording available to upload.');
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', blobToUpload, `panic-${incidentId}.webm`);
      formData.append('duration', duration.toString());

      const res = await api.post(`/incidents/${incidentId}/audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploading(false);
      return res.data;
    } catch (err) {
      setUploading(false);
      throw err;
    }
  }, [audioBlob, duration]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    error,
    uploading,
    startRecording,
    stopRecording,
    uploadEvidence,
  };
};
