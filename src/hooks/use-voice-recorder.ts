
'use client';

import { useState, useRef, useCallback } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';

export function useVoiceRecorder() {
  const recorder = useRef<MicRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeRecorder = useCallback(() => {
    if (recorder.current) return;
    recorder.current = new MicRecorder({ bitRate: 128 });
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
    initializeRecorder();

    try {
      await recorder.current?.start();
      setIsRecording(true);
    } catch (e: any) {
      console.error('Error starting microphone recording:', e);
      let message = 'Could not start recording. Please check microphone permissions.';
      if (e.name === 'NotAllowedError') {
        message = 'Microphone access was denied. Please allow it in your browser settings.';
      }
      setError(message);
    }
  }, [initializeRecorder]);

  const stopRecording = useCallback(async () => {
    if (!recorder.current) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      const [buffer, blob] = await recorder.current.stop().getMp3();
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setAudioUrl(base64data);
      };

    } catch (e: any) {
      console.error('Error stopping recording or processing audio:', e);
      setError('Failed to process audio. Please try again.');
      setAudioUrl(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = () => {
    setAudioUrl(null);
    setError(null);
    setIsRecording(false);
    setIsProcessing(false);
  };

  return {
    startRecording,
    stopRecording,
    reset,
    isRecording,
    isProcessing,
    audioUrl,
    error,
  };
}
