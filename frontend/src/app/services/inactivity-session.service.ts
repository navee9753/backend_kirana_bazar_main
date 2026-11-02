import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription, interval } from 'rxjs';

const SESSION_TIMEOUT_SECONDS = 10 * 60;
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

@Injectable({
  providedIn: 'root'
})
export class InactivitySessionService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly remainingSecondsSubject = new BehaviorSubject(SESSION_TIMEOUT_SECONDS);
  private started = false;
  private lastActivityAt = 0;
  private countdown?: Subscription;

  readonly remainingSeconds$ = this.remainingSecondsSubject.asObservable();

  private readonly activityHandler: EventListener = () => {
    if (this.started) {
      this.lastActivityAt = Date.now();
    }
  };

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.lastActivityAt = Date.now();
    ACTIVITY_EVENTS.forEach((eventName) => {
      this.document.addEventListener(eventName, this.activityHandler, { passive: true });
    });

    this.countdown = interval(1000).subscribe(() => {
      const elapsedSeconds = Math.floor((Date.now() - this.lastActivityAt) / 1000);
      const remainingSeconds = Math.max(0, SESSION_TIMEOUT_SECONDS - elapsedSeconds);
      this.remainingSecondsSubject.next(remainingSeconds);
      if (remainingSeconds === 0) {
        this.endSession();
      }
    });
  }

  private endSession(): void {
    this.started = false;
    this.countdown?.unsubscribe();
    ACTIVITY_EVENTS.forEach((eventName) => {
      this.document.removeEventListener(eventName, this.activityHandler);
    });
    localStorage.removeItem('kirana-auth-token');
    localStorage.removeItem('kirana-user-role');
    localStorage.removeItem('kirana-user-phone');
    this.router.navigateByUrl('/login');
  }
}
