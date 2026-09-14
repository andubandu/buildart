import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SideRail } from './components/side-rail/side-rail';
import { MenuOverlay } from './components/menu-overlay/menu-overlay';
import { ProjectsService } from './services/projects.service';
import { Project } from './models/project';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideRail, MenuOverlay],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly projectsService = inject(ProjectsService);
  private readonly router = inject(Router);

  protected readonly projects = toSignal(this.projectsService.getProjects(), {
    initialValue: [] as Project[],
  });

  protected readonly menuOpen = signal(false);

  protected goToProject(id: number): void {
    this.menuOpen.set(false);
    this.router.navigate(['/project', id]);
  }

  protected goToContact(): void {
    this.menuOpen.set(false);
    this.router.navigate(['/contact']);
  }
}