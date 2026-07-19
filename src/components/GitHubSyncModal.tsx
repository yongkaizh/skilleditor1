import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud as Github,  Download, Upload, X, Loader2  } from 'lucide-react';
import type { SkillFile } from './FileExplorer';
import { v4 as uuidv4 } from 'uuid';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: SkillFile[];
  onFilesChange: (files: SkillFile[]) => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen, onClose, files, onFilesChange
}) => {
  const [token, setToken] = useState(localStorage.getItem('github_token') || '');
  const [repo, setRepo] = useState(localStorage.getItem('github_repo') || ''); // e.g. owner/repo
  const [branch, setBranch] = useState(localStorage.getItem('github_branch') || 'main');
  const [commitMessage, setCommitMessage] = useState('Update SKILL files via IDE Sync');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });


  const saveSettings = () => {
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_repo', repo);
    localStorage.setItem('github_branch', branch);
  };

  const getHeaders = () => ({
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28'
  });

  const handlePull = async () => {
    if (!token || !repo) {
      setStatus({ type: 'error', message: 'Token and Repository are required.' });
      return;
    }
    saveSettings();
    setStatus({ type: 'loading', message: 'Pulling from GitHub...' });
    
    try {
      // 1. Get the latest commit on the branch
      let res = await fetch(`https://api.github.com/repos/${repo}/branches/${branch}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch branch. Check repo and token.');
      let data = await res.json();
      const commitSha = data.commit.sha;

      // 2. Get the tree
      res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commitSha}?recursive=1`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch repository tree.');
      data = await res.json();
      
      const tree = data.tree;
      const newFiles: SkillFile[] = [];
      
      // Filter for files we care about, maybe .il, .skill, .txt
      const targetFiles = tree.filter((item: any) => item.type === 'blob' && (item.path.endsWith('.il') || item.path.endsWith('.skill') || item.path.endsWith('.txt') || item.path.endsWith('.cdn')));

      for (const item of targetFiles) {
        const fileRes = await fetch(item.url, { headers: getHeaders() });
        const fileData = await fileRes.json();
        // GitHub sends content in base64
        const content = decodeURIComponent(escape(window.atob(fileData.content)));
        
        // Extract filename from path
        const pathParts = item.path.split('/');
        const name = pathParts[pathParts.length - 1];

        newFiles.push({
          id: uuidv4(),
          name: name, // We just flatten them to the root for this simple IDE
          content
        });
      }

      if (newFiles.length > 0) {
        onFilesChange(newFiles);
        setStatus({ type: 'success', message: `Successfully pulled ${newFiles.length} files.` });
      } else {
        setStatus({ type: 'success', message: 'No SKILL files found in repository.' });
      }

    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const handlePush = async () => {
    if (!token || !repo) {
      setStatus({ type: 'error', message: 'Token and Repository are required.' });
      return;
    }
    saveSettings();
    setStatus({ type: 'loading', message: 'Pushing to GitHub...' });
    
    try {
      // Very simple push using the Trees API
      // 1. Get branch ref
      let res = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch branch ref.');
      let data = await res.json();
      const commitSha = data.object.sha;

      // 2. Get commit
      res = await fetch(`https://api.github.com/repos/${repo}/git/commits/${commitSha}`, { headers: getHeaders() });
      let commitData = await res.json();
      const baseTreeSha = commitData.tree.sha;

      // 3. Create blobs and tree items
      const treeItems = [];
      for (const file of files) {
        const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
          method: 'POST',
          headers: { ...getHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: unescape(encodeURIComponent(file.content)), // encode utf8 to base64 safely
            encoding: 'utf-8'
          })
        });
        const blobData = await blobRes.json();
        treeItems.push({
          path: file.name,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        });
      }

      // 4. Create new tree
      const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      });
      const newTreeData = await treeRes.json();

      // 5. Create commit
      const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMessage || 'Update SKILL files via IDE Sync',
          tree: newTreeData.sha,
          parents: [commitSha]
        })
      });
      const newCommitData = await newCommitRes.json();

      // 6. Update ref
      const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: false
        })
      });

      if (!updateRefRes.ok) throw new Error('Failed to update branch ref (maybe there is a conflict).');

      setStatus({ type: 'success', message: 'Successfully pushed files to GitHub.' });

    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#1a1b26] border border-white/10 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Github size={16} /> GitHub Synchronization
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-white/70">Personal Access Token (Classic/Fine-grained)</label>
            <input 
              type="password" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-[#12141a] text-white text-sm border border-white/10 rounded px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-white/70">Repository (owner/repo)</label>
            <input 
              type="text" 
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="username/skill-scripts"
              className="w-full bg-[#12141a] text-white text-sm border border-white/10 rounded px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/70">Branch</label>
            <input 
              type="text" 
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-[#12141a] text-white text-sm border border-white/10 rounded px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/70">Commit Message</label>
            <input 
              type="text" 
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Update SKILL files"
              className="w-full bg-[#12141a] text-white text-sm border border-white/10 rounded px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          {status.message && (
            <div className={`text-xs p-3 rounded flex items-center gap-2 ${
              status.type === 'error' ? 'bg-red-500/20 text-red-300' : 
              status.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 
              'bg-indigo-500/20 text-indigo-300'
            }`}>
              {status.type === 'loading' && <Loader2 size={14} className="animate-spin" />}
              {status.message}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button 
              onClick={handlePull}
              disabled={status.type === 'loading'}
              title="Fetch remote files and overwrite local workspace"
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-white text-xs py-2 rounded transition-colors disabled:opacity-50"
            >
              <Download size={14} /> Clone / Pull
            </button>
            <button 
              onClick={handlePush}
              disabled={status.type === 'loading'}
              title="Commit and push local files to remote branch"
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded transition-colors disabled:opacity-50"
            >
              <Upload size={14} /> Commit & Push
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
