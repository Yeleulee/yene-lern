import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send,
    Plus,
    PanelLeftClose,
    PanelLeftOpen,
    AlertCircle,
    Sparkles,
    MessageSquare,
    ChevronRight,
    Info,
    ExternalLink,
    ShieldCheck,
    BookOpen,
    Zap
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

/* ——— Markdown-like renderer ——— */
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            const codeParts = part.split(/(`[^`]+`)/g);
            return codeParts.map((cp, j) => {
                if (cp.startsWith('`') && cp.endsWith('`')) {
                    return <code key={`${i}-${j}`} className="px-1.5 py-0.5 bg-gray-100 rounded text-[13px] font-mono text-indigo-600 font-medium">{cp.slice(1, -1)}</code>;
                }
                return <span key={`${i}-${j}`}>{cp}</span>;
            });
        });
    };

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
        if (line.trim() === '') {
            elements.push(<div key={`br-${idx}`} className="h-4" />);
            return;
        }

        if (line.startsWith('### ')) {
            elements.push(<h4 key={idx} className="text-base font-bold text-gray-900 mt-6 mb-2">{line.slice(4)}</h4>);
        } else if (line.startsWith('## ')) {
            elements.push(<h3 key={idx} className="text-lg font-bold text-gray-900 mt-7 mb-3">{line.slice(3)}</h3>);
        } else if (line.startsWith('# ')) {
            elements.push(<h2 key={idx} className="text-xl font-bold text-gray-900 mt-8 mb-4">{line.slice(2)}</h2>);
        } else if (line.match(/^[\-\*]\s/)) {
            elements.push(
                <div key={idx} className="flex gap-3 mb-2 ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    <div className="text-gray-700 leading-relaxed">{renderInline(line.slice(2))}</div>
                </div>
            );
        } else if (line.match(/^\d+\.\s/)) {
            const match = line.match(/^(\d+)\.\s(.+)/);
            if (match) {
                elements.push(
                    <div key={idx} className="flex gap-3 mb-2 ml-1">
                        <span className="font-bold text-indigo-600 min-w-[1.2rem]">{match[1]}.</span>
                        <div className="text-gray-700 leading-relaxed">{renderInline(match[2])}</div>
                    </div>
                );
            }
        } else {
            elements.push(<p key={idx} className="text-gray-700 leading-relaxed mb-3">{renderInline(line)}</p>);
        }
    });

    return <div className="chat-markdown">{elements}</div>;
};

const AIChatPage: React.FC = () => {
    const { user } = useAuth();
    const { messages, isLoading, sendMessage, clearChat, connectionStatus } = useChat();
    const [input, setInput] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

    // Initial check for API Key placeholder status
    useEffect(() => {
        // OpenRouter key check logic
        const key = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!key || key.includes('your_') || key === '') {
            setIsApiKeyMissing(true);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const msg = input;
        setInput('');
        await sendMessage(msg);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const suggestions = [
        "Explain Quantum Computing in simple terms",
        "Create a 7-day plan to learn React basics",
        "Explain the concept of Blockchains",
        "What are the best practices for SEO in 2024?"
    ];

    return (
        <div className="flex h-[calc(100vh-73px)] bg-[#f9fafb] overflow-hidden">
            {/* Sidebar Context */}
            <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col group overflow-hidden`}>
                <div className="w-80 flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            Learning AI
                        </h2>
                        <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                            <PanelLeftClose size={18} />
                        </button>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                        <button
                            onClick={() => clearChat()}
                            className="w-full mb-6 flex items-center justify-center gap-2 bg-[#1a1a1b] hover:bg-black text-white py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
                        >
                            <Plus size={18} />
                            New Discussion
                        </button>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">History</h3>
                            <div className="space-y-1">
                                {messages.length <= 1 ? (
                                    <p className="text-sm text-gray-400 px-2 italic">Start a conversation to see history</p>
                                ) : (
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                                        <MessageSquare size={16} className="text-indigo-600 mt-0.5" />
                                        <span className="text-sm font-medium text-indigo-900 truncate">Current Session</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'} animate-pulse`} />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                System: {connectionStatus === 'connected' ? 'Ready' : 'Missing API Key'}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Collapsed Sidebar Trigger */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute left-6 top-6 z-10 p-3 bg-white border border-gray-200 rounded-xl shadow-lg hover:bg-gray-50 transition-all"
                    >
                        <PanelLeftOpen size={20} className="text-gray-600" />
                    </button>
                )}

                {/* API Key Warning Bar */}
                {isApiKeyMissing && (
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-center gap-3 animate-slide-down">
                        <AlertCircle className="text-amber-600" size={18} />
                        <p className="text-sm text-amber-800 font-medium leading-none">
                            <span className="font-bold">Setup Required:</span> Add your <code className="bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">VITE_OPENROUTER_API_KEY</code> to the <code className="font-bold">.env</code> file to enable AI Chat.
                        </p>
                        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-amber-900 underline ml-2">
                            Get Key <ExternalLink size={12} />
                        </a>
                    </div>
                )}

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-6 py-10">
                    <div className="max-w-3xl mx-auto w-full space-y-8">
                        {messages.length <= 1 && (
                            <div className="text-center py-12 animate-fade-in">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-600 rounded-3xl shadow-xl mb-8 transform hover:rotate-6 transition-transform">
                                    <Sparkles size={48} className="text-white fill-white/20" />
                                </div>
                                <h1 className="text-4xl font-black text-gray-900 mb-4">How can I help you learn today?</h1>
                                <p className="text-gray-500 max-w-md mx-auto mb-12 text-lg">
                                    Ask me anything about your courses, complex topics, or request a personalized study plan.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(s)}
                                            className="p-5 bg-white border border-gray-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-900">{s}</p>
                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message, idx) => (
                            <div key={idx} className={`flex items-start gap-5 ${message.sender === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in duration-500`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${message.sender === 'user'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-indigo-600 text-white shadow-indigo-200'
                                    }`}>
                                    {message.sender === 'user' ? <BookOpen size={20} /> : <Zap size={20} className="fill-white/20" />}
                                </div>

                                <div className={`flex flex-col max-w-[85%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-6 rounded-2xl shadow-sm border ${message.sender === 'user'
                                        ? 'bg-white border-gray-100 rounded-tr-none'
                                        : 'bg-white border-indigo-50 rounded-tl-none'
                                        }`}>
                                        <FormattedContent content={message.content} />
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                        {message.sender === 'ai' ? 'Yene Assistant' : 'You'} • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-start gap-5 animate-pulse">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                    <Sparkles size={18} className="text-indigo-300" />
                                </div>
                                <div className="bg-white border border-indigo-50 p-6 rounded-2xl rounded-tl-none shadow-sm min-w-[12rem]">
                                    <div className="flex gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Workspace */}
                <div className="px-6 pb-10">
                    <div className="max-w-3xl mx-auto w-full relative">
                        <div className="bg-white border border-gray-200 rounded-3xl p-2 shadow-2xl shadow-gray-200/50 flex flex-col focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all overflow-hidden group">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-transparent border-none focus:ring-0 p-4 min-h-[50px] max-h-48 text-gray-800 placeholder-gray-400 text-base font-medium resize-none custom-scrollbar"
                                placeholder="Ask your learning question here..."
                            />

                            <div className="flex items-center justify-between border-t border-gray-50 px-4 py-2 bg-gray-50/50">
                                <div className="flex items-center gap-4 text-gray-400">
                                    <div className="flex items-center gap-1.5 hover:text-gray-600 transition-colors cursor-help group/tip relative">
                                        <ShieldCheck size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Privacy Ensured</span>
                                    </div>
                                    <span className="w-px h-3 bg-gray-200" />
                                    <div className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                                        <Info size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Shift+Enter for break</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isLoading}
                                    className="flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-90"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIChatPage;
