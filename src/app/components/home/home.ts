import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

import { ProjectPanel } from '../project-panel/project-panel';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../models/project';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProjectPanel, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  protected readonly translationService = inject(TranslationService);
  private readonly projectsService = inject(ProjectsService);
  private readonly destroyRef = inject(DestroyRef);

  protected getProjectSubtitle(project: Project): string | undefined {
    const lang = this.translationService.currentLanguage();
    if (lang === 'EN') {
      return project.subtitle_en || project.subtitle;
    }
    return project.subtitle;
  }

  private readonly deck = viewChild.required<ElementRef<HTMLElement>>('deck');
  private readonly scrollbar = viewChild.required<ElementRef<HTMLElement>>('scrollbar');

  protected readonly projects = toSignal(this.projectsService.getProjects(), {
    initialValue: [] as Project[],
  });

  protected readonly thumbWidth = signal(20);
  protected readonly thumbLeft = signal(0);

  constructor() {
    afterNextRender(() => this.wireHorizontalScroll());
  }

  private wireHorizontalScroll(): void {
    const el = this.deck().nativeElement;
    const bar = this.scrollbar().nativeElement;

    const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

    let rafId: number | null = null;
    const syncThumb = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const ratio = el.clientWidth / el.scrollWidth;
        const width = clamp(ratio * 100, 6, 100);
        this.thumbWidth.set(width);
        const max = el.scrollWidth - el.clientWidth;
        const travelled = max > 0 ? el.scrollLeft / max : 0;
        this.thumbLeft.set(travelled * (100 - width));
        rafId = null;
      });
    };

    const resizeObserver = new ResizeObserver(() => syncThumb());
    resizeObserver.observe(el);

    const toPixels = (value: number, mode: number): number => {
      if (mode === 1) return value * 32;
      if (mode === 2) return value * el.clientWidth;
      return value;
    };

    const onWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.menu.is-open')) return;

      const dx = toPixels(event.deltaX, event.deltaMode);
      const dy = toPixels(event.deltaY, event.deltaMode);
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (!delta) return;

      event.preventDefault();
      el.scrollLeft += delta;
    };
    window.addEventListener('wheel', onWheel, { passive: false });

    let isMouseDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasDragged = false;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest('button, .outro__btn, .scrollbar')) return;

      isMouseDown = true;
      hasDragged = false;
      startX = event.clientX;
      startScrollLeft = el.scrollLeft;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isMouseDown) return;
      const diff = event.clientX - startX;
      if (Math.abs(diff) > 4) {
        hasDragged = true;
        el.classList.add('is-dragging');
      }
      el.scrollLeft = startScrollLeft - diff;
    };

    const onPointerUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      el.classList.remove('is-dragging');
    };

    const onClickCapture = (event: MouseEvent) => {
      if (hasDragged) {
        event.preventDefault();
        event.stopPropagation();
        hasDragged = false;
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('click', onClickCapture, { capture: true });

    let scrubbing = false;
    const scrubTo = (clientX: number) => {
      const rect = bar.getBoundingClientRect();
      const frac = clamp((clientX - rect.left) / rect.width, 0, 1);
      el.scrollLeft = frac * (el.scrollWidth - el.clientWidth);
    };
    bar.addEventListener('pointerdown', (event: PointerEvent) => {
      scrubbing = true;
      bar.setPointerCapture(event.pointerId);
      bar.classList.add('is-scrubbing');
      scrubTo(event.clientX);
    });
    bar.addEventListener('pointermove', (event: PointerEvent) => {
      if (scrubbing) scrubTo(event.clientX);
    });
    const endScrub = (event: PointerEvent) => {
      scrubbing = false;
      bar.classList.remove('is-scrubbing');
      if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId);
    };
    bar.addEventListener('pointerup', endScrub);
    bar.addEventListener('pointercancel', endScrub);

    el.addEventListener('scroll', syncThumb, { passive: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        el.scrollBy({ left: el.clientWidth * 0.5, behavior: 'smooth' });
      } else if (event.key === 'ArrowLeft') {
        el.scrollBy({ left: -el.clientWidth * 0.5, behavior: 'smooth' });
      } else if (event.key === 'Home' && document.activeElement === bar) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (event.key === 'End' && document.activeElement === bar) {
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', syncThumb);

    this.destroyRef.onDestroy(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('click', onClickCapture, { capture: true });
      el.removeEventListener('scroll', syncThumb);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', syncThumb);
    });

    syncThumb();
  }
}
