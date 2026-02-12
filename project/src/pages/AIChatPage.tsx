import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plus, Clock, Trash2, BookOpen, Save, CheckCheck, RefreshCw, Copy, Check, ThumbsUp, ThumbsDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { getSavedLearningPlanIds, saveLearningPlanId } from '../services/learningPlanService';
import logoImg from '../assets/logo.png';

/* â”€â”€â”€ Markdown-like renderer (no deps) â”€â”€â”€ */
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
    const renderLine = (line: string, idx: number) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            // Inline code: `code`
            const codeParts = part.split(/(`[^`]+`)/g);
            return codeParts.map((cp, j) => {
                if (cp.startsWith('`') && cp.endsWith('`')) {
                    return <code key={`${i}-${j}`} className="px-1.5 py-0.5 bg-gray-100 rounded text-[13px] font-mono text-gray-800">{cp.slice(1, -1)}</code>;
                }
                return <span key={`${i}-${j}`}>{cp}</span>;
            });
        });

        // Heading: lines starting with ### ## #
        if (line.startsWith('### ')) {
            return <h4 key={idx} className="text-sm font-bold text-gray-900 mt-4 mb-1.5">{line.slice(4)}</h4>;
        }
        if (line.startsWith('## ')) {
            return <h3 key={idx} className="text-base font-bold text-gray-900 mt-4 mb-2">{line.slice(3)}</h3>;
        }
        if (line.startsWith('# ')) {
            return <h2 key={idx} className="text-lg font-bold text-gray-900 mt-4 mb-2">{line.slice(2)}</h2>;
        }

        // Numbered list
        const numMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
            return (
                <div key={idx} className="flex gap-2.5 mb-1.5 ml-1">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {numMatch[1]}
                    </span>
                    <span className="flex-1">{renderInline(numMatch[2])}</span>
                </div>
            );
        }

        // Bullet list: - or *
        if (line.match(/^[\-\*]\s/)) {
            return (
                <div key={idx} className="flex gap-2 mb-1 ml-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></span>
                    <span className="flex-1">{renderInline(line.slice(2))}</span>
                </div>
            );
        }

        // Empty line â†’ spacer
        if (line.trim() === '') {
            return <div key={idx} className="h-2" />;
        }

        // Regular paragraph
        return <p key={idx} className="mb-1">{rendered}</p>;
    };

    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            const codeParts = part.split(/(`[^`]+`)/g);
            return codeParts.map((cp, j) => {
                if (cp.startsWith('`') && cp.endsWith('`')) {
                    return <code key={`${i}-${j}`} className="px-1.5 py-0.5 bg-gray-100 rounded text-[13px] font-mono text-gray-800">{cp.slice(1, -1)}</code>;
                }
                return <span key={`${i}-${j}`}>{cp}</span>;
            });
        });
    };

    const lines = content.split('\n');

    // Detect code blocks (``` ... ```)
    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
        if (lines[i].startsWith('```')) {
            const lang = lines[i].slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            elements.push(
                <div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden border border-gray-200">
                    {lang && <div className="px-4 py-1.5 bg-gray-100 text-xs text-gray-500 font-mono border-b border-gray-200">{lang}</div>}
                    <pre className="p-4 bg-gray-50 overflow-x-auto text-[13px] leading-relaxed font-mono text-gray-800">
                        {codeLines.join('\n')}
                    </pre>
                </div>
            );
        } else {
            elements.push(renderLine(lines[i], i));
            i++;
        }
    }

    return <div className="text-sm text-gray-700 leading-relaxed">{elements}</div>;
};

