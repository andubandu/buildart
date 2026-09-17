import { Component, computed, input, signal, inject } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

import { Project, STATUS_LABEL } from '../../models/project';
@Component({
  selector: 'app-project-panel',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './project-panel.html',
  styleUrl: './project-panel.scss',
})
export class ProjectPanel {
  readonly project = input.required<Project>();
  readonly index = input.required<number>();
  protected readonly translationService = inject(TranslationService);

  protected readonly loaded = signal(false);
  protected readonly statusLabel = computed(() => STATUS_LABEL[this.project().status]);
  protected readonly paddedIndex = computed(() =>
    this.index().toString().padStart(2, '0'),
  );

  protected get subtitle() {
    const p = this.project();
    const lang = this.translationService.currentLanguage();
    if (lang === 'EN') {
      return p.subtitle_en || p.subtitle;
    }
    return p.subtitle;
  }
}
