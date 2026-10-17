"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface CustomWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export interface VoiceCopilotOptions {
  /**
   * Cutoff frequency in Hz for high-pass filtering (80Hz - 120Hz).
   * Filters out low-frequency HVAC rumble, fan hum, electrical mains noise, and desk vibrations.
   * Default: 100Hz.
   */
  highPassCutoff?: number;
  /**
   * Filter resonance / quality factor Q.
   * Default: 0.7071 (Butterworth response with flat passband and 12dB/octave slope).
   */
  highPassQ?: number;
  /**
   * Whether to enable Web Audio API high-pass filtering.
   * Default: true.
   */
  enableHighPassFilter?: boolean;
}

export function useVoiceCopilot(options?: VoiceCopilotOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  const isListeningRef = useRef(false);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const biquadFilterRef = useRef<BiquadFilterNode | null>(null);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const filteredStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVisualizerUpdateRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up audio graph nodes and media streams
  const stopAudioAnalyser = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }

    if (biquadFilterRef.current) {
      try {
        biquadFilterRef.current.disconnect();
      } catch {
        // ignore
      }
      biquadFilterRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // ignore
      }
      analyserRef.current = null;
    }

    if (destinationNodeRef.current) {
      try {
        destinationNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      destinationNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (filteredStreamRef.current) {
      filteredStreamRef.current.getTracks().forEach((track) => track.stop());
      filteredStreamRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsFilterActive(false);
    setAudioLevel(0);
  }, []);

  // Clean up timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Stop everything
  const stopListening = useCallback((): string => {
    setIsListening(false);
    stopTimer();
    stopAudioAnalyser();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if already stopped
      }
    }

    const fullTranscript = (transcript + " " + interimTranscript).trim();
    setInterimTranscript("");
    return fullTranscript;
  }, [transcript, interimTranscript, stopTimer, stopAudioAnalyser]);

  const cancelListening = useCallback(() => {
    setIsListening(false);
    stopTimer();
    stopAudioAnalyser();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    setTranscript("");
    setInterimTranscript("");
    setDuration(0);
    setError(null);
  }, [stopTimer, stopAudioAnalyser]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setDuration(0);

    // 1. Request microphone access with acoustic hardware constraints
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
    } catch (err: unknown) {
      const errorObj = err as { name?: string };
      if (errorObj.name === "NotAllowedError" || errorObj.name === "PermissionDeniedError") {
        setError("Microphone permission was denied. Please allow microphone access in your browser to use Oracle Voice Copilot.");
      } else {
        setError("Could not access your microphone. Please check your audio input settings.");
      }
      return;
    }

    // 2. Setup Audio Visualizer & Web Audio API High-Pass Filtering (80Hz - 120Hz cutoff)
    try {
      const win = window as unknown as CustomWindow;
      const AudioCtx = win.AudioContext || win.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        analyserRef.current = analyser;

        const shouldFilter = optionsRef.current?.enableHighPassFilter ?? true;

        if (shouldFilter) {
          // Biquad high-pass filter: 80Hz - 120Hz cutoff (default 100Hz)
          // Butterworth response Q = 0.7071 for maximally flat passband with 12 dB/octave attenuation
          // Eliminates HVAC rumble, fan hum, electrical mains noise (50/60Hz), and mechanical desk vibrations.
          const requestedCutoff = optionsRef.current?.highPassCutoff ?? 100;
          const cutoff = Math.min(120, Math.max(80, requestedCutoff));
          const qFactor = optionsRef.current?.highPassQ ?? 0.7071;

          const filter = audioCtx.createBiquadFilter();
          filter.type = "highpass";
          filter.frequency.setValueAtTime(cutoff, audioCtx.currentTime);
          filter.Q.setValueAtTime(qFactor, audioCtx.currentTime);
          biquadFilterRef.current = filter;

          // Route source -> filter -> analyser (for hum-free visualizer)
          source.connect(filter);
          filter.connect(analyser);

          // Route filtered stream to media destination for downstream audio consumption
          const destination = audioCtx.createMediaStreamDestination();
          destinationNodeRef.current = destination;
          filter.connect(destination);
          filteredStreamRef.current = destination.stream;

          setIsFilterActive(true);
        } else {
          source.connect(analyser);
          setIsFilterActive(false);
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          const now = performance.now();
          // Throttle visualizer state updates to ~30fps (33ms) to save battery and avoid UI re-render thrashing
          if (now - lastVisualizerUpdateRef.current >= 33) {
            lastVisualizerUpdateRef.current = now;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(1, avg / 80));
          }
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
    } catch {
      // AudioContext visualization and filter fallback
    }

    // 3. Start Duration Timer
    timerIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    // 4. Setup Speech Recognition
    const win = window as unknown as CustomWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError("Speech recognition is not supported in this browser. You can type clinical notes or paste transcripts directly.");
      setIsListening(true);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = "";
        let newFinal = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            newFinal += res[0].transcript + " ";
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (newFinal) {
          setTranscript((prev) => (prev + " " + newFinal).trim());
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed") {
          setError("Microphone permission was denied. Please allow microphone access in browser settings.");
          stopListening();
        } else if (event.error === "no-speech") {
          // No speech detected, keep listening quietly
        } else if (event.error === "network") {
          setError("Network issue during voice capture. Please check your internet connection.");
        }
      };

      recognition.onend = () => {
        // If still listening state, restart seamlessly with a 200ms debounce guard
        // to avoid rapid-fire restart loops during unstable hospital Wi-Fi / network blips
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        if (recognitionRef.current && isListeningRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isListeningRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                // ignore
              }
            }
          }, 200);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setError("Unable to start voice recognition. Please try again or type directly.");
      stopListening();
    }
  }, [stopListening]);

  // Dynamic audio device switching (Bluetooth headsets, AirPods, stethoscopes, external mics)
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.addEventListener) return;

    const handleDeviceChange = async () => {
      if (!isListeningRef.current || !mediaStreamRef.current) return;

      const audioTracks = mediaStreamRef.current.getAudioTracks();
      const hasEndedTrack = audioTracks.some((t) => t.readyState === "ended" || !t.enabled);

      if (hasEndedTrack) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = newStream;

          if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            if (sourceNodeRef.current) {
              sourceNodeRef.current.disconnect();
            }
            const newSource = audioContextRef.current.createMediaStreamSource(newStream);
            sourceNodeRef.current = newSource;

            if (biquadFilterRef.current) {
              newSource.connect(biquadFilterRef.current);
            } else if (analyserRef.current) {
              newSource.connect(analyserRef.current);
            }
          }
        } catch {
          setError("Audio input device changed. Please verify your microphone settings.");
        }
      }
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopAudioAnalyser();
      stopTimer();
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [stopAudioAnalyser, stopTimer]);

  return {
    isListening,
    transcript,
    interimTranscript,
    duration,
    audioLevel,
    error,
    startListening,
    stopListening,
    cancelListening,
    clearError: () => setError(null),
    isFilterActive,
    filteredStream: filteredStreamRef.current,
  };
}
