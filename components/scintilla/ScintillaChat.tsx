'use client';

import { useState, useEffect, useRef } from 'react';
import { generateScintillaContext } from '@/lib/scintilla-storage';

const AMBER = '#F59E0B';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function renderText(text: string) {
  // Handle **bold** inline
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} style={{ color: AMBER }}>{p.slice(2, -2)}</strong>;
    }
    return p;
  });
}

export default function ScintillaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const context = generateScintillaContext();
      const res = await fetch('/api/scintilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          contextDocument: context,
          mode: 'chat',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };
      setMessages([...updatedMessages, assistantMsg]);
    } catch {
      const errMsg: Message = {
        role: 'assistant',
        content: 'Problema di connessione. Riprova tra un momento.',
        timestamp: Date.now(),
      };
      setMessages([...updatedMessages, errMsg]);
    } finally {
      setIsLoading(false);
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
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '20px' }}>✦</span>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: AMBER }}>
          Scintilla
        </h1>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '16px', marginBottom: '8px' }}>
              Sono qui. Cosa vuoi dirmi?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Puoi parlarmi di come ti senti, di una voglia, di qualsiasi cosa.
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
            <div style={{
              maxWidth: '85%',
              padding: '14px 18px',
              borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'rgba(245,158,11,0.15)'
                : 'var(--bg-card)',
              fontSize: '16px',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
              border: msg.role === 'user'
                ? `1px solid rgba(245,158,11,0.3)`
                : '1px solid rgba(255,255,255,0.05)',
            }}>
              {renderText(msg.content)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              padding: '14px 18px',
              borderRadius: '18px 18px 18px 4px',
              background: 'var(--bg-card)',
            }}>
              <span className="animate-pulse-soft" style={{ color: 'var(--text-tertiary)' }}>...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          maxWidth: '480px',
          margin: '0 auto',
          alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi qui..."
            rows={1}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: 'var(--bg-card)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '14px 20px',
              borderRadius: '14px',
              background: input.trim() && !isLoading ? AMBER : 'var(--bg-card)',
              color: input.trim() && !isLoading ? '#0B1120' : 'var(--text-muted)',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              flexShrink: 0,
            }}
          >
            Invia
          </button>
        </div>
      </div>
    </div>
  );
}
