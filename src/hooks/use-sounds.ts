import { useCallback, useRef, useState, useEffect } from 'react';

type SoundType = 'correct' | 'wrong' | 'completion';

export function useSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    // Читаем из localStorage при инициализации
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autoQuizSoundEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Сохраняем в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('autoQuizSoundEnabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!isSoundEnabled) return;
    
    const audioContext = getAudioContext();
    if (!audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play beep:', error);
    }
  }, [getAudioContext, isSoundEnabled]);

  const playSound = useCallback((type: SoundType) => {
    if (!isSoundEnabled) return;
    
    const audioContext = getAudioContext();
    if (!audioContext) {
      console.warn('Web Audio API not supported');
      return;
    }

    // Возобновляем контекст если нужно (браузеры блокируют авто-воспроизведение)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    switch(type) {
      case 'correct':
        // Два коротких тона вверх (тыдыш)
        playBeep(523.25, 0.1); // C5
        setTimeout(() => playBeep(659.25, 0.2), 100); // E5
        break;
        
      case 'wrong':
        // Два низких тона вниз (ай ой)
        playBeep(349.23, 0.2, 'square'); // F4
        setTimeout(() => playBeep(261.63, 0.3, 'square'), 200); // C4
        break;
        
      case 'completion':
        // Восходящая арпеджио (тадам)
        playBeep(523.25, 0.2); // C5
        setTimeout(() => playBeep(659.25, 0.2), 200); // E5
        setTimeout(() => playBeep(783.99, 0.2), 400); // G5
        setTimeout(() => playBeep(1046.50, 0.5), 600); // C6
        break;
    }
  }, [playBeep, getAudioContext, isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  return { 
    playSound, 
    isSoundEnabled, 
    toggleSound 
  };
}
