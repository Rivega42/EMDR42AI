import { 
  type User, 
  type InsertUser,
  type EmotionCapture,
  type InsertEmotionCapture,
  type Session,
  type InsertSession
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  getActiveSessionByPatient(patientId: string): Promise<Session | undefined>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  
  // Emotion capture methods
  createEmotionCapture(emotion: InsertEmotionCapture): Promise<EmotionCapture>;
  getEmotionCaptures(sessionId: string, limit?: number): Promise<EmotionCapture[]>;
  getLatestEmotionCapture(sessionId: string): Promise<EmotionCapture | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private emotionCaptures: Map<string, EmotionCapture>;
  private sessionEmotions: Map<string, string[]>; // sessionId -> emotionIds

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.emotionCaptures = new Map();
    this.sessionEmotions = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || 'patient',
      email: insertUser.email ?? null,
      fullName: insertUser.fullName ?? null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const id = randomUUID();
    const newSession: Session = {
      id,
      patientId: session.patientId,
      therapistId: session.therapistId,
      startTime: session.startTime || new Date(),
      endTime: session.endTime ?? null,
      phase: session.phase || 'preparation',
      status: session.status || 'active',
      notes: session.notes ?? null,
      sudsInitial: session.sudsInitial ?? null,
      sudsFinal: session.sudsFinal ?? null,
      vocInitial: session.vocInitial ?? null,
      vocFinal: session.vocFinal ?? null,
      createdAt: new Date()
    };
    this.sessions.set(id, newSession);
    return newSession;
  }
  
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }
  
  async getActiveSessionByPatient(patientId: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.patientId === patientId && session.status === 'active'
    );
  }
  
  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (session) {
      const updatedSession = { ...session, ...updates };
      this.sessions.set(id, updatedSession);
      return updatedSession;
    }
    return undefined;
  }
  
  // Emotion capture methods
  async createEmotionCapture(emotion: InsertEmotionCapture): Promise<EmotionCapture> {
    const id = randomUUID();
    const emotionCapture: EmotionCapture = {
      id,
      patientId: emotion.patientId,
      sessionId: emotion.sessionId,
      timestamp: new Date(),
      source: emotion.source,
      arousal: emotion.arousal,
      valence: emotion.valence,
      affects: emotion.affects || {},
      basicEmotions: emotion.basicEmotions || {},
      blsConfig: emotion.blsConfig || {},
      phaseContext: emotion.phaseContext ?? null
    };
    this.emotionCaptures.set(id, emotionCapture);
    
    // Track by session
    const sessionEmotions = this.sessionEmotions.get(emotion.sessionId) || [];
    sessionEmotions.push(id);
    this.sessionEmotions.set(emotion.sessionId, sessionEmotions);
    
    return emotionCapture;
  }
  
  async getEmotionCaptures(sessionId: string, limit: number = 100): Promise<EmotionCapture[]> {
    const emotionIds = this.sessionEmotions.get(sessionId) || [];
    const captures: EmotionCapture[] = [];
    
    for (const id of emotionIds.slice(-limit)) {
      const capture = this.emotionCaptures.get(id);
      if (capture) captures.push(capture);
    }
    
    return captures;
  }
  
  async getLatestEmotionCapture(sessionId: string): Promise<EmotionCapture | undefined> {
    const emotionIds = this.sessionEmotions.get(sessionId) || [];
    if (emotionIds.length === 0) return undefined;
    
    const lastId = emotionIds[emotionIds.length - 1];
    return this.emotionCaptures.get(lastId);
  }
}

export const storage = new MemStorage();
