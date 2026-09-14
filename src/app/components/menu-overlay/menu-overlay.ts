import {
  Component,
  ElementRef,
  HostListener,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project } from '../../models/project';

@Component({
  selector: 'app-menu-overlay',
  imports: [RouterLink],
  template: `
    <div
      class="menu"
      [class.is-open]="open()"
      (click)="onBackdrop($event)"
      [attr.aria-hidden]="!open()"
    >
      <div
        #panel
        class="menu__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <button
          #closeBtn
          type="button"
          class="menu__close"
          aria-label="Close menu"
          (click)="close.emit()"
        >
          <span></span>
          <span></span>
        </button>

        <nav class="menu__nav" aria-label="Primary">
          <a class="menu__link" routerLink="/" (click)="close.emit()">Home</a>

          <div class="menu__group" [class.is-expanded]="projectsOpen()">
            <button
              type="button"
              class="menu__link menu__link--toggle"
              [attr.aria-expanded]="projectsOpen()"
              aria-controls="menu-projects-list"
              (click)="projectsOpen.set(!projectsOpen())"
            >
              Projects
              <span class="menu__chevron" aria-hidden="true">▾</span>
            </button>

            <ul id="menu-projects-list" class="menu__sub">
              @for (project of projects(); track project.id) {
                <li>
                  <button
                    type="button"
                    (click)="select.emit(project.id)"
                    [attr.aria-label]="project.name + ', ' + project.location"
                  >
                    <span class="menu__sub-name">{{ project.name }}</span>
                    <span class="menu__sub-loc">{{ project.location }}</span>
                  </button>
                </li>
              }
            </ul>
          </div>

          <a
            class="menu__link"
            routerLink="/about"
            (click)="close.emit()"
          >
            About
          </a>
          <a
            class="menu__link"
            routerLink="/contact"
            (click)="close.emit()"
          >
            Contact
          </a>
        </nav>

        <div class="menu__footer">
          <span>BUILDART · Tbilisi</span>
          <a href="mailto:buildart.office@gmail.com.ge" class="menu__mail">buildart.office@gmail.com</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './menu-overlay.scss',
})
export class MenuOverlay {
  readonly open = input(false);
  readonly projects = input<Project[]>([]);

  readonly close = output<void>();
  readonly select = output<number>();

  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  protected readonly projectsOpen = signal(true);

  constructor() {
    effect(() => {
      if (this.open()) {
        setTimeout(() => this.closeBtn()?.nativeElement?.focus(), 50);
      }
    });
  }

  @HostListener('window:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.close.emit();
    }
  }

  protected onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('menu')) {
      this.close.emit();
    }
  }
}