/* â”€â”€â”€ Interactive AI message wrapper â”€â”€â”€ */
const AIMessageActions: React.FC<{ content: string; messageId: string }> = ({ content, messageId }) => {
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState<'up' | 'down' | null>(null);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy"
            >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
            <button
                onClick={() => setLiked(liked === 'up' ? null : 'up')}
                className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${liked === 'up' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                title="Good response"
            >
                <ThumbsUp size={14} />
            </button>
            <button
                onClick={() => setLiked(liked === 'down' ? null : 'down')}
                className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${liked === 'down' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                title="Bad response"
            >
                <ThumbsDown size={14} />
            </button>
        </div>
    );
};

/* â”€â”€â”€ Main Chat Page â”€â”€â”€ */
const AIChatPage: React.FC = () => {
    const { user } = useAuth();
    const { messages, isLoading, sendMessage, clearChat } = useChat();
    const [input, setInput] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [savedPlans, setSavedPlans] = useState<Set<string>>(new Set());
    const [charCount, setCharCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const MAX_CHARS = 1000;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const suggestedPrompts = [
        { text: "Make me a study plan for web dev", icon: "📋" },
        { text: "Explain machine learning simply", icon: "🎓" },
        { text: "Summarize this topic briefly", icon: "📝" },
        { text: "How does blockchain work?", icon: "⚙️" },
    ];

    useEffect(() => {
        setSavedPlans(new Set(getSavedLearningPlanIds()));
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Auto-resize textarea
    const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_CHARS) {
            setInput(value);
            setCharCount(value.length);
            autoResize(e.target);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const message = input;
        setInput('');
        setCharCount(0);
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }
        await sendMessage(message);
    };

    const handlePromptClick = async (prompt: string) => {
        setInput('');
        setCharCount(0);
        await sendMessage(prompt);
    };

    const handleClearChat = () => {
        if (window.confirm('Clear all chat history?')) clearChat();
    };

    const saveLearningPlan = (messageId: string) => {
        saveLearningPlanId(messageId);
        const next = new Set(savedPlans);
        next.add(messageId);
        setSavedPlans(next);
    };

    const [refreshKey, setRefreshKey] = useState(0);

    const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Learner';
    const hasConversation = messages.length > 1;

    return (
        <div className="flex h-[calc(100vh-73px)] bg-gray-50 overflow-hidden">
            {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div
                className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0 overflow-hidden`}
            >
                {/* Sidebar content wrapper */}
                <div className="w-72 h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src={logoImg} alt="Yene Learn" className="w-8 h-8 object-contain" />
                            <span className="font-semibold text-gray-800 text-sm">Yene Learn AI</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                            title="Collapse sidebar"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    </div>

                    {/* New Chat Button */}
                    <div className="p-3">
                        <button
                            onClick={() => clearChat()}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-black transition-all duration-200 font-medium text-sm active:scale-[0.98]"
                        >
                            <Plus size={18} />
                            New Chat
                        </button>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto px-3">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Recent</p>
                        {messages.length > 1 ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-100 text-gray-900 text-sm cursor-pointer">
                                    <Clock size={14} className="text-gray-500 flex-shrink-0" />
                                    <span className="truncate font-medium">
                                        {messages.find(m => m.sender === 'user')?.content.slice(0, 32) || 'Current conversation'}...
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 px-2">No conversations yet</p>
                        )}
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                        <button
                            onClick={handleClearChat}
                            className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors"
                            title="Clear all history"
                        >
                            <Trash2 size={16} />
                        </button>
                        {user && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">{userName}</span>
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-bold">
                                        {userName[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Main Chat Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar (toggle button when collapsed) */}
                {!sidebarOpen && (
                    <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                            title="Open sidebar"
                        >
                            <PanelLeftOpen size={18} />
                        </button>
                        <span className="text-sm text-gray-500 font-medium">Yene Learn AI</span>
                    </div>
                )}

                {!hasConversation ? (
                    /* â”€â”€â”€ Empty State â”€â”€â”€ */
                    <div className="flex-1 flex items-center justify-center overflow-y-auto">
                        <div className="max-w-3xl w-full px-6 py-12">
                            <div className="text-center mb-12">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="relative">
                                        <img src={logoImg} alt="Yene Learn" className="w-32 h-32 object-contain animate-float" />
                                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                                    </div>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 font-heading">
                                    {getGreeting()}, <span className="text-gray-500">{userName}</span>
                                </h1>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-300 mb-4 font-heading">
                                    What would you like to learn?
                                </h2>
                                <p className="text-gray-400 text-sm">Pick a suggestion or type your own</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-6">
                                {suggestedPrompts.map((prompt, index) => (
                                    <button
                                        key={`${index}-${refreshKey}`}
                                        onClick={() => handlePromptClick(prompt.text)}
                                        className="group text-left p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                                    >
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed mb-2">{prompt.text}</p>
                                        <span className="text-base">{prompt.icon}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="text-center mb-8">
                                <button
                                    onClick={() => setRefreshKey(prev => prev + 1)}
                                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <RefreshCw size={12} />
                                    Refresh
                                </button>
                            </div>

                            {/* Input */}
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-300 transition-all">
                                    <div className="p-4">
                                        <textarea
                                            ref={inputRef}
                                            className="w-full resize-none border-0 outline-none text-gray-800 placeholder-gray-400 text-base"
                                            placeholder="Ask whatever you wantâ€¦"
                                            rows={2}
                                            value={input}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                                        <span className="text-[11px] text-gray-400">{charCount > 0 ? `${charCount}/${MAX_CHARS}` : 'Shift+Enter for newline'}</span>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!input.trim() || isLoading}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 text-white hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* â”€â”€â”€ Active Conversation â”€â”€â”€ */
                    <>
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-3xl mx-auto px-6 py-6">
                                {messages.map((message) => (
                                    <div key={message.id} className="mb-6 animate-in">
                                        {message.sender === 'user' ? (
                                            /* User bubble */
                                            <div className="flex justify-end">
                                                <div className="max-w-[75%]">
                                                    <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed">
                                                        {message.content}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-1 text-right">
                                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : message.context === 'learning-plan' ? (
                                            /* Learning plan */
                                            <div className="flex gap-3 group">
                                                <div className="flex-shrink-0 w-8 h-8 mt-1">
                                                    <img src={logoImg} alt="" className="w-8 h-8 object-contain" />
                                                </div>
                                                <div className="max-w-[85%] min-w-0">
                                                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <BookOpen size={15} className="text-gray-700" />
                                                                <span className="font-semibold text-gray-900 text-sm">Learning Plan</span>
                                                            </div>
                                                            {savedPlans.has(message.id) ? (
                                                                <span className="text-green-600 flex items-center text-xs font-medium">
                                                                    <CheckCheck size={14} className="mr-1" />Saved
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => saveLearningPlan(message.id)}
                                                                    className="text-gray-500 hover:text-gray-900 text-xs flex items-center font-medium transition-colors"
                                                                >
                                                                    <Save size={14} className="mr-1" />Save
                                                                </button>
                                                            )}
                                                        </div>
                                                        <FormattedContent content={message.content} />
                                                    </div>
                                                    <AIMessageActions content={message.content} messageId={message.id} />
                                                    <div className="text-[11px] text-gray-400 mt-1">
                                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* AI response */
                                            <div className="flex gap-3 group">
                                                <div className="flex-shrink-0 w-8 h-8 mt-1">
                                                    <img src={logoImg} alt="" className="w-8 h-8 object-contain" />
                                                </div>
                                                <div className="max-w-[85%] min-w-0">
                                                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                                                        <FormattedContent content={message.content} />
                                                    </div>
                                                    <AIMessageActions content={message.content} messageId={message.id} />
                                                    <div className="text-[11px] text-gray-400 mt-1">
                                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Thinking indicator */}
                                {isLoading && (
                                    <div className="flex gap-3 mb-6">
                                        <div className="flex-shrink-0 w-8 h-8 mt-1">
                                            <img src={logoImg} alt="" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="text-sm text-gray-500">Generatingâ€¦</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Bottom input */}
                        <div className="border-t border-gray-200 bg-white">
                            <div className="max-w-3xl mx-auto px-6 py-3">
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-300 transition-all">
                                    <div className="p-3 pb-0">
                                        <textarea
                                            ref={inputRef}
                                            className="w-full resize-none border-0 outline-none text-gray-800 placeholder-gray-400 text-sm bg-transparent leading-relaxed"
                                            placeholder="Ask a follow-upâ€¦"
                                            rows={1}
                                            value={input}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <span className="text-[11px] text-gray-400">
                                            {charCount > 0 ? `${charCount}/${MAX_CHARS}` : 'Shift+Enter for newline'}
                                        </span>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!input.trim() || isLoading}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AIChatPage;
