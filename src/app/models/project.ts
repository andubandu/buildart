export interface Project {
  id: number;
  name: string;
  subtitle?: string;
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
  completed: 'დასრულებული',
  in_progress: 'მიმდინარე',
  planned: 'დაგეგმილი',
};