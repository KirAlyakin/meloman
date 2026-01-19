// Timer Audio Manager for PubQuiz
// Теперь использует SystemSounds для воспроизведения

import { systemSounds } from '../../audio/SystemSounds';

const TIMER_AUDIO_DEBUG = false;

class TimerAudioManager {
  private isInitialized = false;
  private isMusicPlaying = false;
  private isTickPlaying = false;
  private tickIntervalId: number | null = null;
  private volume = 0.5;

  // Initialize manager
  async init(): Promise<void> {
    if (this.isInitialized) return;

    await systemSounds.init();
    
    this.isInitialized = true;
    TIMER_AUDIO_DEBUG && console.log('[TimerAudio] Initialized via SystemSounds');
  }

  // Preload next track
  preloadNext(): void {
    // SystemSounds handles preloading
  }

  // Start playing background music
  startMusic(): void {
    if (this.isMusicPlaying) return;

    if (!systemSounds.hasTracksFor('timer')) {
      TIMER_AUDIO_DEBUG && console.log('[TimerAudio] No music files available');
      return;
    }

    systemSounds.play('timer');
    this.isMusicPlaying = true;
    TIMER_AUDIO_DEBUG && console.log('[TimerAudio] Music started');
  }

  // Start next track (for new question)
  startNextTrack(shuffle: boolean = false): void {
    if (!systemSounds.hasTracksFor('timer')) {
      TIMER_AUDIO_DEBUG && console.log('[TimerAudio] No music files available');
      return;
    }

    // Если уже играет - переключаем на следующий
    if (this.isMusicPlaying) {
      systemSounds.playNext('timer', shuffle);
    } else {
      systemSounds.playNext('timer', shuffle);
      this.isMusicPlaying = true;
    }
    
    TIMER_AUDIO_DEBUG && console.log('[TimerAudio] Next track started, shuffle:', shuffle);
  }

  // Stop background music
  stopMusic(): void {
    systemSounds.stop('timer');
    this.isMusicPlaying = false;
  }

  // Start tick sound (plays every second)
  startTick(): void {
    if (this.isTickPlaying) return;
    
    this.isTickPlaying = true;
    
    // Play immediately
    systemSounds.play('tick');
    
    // Then every second
    this.tickIntervalId = window.setInterval(() => {
      systemSounds.play('tick');
    }, 1000);
    
    TIMER_AUDIO_DEBUG && console.log('[TimerAudio] Tick started');
  }

  // Stop tick sound
  stopTick(): void {
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    this.isTickPlaying = false;
    TIMER_AUDIO_DEBUG && console.log('[TimerAudio] Tick stopped');
  }

  // Stop all audio
  stopAll(): void {
    this.stopMusic();
    this.stopTick();
  }

  // Set volume (0-1)
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    systemSounds.setVolume('timer', this.volume);
  }

  // Get current volume
  getVolume(): number {
    return this.volume;
  }

  // Check if music is available
  hasMusicFiles(): boolean {
    return systemSounds.hasTracksFor('timer');
  }

  // Fade out music smoothly
  fadeOutMusic(duration: number = 1000): void {
    if (!this.isMusicPlaying) return;
    systemSounds.fadeOut('timer', duration);
    setTimeout(() => {
      this.isMusicPlaying = false;
    }, duration);
  }

  // Fade in music
  fadeInMusic(duration: number = 1000): void {
    if (!systemSounds.hasTracksFor('timer')) return;
    systemSounds.fadeIn('timer', duration);
    this.isMusicPlaying = true;
  }

  // Cleanup resources
  destroy(): void {
    this.stopAll();
    this.isInitialized = false;
  }

  // === Новые методы для SFX ===

  // Звук правильного ответа
  playCorrect(): void {
    systemSounds.play('correct');
  }

  // Звук неправильного ответа
  playWrong(): void {
    systemSounds.play('wrong');
  }

  // Звук начала раунда
  playRoundStart(): void {
    systemSounds.play('roundStart');
  }

  // Звук конца игры
  playGameEnd(): void {
    systemSounds.play('gameEnd');
  }

  // Получить список треков таймера
  getTimerTracks(): { name: string; path: string; duration: number }[] {
    return systemSounds.getTracks('timer');
  }

  // Выбрать трек таймера
  selectTimerTrack(index: number): void {
    systemSounds.selectTrack('timer', index);
  }

  // Воспроизвести случайный трек
  playRandomMusic(): void {
    if (this.isMusicPlaying) return;
    systemSounds.playRandom('timer');
    this.isMusicPlaying = true;
  }
}

// Singleton instance
export const timerAudio = new TimerAudioManager();

export default timerAudio;
