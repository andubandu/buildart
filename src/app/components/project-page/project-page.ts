import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { ProjectsService } from '../../services/projects.service';
import { Project, STATUS_LABEL } from '../../models/project';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

export interface GalleryItem {
  src: string;
  isHero: boolean;
  type: 'hero' | 'floor-plan-3d' | 'floor-plan-2d' | 'render';
  badge: string;
  title: string;
  area?: string;
  alt: string;
  tag?: string;
}

@Component({
  selector: 'app-project-page',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './project-page.html',
  styleUrl: './project-page.scss',
})
export class ProjectPage {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  private readonly translationService = inject(TranslationService);

  private readonly projects = toSignal(this.projectsService.getProjects(), {
    initialValue: [] as Project[],
  });

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((pm) => Number(pm.get('id')))),
    { initialValue: NaN },
  );

  protected readonly project = computed(() =>
    this.projects().find((p) => p.id === this.id()),
  );

  protected get subtitle() {
    const p = this.project();
    if (!p) return undefined;
    const lang = this.translationService.currentLanguage();
    if (lang === 'EN') {
      return p.subtitle_en || p.subtitle;
    }
    return p.subtitle;
  }

  /** Hero main image first, followed by all additional folder images / floor plans */
  protected readonly images = computed<string[]>(() => {
    const p = this.project();
    if (!p) return [];

    const extra = p.other_images ?? p.gallery ?? [];
    return p.image ? [p.image, ...extra] : [...extra];
  });

  /** Structured gallery items with architectural classification and spec metadata */
  protected readonly galleryItems = computed<GalleryItem[]>(() => {
    const p = this.project();
    if (!p) return [];

    const raw = this.images();
    return raw.map((src, idx) => this.parseGalleryItem(src, idx, p.name));
  });

  private parseGalleryItem(src: string, index: number, projectName: string): GalleryItem {
    const filename = decodeURIComponent(src.split('/').pop() ?? '');
    const isHero = index === 0;

    if (isHero) {
      return {
        src,
        isHero: true,
        type: 'hero',
        badge: this.translationService.translate('project.gallery.render_badge'),
        title: this.translationService.translate('project.gallery.render_title'),
        alt: `${projectName} — ${this.translationService.translate('project.facade_render')}`,
        tag: 'HERO',
      };
    }

    const areaMatch = filename.match(/(\d+[.,]\d+)/);
    const area = areaMatch ? areaMatch[1].replace(',', '.') : undefined;

    const upper = filename.toUpperCase();
    const lower = filename.toLowerCase();
    const isTransparent = upper.includes('TRANSPARENT');
    const isGif = lower.endsWith('.gif');
    const isPng = lower.endsWith('.png');
    const isPlanWord = filename.includes('ბინა') || lower.includes('plan');

    if (isTransparent || (isPng && area)) {
      return {
        src,
        isHero: false,
        type: 'floor-plan-3d',
        badge: this.translationService.translate('project.gallery.plan3d_badge'),
        title: area ? this.translationService.translate('project.gallery.plan3d_title').replace('{area}', area) : this.translationService.translate('project.gallery.plan3d_badge'),
        area,
        alt: `${projectName} — ${this.translationService.translate('project.gallery.plan3d_alt').replace('{area}', area || '')}`,
        tag: '3D MODEL',
      };
    }

    if (area || isPlanWord || isGif) {
      return {
        src,
        isHero: false,
        type: 'floor-plan-2d',
        badge: this.translationService.translate('project.gallery.plan2d_badge'),
        title: area ? this.translationService.translate('project.gallery.plan2d_title').replace('{area}', area) : this.translationService.translate('project.gallery.plan2d_generic_title'),
        area,
        alt: `${projectName} — ${this.translationService.translate('project.gallery.plan2d_alt').replace('{area}', area || '')}`,
        tag: 'BLUEPRINT',
      };
    }

    let title = this.translationService.translate('project.gallery.detail_title');
    let badge = this.translationService.translate('project.gallery.detail_badge');
    if (filename.includes('night')) {
      title = this.translationService.translate('project.gallery.night_render');
      badge = this.translationService.translate('project.gallery.render_badge');
    } else if (filename.includes('morning')) {
      title = this.translationService.translate('project.gallery.morning_render');
      badge = this.translationService.translate('project.gallery.render_badge');
    }

    return {
      src,
      isHero: false,
      type: 'render',
      badge,
      title,
      alt: `${projectName} — ${this.translationService.translate('project.detail_render')} ${index}`,
      tag: 'PHOTO',
    };
  }

  protected readonly statusLabel = computed(() => {
    const p = this.project();
    return p ? STATUS_LABEL[p.status] : '';
  });

  protected readonly loaded = computed(() => this.projects().length > 0);

  readonly selectedImage = signal<string | null>(null);

  openImage(src: string) {
    this.selectedImage.set(src);
  }

  closeImage() {
    this.selectedImage.set(null);
  }
}
