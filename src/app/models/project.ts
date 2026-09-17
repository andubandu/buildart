export interface Project {
  id: number;
  name: string;
  subtitle?: string;
  subtitle_en?: string;
  location: string;
  status: 'completed' | 'in_progress' | 'planned';
  year?: number;
  apartments?: number;
  floors?: number;
  image: string;
  other_images?: string[]; // Added to match JSON
  gallery?: string[];      // Retained for backward compatibility
}

export const STATUS_LABEL: Record<string, string> = {
  completed: 'დასრულებული / COMPLETE',
  in_progress: 'მიმდინარე / IN PROGRESS',
  planned: 'დაგეგმილი / PLANNED',
};