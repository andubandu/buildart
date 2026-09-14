import { Routes } from '@angular/router';

import { HomePage } from './components/home/home';
import { ProjectPage } from './components/project-page/project-page';
import { AboutPage } from './components/about/about';
import { ContactComponent } from './components/contact/contact'; // Make sure this component exists and is imported

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'about', component: AboutPage },
  { path: 'project/:id', component: ProjectPage },
  { path: 'contact', component: ContactComponent }, // MUST come before wildcard
  { path: '**', redirectTo: '' },                   // MUST be last
];