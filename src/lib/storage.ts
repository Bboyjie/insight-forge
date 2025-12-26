// Local storage utilities for the app

export interface LLMSettings {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export interface StudyProject {
  id: string;
  title: string;
  topic: string;
  goal: string;
  level: number;
  timePerDay: number;
  durationDays: number;
  chapters: Chapter[];
  learningObjectives: string[];
  createdAt: string;
  progress: number;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  subChapters?: SubChapter[];
  completed: boolean;
  messages: ChatMessage[];
}

export interface SubChapter {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  completed: boolean;
  messages: ChatMessage[];
  skillRewards?: SkillReward[];
}

export interface SkillReward {
  dimension: string;
  points: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface SkillDimension {
  name: string;
  score: number;
  maxScore: number;
}

export interface UserProfile {
  dimensions: SkillDimension[];
  totalLearningMinutes: number;
  completedChapters: number;
}

export interface AuthUser {
  id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  trust_level?: number;
}

const STORAGE_KEYS = {
  LLM_SETTINGS: 'yinxue_llm_settings',
  PROJECTS: 'yinxue_projects',
  JOURNALS: 'yinxue_journals',
  USER_PROFILE: 'yinxue_profile',
  AUTH_USER: 'yinxue_auth_user',
  AUTH_TOKEN: 'yinxue_auth_token',
};

// Auth
export function getAuthUser(): AuthUser | null {
  const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
  return data ? JSON.parse(data) : null;
}

export function saveAuthUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
}

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

export function saveAuthToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

// LLM Settings
export function getLLMSettings(): LLMSettings | null {
  const data = localStorage.getItem(STORAGE_KEYS.LLM_SETTINGS);
  return data ? JSON.parse(data) : null;
}

export function saveLLMSettings(settings: LLMSettings): void {
  localStorage.setItem(STORAGE_KEYS.LLM_SETTINGS, JSON.stringify(settings));
}

// Projects
export function getProjects(): StudyProject[] {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : [];
}

export function saveProjects(projects: StudyProject[]): void {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function getProject(id: string): StudyProject | undefined {
  return getProjects().find(p => p.id === id);
}

export function saveProject(project: StudyProject): void {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter(p => p.id !== id);
  saveProjects(projects);
}

// Journals
export function getJournals(): JournalEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.JOURNALS);
  return data ? JSON.parse(data) : [];
}

export function saveJournals(journals: JournalEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
}

export function getJournal(id: string): JournalEntry | undefined {
  return getJournals().find(j => j.id === id);
}

export function saveJournal(journal: JournalEntry): void {
  const journals = getJournals();
  const index = journals.findIndex(j => j.id === journal.id);
  if (index >= 0) {
    journals[index] = journal;
  } else {
    journals.push(journal);
  }
  saveJournals(journals);
}

export function deleteJournal(id: string): void {
  const journals = getJournals().filter(j => j.id !== id);
  saveJournals(journals);
}

// User Profile
export function getUserProfile(): UserProfile {
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : {
    dimensions: [
      { name: '哲学', score: 0, maxScore: 100 },
      { name: '历史', score: 0, maxScore: 100 },
      { name: '文学', score: 0, maxScore: 100 },
      { name: '科学', score: 0, maxScore: 100 },
      { name: '艺术', score: 0, maxScore: 100 },
      { name: '技术', score: 0, maxScore: 100 },
    ],
    totalLearningMinutes: 0,
    completedChapters: 0,
  };
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function updateDimension(name: string, points: number): void {
  const profile = getUserProfile();
  const dimension = profile.dimensions.find(d => d.name === name);
  if (dimension) {
    dimension.score = Math.min(dimension.score + points, dimension.maxScore);
  } else {
    profile.dimensions.push({ name, score: points, maxScore: 100 });
  }
  saveUserProfile(profile);
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
