import React, { useState, useEffect } from 'react';
import { auth, AVATAR_COLORS } from '../lib/auth';
import { UserProfile } from '../types';
import { 
  X, 
  User, 
  UserPlus, 
  KeyRound, 
  Lock, 
  Check, 
  AlertCircle, 
  Trash2, 
  LogOut, 
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Users
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChanged: (newUser: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [tab, setTab] = useState<'switch' | 'create' | 'edit'>('switch');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Pin entry state
  const [pinInput, setPinInput] = useState<string>('');
  const [pinPromptUser, setPinPromptUser] = useState<UserProfile | null>(null);

  // Create user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0].id);

  // Edit user form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editCurrentPin, setEditCurrentPin] = useState('');
  const [editNewPin, setEditNewPin] = useState('');
  const [editRemovePin, setEditRemovePin] = useState(false);

  // Feedback messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadUserList = () => {
    const list = auth.getAllUsers();
    setUsers(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadUserList();
      setErrorMsg(null);
      setSuccessMsg(null);
      setPinPromptUser(null);
      setPinInput('');
      setTab('switch');
    }
  }, [isOpen]);

  useEffect(() => {
    if (tab === 'edit') {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email || '');
      setEditColor(currentUser.avatarColor);
      setEditCurrentPin('');
      setEditNewPin('');
      setEditRemovePin(false);
    }
  }, [tab, currentUser]);

  if (!isOpen) return null;

  const handleSelectUser = async (user: UserProfile) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (user.id === currentUser.id) {
      onClose();
      return;
    }

    if (user.pinHash) {
      setPinPromptUser(user);
      setPinInput('');
      return;
    }

    try {
      const switched = await auth.switchUser(user.id);
      onUserChanged(switched);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to switch profile.');
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptUser) return;
    setErrorMsg(null);

    try {
      const switched = await auth.switchUser(pinPromptUser.id, pinInput);
      setPinPromptUser(null);
      setPinInput('');
      onUserChanged(switched);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Incorrect PIN.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const created = await auth.createUser(
        newName,
        newUsername,
        newPin || undefined,
        newEmail || undefined,
        newColor
      );

      // Reset form
      setNewName('');
      setNewUsername('');
      setNewEmail('');
      setNewPin('');

      loadUserList();
      onUserChanged(created);
      setSuccessMsg(`Learner profile "${created.name}" created! Switched automatically.`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create profile.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await auth.updateUserProfile(currentUser.id, {
        name: editName,
        email: editEmail,
        avatarColor: editColor,
        currentPin: editCurrentPin || undefined,
        newPin: editNewPin || undefined,
        removePin: editRemovePin,
      });

      loadUserList();
      onUserChanged(updated);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => {
        setTab('switch');
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setErrorMsg(null);
    try {
      const nextActive = await auth.deleteUser(userId);
      setIsDeleting(null);
      loadUserList();
      if (userId === currentUser.id) {
        onUserChanged(nextActive);
      }
      setSuccessMsg('Profile deleted.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete profile.');
    }
  };

  const getColorMeta = (colorId: string) => {
    return AVATAR_COLORS.find(c => c.id === colorId) || AVATAR_COLORS[0];
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/45 dark:bg-black/65 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#faf8f4] dark:bg-[#242321] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1e1d1c]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-medium text-stone-900 dark:text-stone-100">
                Learner Profiles & Progress
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Isolated progress, notes, and review decks for individual learners
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-[#191817] px-6 text-xs">
          <button
            onClick={() => { setTab('switch'); setPinPromptUser(null); setErrorMsg(null); }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              tab === 'switch'
                ? 'border-amber-700 dark:border-amber-400 text-stone-900 dark:text-stone-100'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Learner Profiles ({users.length})
          </button>

          <button
            onClick={() => { setTab('create'); setPinPromptUser(null); setErrorMsg(null); }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              tab === 'create'
                ? 'border-amber-700 dark:border-amber-400 text-stone-900 dark:text-stone-100'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            + Add New Learner
          </button>

          <button
            onClick={() => { setTab('edit'); setPinPromptUser(null); setErrorMsg(null); }}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              tab === 'edit'
                ? 'border-amber-700 dark:border-amber-400 text-stone-900 dark:text-stone-100'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Edit Active Profile
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-600 dark:text-stone-300">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Profile List & Switcher */}
          {tab === 'switch' && !pinPromptUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
                  Select an account to study
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  Active: <strong className="text-amber-800 dark:text-amber-400">{currentUser.name}</strong>
                </span>
              </div>

              <div className="space-y-2.5">
                {users.map(u => {
                  const isActive = u.id === currentUser.id;
                  const colorMeta = getColorMeta(u.avatarColor);

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-400 dark:border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-[#1f1e1c] border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => handleSelectUser(u)}
                      >
                        <div 
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0 ${colorMeta.bg}`}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-medium text-sm text-stone-900 dark:text-stone-100 truncate">
                              {u.name}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                Current
                              </span>
                            )}
                            {u.pinHash && (
                              <span title="PIN Protected">
                                <Lock className="w-3 h-3 text-stone-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono truncate">
                            @{u.username} • {u.email ? u.email : 'Local profile'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive ? (
                          <button
                            onClick={() => handleSelectUser(u)}
                            className="px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Switch
                          </button>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}

                        {users.length > 1 && !isActive && (
                          <div>
                            {isDeleting === u.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-2 py-1 text-[10px] bg-rose-600 text-white rounded font-mono"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setIsDeleting(null)}
                                  className="px-2 py-1 text-[10px] bg-stone-200 dark:bg-stone-700 rounded font-mono"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setIsDeleting(u.id)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Delete profile and its data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center text-xs">
                <button
                  onClick={() => setTab('create')}
                  className="text-amber-800 dark:text-amber-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create new learner profile</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* PIN Prompt Screen */}
          {tab === 'switch' && pinPromptUser && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setPinPromptUser(null); setErrorMsg(null); }}
                  className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-stone-900 dark:text-stone-100">
                  Enter PIN for {pinPromptUser.name}
                </span>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                This learner profile is PIN-protected for privacy. Enter the 4+ digit PIN to switch to this account.
              </p>

              <div>
                <label className="block text-[11px] font-mono text-stone-500 dark:text-stone-400 mb-1">
                  Profile PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    placeholder="••••"
                    maxLength={16}
                    className="w-full px-3.5 py-2.5 pl-9 rounded-lg bg-white dark:bg-[#191817] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono tracking-widest text-sm focus:outline-hidden focus:border-amber-600"
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium text-xs transition-colors cursor-pointer"
                >
                  Unlock & Switch Profile
                </button>
                <button
                  type="button"
                  onClick={() => { setPinPromptUser(null); setErrorMsg(null); }}
                  className="px-4 py-2 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Create New Profile */}
          {tab === 'create' && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Full Name / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#191817] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Username (Identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="e.g. alex_r"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#191817] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Email (Optional, for online synchronization)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#191817] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Profile Badge Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewColor(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                        newColor === c.id ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-100 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {newColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 mb-1">
                  PIN Protection (Optional, 4+ digits)
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Leave empty for instant access without PIN"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#191817] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium text-xs transition-colors cursor-pointer"
                >
                  Create & Activate Profile
                </button>
                <button
                  type="button"
                  onClick={() => setTab('switch')}
                  className="px-4 py-2 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Edit Active Profile */}
          {tab === 'edit' && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#191817] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#191817] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Avatar Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setEditColor(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                        editColor === c.id ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-100 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {editColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security / PIN Section */}
              <div className="p-3.5 rounded-xl bg-stone-100/60 dark:bg-[#191817] border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                    <span className="font-medium text-stone-800 dark:text-stone-200">Security & PIN</span>
                  </div>
                  {currentUser.pinHash ? (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">PIN Enabled</span>
                  ) : (
                    <span className="text-[10px] font-mono text-stone-400">No PIN</span>
                  )}
                </div>

                {currentUser.pinHash && (
                  <div>
                    <label className="block text-[11px] font-mono text-stone-500 dark:text-stone-400 mb-1">
                      Current PIN *
                    </label>
                    <input
                      type="password"
                      value={editCurrentPin}
                      onChange={e => setEditCurrentPin(e.target.value)}
                      placeholder="Required to modify PIN"
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#242321] border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-stone-500 dark:text-stone-400 mb-1">
                    {currentUser.pinHash ? 'New PIN (Leave blank to keep unchanged)' : 'Set a New PIN (4+ digits)'}
                  </label>
                  <input
                    type="password"
                    value={editNewPin}
                    disabled={editRemovePin}
                    onChange={e => setEditNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#242321] border border-stone-300 dark:border-stone-700 text-xs disabled:opacity-50"
                  />
                </div>

                {currentUser.pinHash && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={editRemovePin}
                      onChange={e => setEditRemovePin(e.target.checked)}
                      className="rounded border-stone-400 text-amber-700 focus:ring-amber-600"
                    />
                    <span className="text-stone-600 dark:text-stone-300 text-[11px]">
                      Remove PIN protection from this profile
                    </span>
                  </label>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium text-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setTab('switch')}
                  className="px-4 py-2 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
