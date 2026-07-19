import React, { useState } from 'react';
import { Mail, Send, X, Loader2 } from 'lucide-react';

interface AskAuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskAuthorModal: React.FC<AskAuthorModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !reason) return;

    setStatus('loading');
    
    // Simulate a network request to the author's server
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setEmail('');
        setReason('');
      }, 2500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1b26] border border-white/10 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Mail size={16} /> Request Authority
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {status === 'success' ? (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 p-4 rounded text-center border border-emerald-500/20">
              Request sent successfully! The author will review it shortly.
            </div>
          ) : (
            <>
              <div className="text-xs text-white/60 mb-2">
                Send a request to the author to get higher privileges or access to restricted features.
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/70">Your Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#12141a] text-white text-sm border border-white/10 rounded px-3 py-2 outline-none focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-white/70">Reason for Request</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need access or authority..."
                  className="w-full bg-[#12141a] text-white text-sm border border-white/10 rounded px-3 py-2 outline-none focus:border-indigo-500 h-24 resize-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Request
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
