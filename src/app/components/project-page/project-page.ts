import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { ProjectsService } from '../../services/projects.service';
import { Project, STATUS_LABEL } from '../../models/project';

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

function parseGalleryItem(src: string, index: number, projectName: string): GalleryItem {
  const filename = decodeURIComponent(src.split('/').pop() ?? '');
  const isHero = index === 0;

  if (isHero) {
    return {
      src,
      isHero: true,
      type: 'hero',
      badge: 'რენდერი',
      title: 'მთავარი რენდერი',
      alt: `${projectName} — Exterior facade render`,
      tag: 'HERO',
    };
  }

  // Extract area number 
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
      badge: '3D გეგმარება',
      title: area ? `ბინა ${area} მ²` : `3D გეგმარება #${index}`,
      area,
      alt: `${projectName} — 3D floor plan layout${area ? ' ' + area + ' m²' : ''}`,
      tag: '3D MODEL',
    };
  }

  if (area || isPlanWord || isGif) {
    return {
      src,
      isHero: false,
      type: 'floor-plan-2d',
      badge: 'ბინის გეგმა',
      title: area ? `ბინა ${area} მ²` : `არქიტექტურული გეგმა #${index}`,
      area,
      alt: `${projectName} — Architectural floor plan${area ? ' ' + area + ' m²' : ''}`,
      tag: 'BLUEPRINT',
    };
  }

  let title = `დეტალი #${index}`;
  let badge = 'არქიტექტურა';
  if (filename.includes('night')) {
    title = 'ღამის რენდერი';
    badge = 'რენდერი';
  } else if (filename.includes('morning')) {
    title = 'Morning Render';
    badge = 'რენდერი';
  }

  return {
    src,
    isHero: false,
    type: 'render',
    badge,
    title,
    alt: `${projectName} — Architectural detail ${index}`,
    tag: 'PHOTO',
  };
}

@Component({
  selector: 'app-project-page',
  imports: [RouterLink],
  templateUrl: './project-page.html',
  styleUrl: './project-page.scss',
})
export class ProjectPage {
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);

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
    return raw.map((src, idx) => parseGalleryItem(src, idx, p.name));
  });

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