import { Component, computed, input, signal } from '@angular/core';

import { Project, STATUS_LABEL } from '../../models/project';
@Component({
  selector: 'app-project-panel',
  templateUrl: './project-panel.html',
  styleUrl: './project-panel.scss',
})
export class ProjectPanel {
  readonly project = input.required<Project>();
  readonly index = input.required<number>();

  protected readonly loaded = signal(false);
  protected readonly statusLabel = computed(() => STATUS_LABEL[this.project().status]);
  protected readonly paddedIndex = computed(() =>
    this.index().toString().padStart(2, '0'),
  );
}
