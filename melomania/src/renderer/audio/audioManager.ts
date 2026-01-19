import { Howl } from 'howler';

class AudioManager {
  private currentSound: Howl | null = null;
  private currentPath: string | null = null;
  private startTime: number = 0;
  private endTime: number = 0;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onEnd: (() => void) | null = null;
  private timeUpdateInterval: number | null = null;

  load(
    audioPath: string, 
    startTime: number, 
    endTime: number,
    onTimeUpdate?: (time: number) => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.currentPath === audioPath && this.currentSound) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.onTimeUpdate = onTimeUpdate || null;
        this.onEnd = onEnd || null;
        resolve();
        return;
      }

      this.stop();

      this.currentPath = audioPath;
      this.startTime = startTime;
      this.endTime = endTime;
      this.onTimeUpdate = onTimeUpdate || null;
      this.onEnd = onEnd || null;

      this.currentSound = new Howl({
        src: [audioPath],
        html5: true,
        onload: () => resolve(),
        onloaderror: (_id, error) => reject(error),
        onend: () => {
          this.stopTimeUpdate();
          if (this.onEnd) this.onEnd();
        }
      });
    });
  }

  play(): void {
    if (!this.currentSound) return;
    this.currentSound.seek(this.startTime);
    this.currentSound.play();
    this.startTimeUpdate();
  }

  pause(): void {
    if (!this.currentSound) return;
    this.currentSound.pause();
    this.stopTimeUpdate();
  }

  resume(): void {
    if (!this.currentSound) return;
    this.currentSound.play();
    this.startTimeUpdate();
  }

  stop(): void {
    this.stopTimeUpdate();
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.unload();
      this.currentSound = null;
      this.currentPath = null;
    }
  }

  seek(time: number): void {
    if (!this.currentSound) return;
    const clampedTime = Math.max(this.startTime, Math.min(this.endTime, time));
    this.currentSound.seek(clampedTime);
  }

  getCurrentTime(): number {
    if (!this.currentSound) return 0;
    return this.currentSound.seek() as number;
  }

  isPlaying(): boolean {
    return this.currentSound?.playing() || false;
  }

  setVolume(volume: number): void {
    if (this.currentSound) {
      this.currentSound.volume(Math.max(0, Math.min(1, volume)));
    }
  }

  private startTimeUpdate(): void {
    this.stopTimeUpdate();
    
    this.timeUpdateInterval = window.setInterval(() => {
      if (!this.currentSound || !this.currentSound.playing()) return;

      const currentTime = this.currentSound.seek() as number;
      
      if (currentTime >= this.endTime) {
        this.pause();
        if (this.onEnd) this.onEnd();
        return;
      }

      if (this.onTimeUpdate) {
        this.onTimeUpdate(currentTime);
      }
    }, 100);
  }

  private stopTimeUpdate(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }
}

export const audioManager = new AudioManager();
