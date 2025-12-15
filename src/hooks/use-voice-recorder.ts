
'use client';

import { useState, useRef, useCallback } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';

declare const puter: any;

export function useVoiceRecorder() {
  const recorder = useRef<MicRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeRecorder = useCallback(() => {
    if (recorder.current) return;
    recorder.current = new MicRecorder({ bitRate: 128 });
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
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
    setIsTranscribing(true);

    try {
      const [buffer, blob] = await recorder.current.stop().getMp3();
      
      if (typeof puter === 'undefined') {
        throw new Error("Puter.js is not loaded.");
      }

      // Use the correct speech2txt function as provided by the user.
      const transcriptionResult = await puter.ai.speech2txt(blob);

      if (transcriptionResult?.text) {
        setTranscript(transcriptionResult.text);
      } else {
        throw new Error('Transcription did not return any text.');
      }
    } catch (e: any) {
      console.error('Error stopping recording or transcribing:', e);
      setError('Failed to transcribe audio. Please try again.');
      setTranscript(null);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
    error,
  };
}
