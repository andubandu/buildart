import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Project } from '../models/project';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);

  /** Projects are served as a static file so content can change without a rebuild. */
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>('/json/projects.json');
  }
}
