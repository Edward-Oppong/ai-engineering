import { UserProfile } from '../types';

const STORAGE_USERS_KEY = 'ai_eng_user_registry';
const STORAGE_ACTIVE_USER_KEY = 'ai_eng_active_user_id';

export const AVATAR_COLORS = [
  { id: 'amber', bg: 'bg-amber-600', text: 'text-amber-100', border: 'border-amber-500', hex: '#d97706' },
  { id: 'indigo', bg: 'bg-indigo-600', text: 'text-indigo-100', border: 'border-indigo-500', hex: '#4f46e5' },
  { id: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-100', border: 'border-emerald-500', hex: '#059669' },
  { id: 'rose', bg: 'bg-rose-600', text: 'text-rose-100', border: 'border-rose-500', hex: '#e11d48' },
  { id: 'violet', bg: 'bg-violet-600', text: 'text-violet-100', border: 'border-violet-500', hex: '#7c3aed' },
  { id: 'cyan', bg: 'bg-cyan-600', text: 'text-cyan-100', border: 'border-cyan-500', hex: '#0891b2' },
  { id: 'orange', bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-500', hex: '#ea580c' },
  { id: 'slate', bg: 'bg-stone-700', text: 'text-stone-100', border: 'border-stone-600', hex: '#44403c' },
];

export async function hashPin(pin: string): Promise<string> {
  if (!pin) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + '_ai_eng_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback if crypto.subtle is unavailable
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      hash = ((hash << 5) - hash) + pin.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {
    this.ensureDefaultUser();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private ensureDefaultUser(): void {
    const users = this.getAllUsers();
    if (users.length === 0) {
      const defaultUser: UserProfile = {
        id: 'default',
        name: 'Learner',
        username: 'learner',
        avatarColor: 'amber',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isDefault: true,
      };
      this.saveUsers([defaultUser]);
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, defaultUser.id);
    }
  }

  public getAllUsers(): UserProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: UserProfile[]): void {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (err) {
      console.error('Failed to save user registry:', err);
    }
  }

  public getCurrentUser(): UserProfile {
    const users = this.getAllUsers();
    if (users.length === 0) {
      this.ensureDefaultUser();
      return this.getAllUsers()[0];
    }

    const activeId = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
    const active = users.find(u => u.id === activeId);
    if (active) return active;

    // Fallback to first user
    const first = users[0];
    localStorage.setItem(STORAGE_ACTIVE_USER_KEY, first.id);
    return first;
  }

  public async switchUser(userId: string, pin?: string): Promise<UserProfile> {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User profile not found.');
    }

    if (user.pinHash) {
      if (!pin) {
        throw new Error('PIN required for this profile.');
      }
      const hashed = await hashPin(pin);
      if (hashed !== user.pinHash) {
        throw new Error('Incorrect PIN. Access denied.');
      }
    }

    user.lastLoginAt = new Date().toISOString();
    this.saveUsers(users.map(u => (u.id === user.id ? user : u)));
    localStorage.setItem(STORAGE_ACTIVE_USER_KEY, user.id);
    return user;
  }

  public async createUser(
    name: string,
    username: string,
    pin?: string,
    email?: string,
    avatarColor?: string
  ): Promise<UserProfile> {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    if (!trimmedName) {
      throw new Error('Name cannot be empty.');
    }
    if (!trimmedUsername) {
      throw new Error('Valid username required (letters, numbers, underscores).');
    }

    const users = this.getAllUsers();
    if (users.some(u => u.username.toLowerCase() === trimmedUsername)) {
      throw new Error(`Username "${trimmedUsername}" is already in use.`);
    }

    let pinHash: string | undefined = undefined;
    if (pin && pin.trim().length > 0) {
      if (pin.trim().length < 4) {
        throw new Error('PIN must be at least 4 digits or characters.');
      }
      pinHash = await hashPin(pin.trim());
    }

    const color = avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].id;
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      username: trimmedUsername,
      email: email?.trim() || undefined,
      avatarColor: color,
      pinHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isDefault: false,
    };

    users.push(newUser);
    this.saveUsers(users);
    localStorage.setItem(STORAGE_ACTIVE_USER_KEY, newUser.id);
    return newUser;
  }

  public async updateUserProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'name' | 'email' | 'avatarColor' | 'avatarIcon'>> & {
      newPin?: string;
      currentPin?: string;
      removePin?: boolean;
    }
  ): Promise<UserProfile> {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User profile not found.');
    }

    const user = users[userIndex];

    // If changing PIN or removing PIN and user has existing PIN, verify current PIN
    if (user.pinHash && (updates.newPin !== undefined || updates.removePin)) {
      if (!updates.currentPin) {
        throw new Error('Current PIN required to make security changes.');
      }
      const hashedCurrent = await hashPin(updates.currentPin);
      if (hashedCurrent !== user.pinHash) {
        throw new Error('Current PIN is incorrect.');
      }
    }

    let pinHash = user.pinHash;
    if (updates.removePin) {
      pinHash = undefined;
    } else if (updates.newPin && updates.newPin.trim().length > 0) {
      if (updates.newPin.trim().length < 4) {
        throw new Error('New PIN must be at least 4 digits.');
      }
      pinHash = await hashPin(updates.newPin.trim());
    }

    const updated: UserProfile = {
      ...user,
      name: updates.name ? updates.name.trim() : user.name,
      email: updates.email !== undefined ? updates.email.trim() || undefined : user.email,
      avatarColor: updates.avatarColor || user.avatarColor,
      avatarIcon: updates.avatarIcon || user.avatarIcon,
      pinHash,
    };

    users[userIndex] = updated;
    this.saveUsers(users);
    return updated;
  }

  public async deleteUser(userId: string): Promise<UserProfile> {
    const users = this.getAllUsers();
    if (users.length <= 1) {
      throw new Error('Cannot delete the only remaining profile. Create another profile first.');
    }

    const filtered = users.filter(u => u.id !== userId);
    this.saveUsers(filtered);

    // If deleted user was active, switch to next available user
    const currentActiveId = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
    let nextActive = filtered[0];
    if (currentActiveId === userId) {
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, nextActive.id);
    } else {
      nextActive = filtered.find(u => u.id === currentActiveId) || filtered[0];
    }
    return nextActive;
  }
}

export const auth = AuthService.getInstance();
