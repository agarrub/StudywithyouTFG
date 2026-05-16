import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { YouTubePlayer, YouTubePlayerModule } from '@angular/youtube-player';
import { PomodoroServices } from '../services/pomodoro-services';
import { AuthService } from '../services/auth-service';
import { NavigationSidebar } from "../navigation-sidebar/navigation-sidebar";

@Component({
  selector: 'app-pomodoro',
  imports: [YouTubePlayerModule, NavigationSidebar],
  templateUrl: './pomodoro.html',
  styleUrl: './pomodoro.scss',
})
export class Pomodoro {
  private youtubePlayer = viewChild<YouTubePlayer>(YouTubePlayer);
  private pomodoroServices = inject(PomodoroServices);
  private authService = inject(AuthService);

  private user = this.authService.user();
  private audio = new Audio('/Pomodoro/alarma.mp3');

  public videosList = signal<{ id: string; title: string }[]>([
    {
      id: '9fHgLqbYhE4',
      title:
        '(NO ADS) Warm Morning Jazz in Summer Coffee Ambience ⛵Relaxing Jazz for Work , Study',
    },
    {
      id: 'c18WZZa4KIA',
      title: 'Fall Coffee Shop Bookstore Ambience with Relaxing Jazz Music & Rain Sounds',
    },
    {
      id: '1Waq8ohWbV4',
      title:
        'Lofi Beats Live - 24/7 🌙 | Relaxing & Uplifting 🎧 [[Lofi Chill Hop Mix]] 🎶 No extra ads!',
    },
    {
      id: 'iBeKujv18OI',
      title:
        '(No ads) Rainy Day at Cozy Coffee Shop with Smooth Jazz Music and Rain Sounds for Stress Relief',
    },
  ]);

  public playerVars = {
    controls: 1,
    disablekb: 1,
    rel: 0,
    modestbranding: 1,
  };

  public currentVideoIndex = signal<number>(0);

  public currentVideo = computed(() => this.videosList()[this.currentVideoIndex()]);

  //No quiero escuchar ninguna queja de ningún revisor ni beta tester de que hay "poco tiempo" en el temporizador 😡.
  // Me daba pereza intentar usar una formula matemática para calcular los tiempos, asi que por facilidad y seguridad, esto es lo que hay.
  public avaliableTimes = signal<number[]>([
    1, 2, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180, 240, 300, 360, 400, 480, 540, 600, 720, 900,
    1080, 1200, 1440, 1800, 2160, 2400, 2700, 3000, 3600, 4800, 7200, 10800, 14400, 18000, 21600,
    28800, 36000, 43200, 57600, 72000, 86400,
  ]);

  private actualTimeIndex = signal<number>(3);

  //Unica y exclusivamente para poder parar el intervalo
  private interval: any;

  public timer = signal<number>(this.avaliableTimes()[this.actualTimeIndex()] * 60);

  public isTimerRunning = signal<boolean>(false);
  public secondsLeft = computed(() => {
    const seconds = this.timer() % 60;
    return seconds < 10 ? `0${seconds}` : seconds;
  });
  public minutesLeft = computed(() => {
    const minutes = Math.floor(this.timer() / 60);
    return minutes < 10 ? `0${minutes}` : minutes;
  });

  public timeCounter = signal<number>(0);

  public startTimer(): void {
    if (this.isTimerRunning()) {
      return;
    }

    this.isTimerRunning.set(true);

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      if (this.timer() > 0) {
        this.timer.set(this.timer() - 1);
        this.timeCounter.set(this.timeCounter() + 1);
      } else {
        this.audio.play();
        this.savePomodoro();
        this.isTimerRunning.set(false);
        clearInterval(this.interval);
        this.youtubePlayer()?.pauseVideo();
      }
    }, 1000);

    this.youtubePlayer()?.playVideo();
  }

  public resetTimer(): void {
    this.isTimerRunning.set(false);
    clearInterval(this.interval);
    this.timer.set(this.avaliableTimes()[this.actualTimeIndex()] * 60);
    this.youtubePlayer()?.stopVideo();
    this.currentVideoIndex.set(0);
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  public pauseTimer(): void {
    this.isTimerRunning.set(false);
    clearInterval(this.interval);
    this.youtubePlayer()?.pauseVideo();
    this.audio.pause();
    this.audio.currentTime = 0;
  }
  public moreTime(): void {
    const newIndex = (this.actualTimeIndex() + 1) % this.avaliableTimes().length;
    this.actualTimeIndex.set(newIndex);
    this.timer.set(this.avaliableTimes()[newIndex] * 60);
  }

  public lessTime(): void {
    const newIndex =
      (this.actualTimeIndex() - 1 + this.avaliableTimes().length) % this.avaliableTimes().length;
    this.actualTimeIndex.set(newIndex);
    this.timer.set(this.avaliableTimes()[newIndex] * 60);
  }
  public displayTime = computed(() => {
    const totalMinutes = Math.floor(this.timer() / 60);
    const seconds = this.timer() % 60;

    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  public savePomodoro(): void {
    this.pomodoroServices
      .savePomodoro({
        userID: this.user?.id!,
        seconds: this.timeCounter(),
      })
      .subscribe({
        next: () => {
          console.log('Pomodoro saved successfully');
        },
        error: (error) => {
          console.error(error);
        },
      });
  }

  public nextVideo(): void {
    this.currentVideoIndex.set((this.currentVideoIndex() + 1) % this.videosList().length);
  }

  public previousVideo(): void {
    this.currentVideoIndex.set(
      (this.currentVideoIndex() - 1 + this.videosList().length) % this.videosList().length,
    );
  }

  public addVideoMenu = signal<boolean>(false);

  public addVideo(videoID: string, videoTitle: string): void {
    this.videosList.set([
      ...this.videosList(),
      { id: videoID, title: videoTitle || `Nuevo vídeo (${this.videosList().length + 1})` },
    ]);
  }

  public removeVideoMenu = signal<boolean>(false);

  public removeVideo(videoID: string): void {
    this.videosList.set(this.videosList().filter((video) => video.id !== videoID));
  }
  constructor() {}

  public getYouTubeVideoId(url: string): string {
    const regex =
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]{11})(\S+)?$/;
    const match = url.trim().match(regex);
    if (match && match[5].length === 11) {
      return match[5];
    }
    return '';
  }
}
