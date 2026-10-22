import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_TRIGGER_PHRASES = ['emergency', 'help me', 'sos', 'save me'];

export const useVoiceRecognition = ({
  onTrigger,
  triggerPhrases = DEFAULT_TRIGGER_PHRASES,
  enabled = false,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastDetectedPhrase, setLastDetectedPhrase] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const recognitionRef = useRef(null);
  const debounceRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onend = () => {
        // If still enabled by user, restart listening (browser speech engines stop automatically after brief pauses)
        if (enabled && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Voice SOS disabled.');
          setIsListening(false);
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript.toLowerCase();
        }

        setTranscript(currentTranscript);

        // Check against trigger phrases
        for (const phrase of triggerPhrases) {
          if (currentTranscript.includes(phrase.toLowerCase())) {
            if (!debounceRef.current) {
              debounceRef.current = true;
              setLastDetectedPhrase(phrase);
              console.log(`🚨 Voice Trigger Detected: "${phrase}"`);
              if (onTrigger) {
                onTrigger(phrase);
              }
              setTimeout(() => {
                debounceRef.current = false;
              }, 10000); // 10s cooldown
            }
            break;
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setErrorMessage('Speech Recognition API not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [triggerPhrases, onTrigger, enabled]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setErrorMessage(null);
    } catch (e) {
      console.warn('Recognition start caught:', e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {
      console.warn('Recognition stop caught:', e);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    lastDetectedPhrase,
    errorMessage,
    startListening,
    stopListening,
  };
};
