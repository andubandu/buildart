import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Language = 'EN' | 'GE';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly http = inject(HttpClient);

  readonly currentLanguage = signal<Language>('EN');
  private readonly dictionary = signal<any>(null);
  readonly isLoaded = computed(() => this.dictionary() !== null);

  constructor() {
    this.loadTranslations();
  }

  private async loadTranslations() {
    try {
      const data = await firstValueFrom(this.http.get('/json/translations.json'));
      console.log('Translations loaded successfully');
      this.dictionary.set(data);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  setLanguage(lang: Language) {
    this.currentLanguage.set(lang);
  }

  translate(key: string): string {
    const lang = this.currentLanguage();
    const dict = this.dictionary();

    if (!dict) return key;

    const langDict = dict[lang];
    if (!langDict) return key;

    const parts = key.split('.');
    let current = langDict;

    for (const part of parts) {
      if (current === null || current === undefined || current[part] === undefined) {
        return key;
      }
      current = current[part];
    }

    return current;
  }
}
