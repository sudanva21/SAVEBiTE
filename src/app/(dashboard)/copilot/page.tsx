'use client';

// ==============================================
// SaveByte — AI Copilot Interface (Tactile Design)
// ==============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { askCopilotAction } from '@/app/actions/aiActions';
import styles from '../operations.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  groundedFacts?: string[];
  provider?: 'groq' | 'deterministic_baseline';
  fallbackUsed?: boolean;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  'What food needs attention right now?',
  'Why is our surplus risk high?',
  'Show today\'s recovery status.',
  'Which deliveries are active?',
  'What are our biggest waste categories?',
  'What should we produce tomorrow?',
];

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to **SAVEBiET AI Copilot**! I am your real-time operational intelligence assistant grounded strictly in your kitchen inventory, surplus listings, recovery transactions, and logistics routes.\n\nAsk me anything about your current shift, urgent food, or waste diagnostics below.',
      groundedFacts: ['Grounded in live database entities', 'Zero-cost Groq inference active'],
      provider: 'groq',
      fallbackUsed: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (questionText?: string) => {
    const query = (questionText || input).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const historyPayload = messages.slice(1).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askCopilotAction(query, historyPayload);
      if (res.success && res.data) {
        const assistantMessage: Message = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: res.data.answer,
          groundedFacts: res.data.groundedFacts,
          provider: res.data.provider,
          fallbackUsed: res.data.fallbackUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(res.error || 'Failed to receive response from Copilot');
      }
    } catch {
      setError('Connection interrupted while reaching AI intelligence service');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          '👋 Chat session reset. What operational question can I answer for your organization?',
        groundedFacts: ['Session refreshed'],
        provider: 'groq',
        fallbackUsed: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(27, 67, 50, 0.2)',
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                SAVEBiET AI Copilot
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0.15rem 0 0' }}>
                Conversational operational intelligence grounded strictly in your live kitchen & logistics data.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
            }}
          >
            <Zap size={14} />
            Groq · openai/gpt-oss-120b
          </span>

          <button
            onClick={handleResetChat}
            title="Reset conversation"
            style={{
              padding: '0.4rem',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B7280', marginBottom: '0.5rem' }}>
          Suggested Operational Inquiries
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#1B4332',
                border: '1px solid #D1D5DB',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#1B4332')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
            >
              {prompt}
              <ArrowRight size={12} style={{ opacity: 0.6 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: msg.role === 'user' ? '#1B4332' : '#FFFFFF',
                border: msg.role === 'user' ? 'none' : '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: msg.role === 'user' ? '#FFFFFF' : '#1B4332',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '80%' }}>
              <div
                style={{
                  padding: '0.85rem 1.15rem',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? '#1B4332' : '#FFFFFF',
                  color: msg.role === 'user' ? '#FFFFFF' : '#111827',
                  border: msg.role === 'user' ? 'none' : '1px solid #E5E7EB',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  fontSize: '0.925rem',
                  lineHeight: '1.55',
                  whiteSpace: 'pre-line',
                }}
              >
                {msg.content}
              </div>

              {/* Grounded Facts / Metadata Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.35rem',
                  flexWrap: 'wrap',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{msg.timestamp}</span>

                {msg.role === 'assistant' && msg.fallbackUsed && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#B45309',
                      background: '#FEF3C7',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    Analytical Baseline Fallback
                  </span>
                )}

                {msg.role === 'assistant' && msg.groundedFacts && msg.groundedFacts.map((fact, fIdx) => (
                  <span
                    key={fIdx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.7rem',
                      color: '#065F46',
                      background: '#ECFDF5',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                      border: '1px solid #D1FAE5',
                    }}
                  >
                    <CheckCircle2 size={11} />
                    {fact}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1B4332',
              }}
            >
              <Bot size={16} />
            </div>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '16px 16px 16px 4px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#6B7280',
              }}
            >
              <Clock size={16} className="animate-spin" />
              Scanning operational databases and generating response...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: '#FEE2E2',
              border: '1px solid #F87171',
              color: '#B91C1C',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div style={{ marginTop: '1rem' }}>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#FFFFFF',
            border: '2px solid #1B4332',
            borderRadius: '14px',
            padding: '0.4rem 0.5rem 0.4rem 1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot about food batches, surplus risks, active deliveries..."
            disabled={loading}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              background: 'transparent',
              color: '#111827',
            }}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              background: input.trim() && !loading ? '#1B4332' : '#9CA3AF',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'background 0.15s ease',
            }}
          >
            Send
            <Send size={15} />
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.4rem',
            fontSize: '0.75rem',
            color: '#9CA3AF',
            padding: '0 0.25rem',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={13} color="#059669" />
            Tenant Isolated · Grounded in SaveByte Ledger & Routes
          </span>
          <span>Zero-Cost Inference Powered by Groq</span>
        </div>
      </div>
    </div>
  );
}
