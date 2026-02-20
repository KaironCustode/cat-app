'use client';

import { useState, useEffect, useRef } from 'react';
import { generateContextDocument, appendAiNotes, appendDailySummary } from '@/lib/spark-storage';
import { extractInsights, cleanResponse } from '@/lib/spark-ai';
import {
  loadMemory,
  saveMemory,
  createConversation,
  addMessage,
  getCurrentConversation,
  updateConversation,
} from '@/lib/memory';
import { Message } from '@/lib/types';

function renderMessage(text: string) {
  // Split on fenced code blocks: ```lang\n...\n```
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const codeMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (codeMatch) {
      return (
        <pre key={i} style={{
          background: '#0a0a0a',
          borderRadius: '8px',
          padding: '14px 16px',
          margin: '8px 0',
          overflowX: 'auto',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <code style={{
            color: '#e2e8f0',
            fontSize: '13px',
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            lineHeight: '1.6',
            whiteSpace: 'pre',
          }}>
            {codeMatch[2]}
          </code>
        </pre>
      );
    }
    // For non-code parts, handle inline code and bold
    return <span key={i}>{renderInline(part)}</span>;
  });
}

function renderInline(text: string) {
  // Handle inline `code` and **bold**
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '13px',
          fontFamily: "'Fira Code', monospace",
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--accent-primary)' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function SparkChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarized, setSummarized] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const memory = loadMemory();
    const conv = getCurrentConversation(memory);
    setMessages(conv.messages);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = () => setAttachedImage(null);

  const sendMessage = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      imageUrl: attachedImage || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const contextDocument = generateContextDocument();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content, imageUrl: m.imageUrl })),
          contextDocument,
          mode: 'chat',
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const rawResponse = data.response;
      const insights = extractInsights(rawResponse);
      const cleanedResponse = cleanResponse(rawResponse);

      // Save insights to profile
      for (const insight of insights) {
        appendAiNotes(insight);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: cleanedResponse,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Save to memory
      const memory = loadMemory();
      let conv = getCurrentConversation(memory);
      conv = addMessage(conv, userMessage);
      conv = addMessage(conv, assistantMessage);
      const updatedMemory = updateConversation(memory, conv);
      saveMemory(updatedMemory);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Connection issue. Your data is safe locally. Try again in a moment.',
        timestamp: Date.now(),
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const memory = loadMemory();
    const newConv = createConversation();
    const updatedMemory = updateConversation(memory, newConv);
    saveMemory(updatedMemory);
    setMessages([]);
  };

  const handleSummarize = async () => {
    if (messages.length < 2 || isSummarizing) return;
    setIsSummarizing(true);

    try {
      const contextDocument = generateContextDocument();
      const transcript = messages.map(m => `${m.role === 'user' ? 'User' : 'SPARK'}: ${m.content}`).join('\n\n');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Summarize this session.' }],
          contextDocument: contextDocument + '\n\nCHAT_TRANSCRIPT:\n' + transcript,
          mode: 'summary',
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      appendDailySummary(cleanResponse(data.response));
      setSummarized(true);
      setTimeout(() => setSummarized(false), 3000);
    } catch (err) {
      console.error('Summary error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600 }}>
          <span className="text-gradient">SPARK</span>
        </h1>
        <div style={{ display: 'flex', gap: '4px' }}>
          {messages.length >= 2 && (
            <button
              className="btn-ghost"
              onClick={handleSummarize}
              disabled={isSummarizing || summarized}
              style={{
                fontSize: '13px',
                color: summarized ? 'var(--success)' : isSummarizing ? 'var(--text-muted)' : 'var(--accent-primary)',
              }}
            >
              {summarized ? 'Saved!' : isSummarizing ? 'Summarizing...' : 'Summarize'}
            </button>
          )}
          <button className="btn-ghost" onClick={handleNewConversation} style={{ fontSize: '13px' }}>
            New chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', marginBottom: '8px' }}>
              Talk to me. I remember your journey.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Ask anything, share how you&apos;re feeling, or just vent.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user'
                  ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                  : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                background: msg.role === 'user' ? 'var(--accent-light)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '15px',
                lineHeight: '1.6',
              }}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Attached"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '240px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: msg.content ? '8px' : 0,
                    objectFit: 'contain',
                  }}
                />
              )}
              {msg.content && <div>{renderMessage(msg.content)}</div>}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
              background: 'var(--bg-card)',
            }}>
              <span className="animate-pulse-soft" style={{ color: 'var(--text-tertiary)' }}>...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {attachedImage && (
        <div style={{
          padding: '8px 20px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative', display: 'inline-block' }}>
            <img
              src={attachedImage}
              alt="Preview"
              style={{
                maxHeight: '120px',
                maxWidth: '160px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
              }}
            />
            <button
              onClick={removeAttachment}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--error)',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                lineHeight: '22px',
                textAlign: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px 20px',
        borderTop: attachedImage ? 'none' : '1px solid rgba(255,255,255,0.06)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '480px', margin: '0 auto', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            style={{
              padding: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: attachedImage ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              fontSize: '20px',
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Attach image"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedImage ? "Add a caption..." : "Type here..."}
            rows={1}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'var(--bg-card)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !attachedImage) || isLoading}
            className="btn-primary"
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-lg)' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
