import React, { useState, useEffect } from 'react';
import { BookOpen, MessageSquare, Sparkles, Brain, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useLearning } from '../../context/LearningContext';
import { useLearningStats } from '../../context/LearningStatsContext';
import { getSavedLearningPlanIds } from '../../services/learningPlanService';
import Button from './Button';

interface LearningAssistantProps {
  currentCategory?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

const LearningAssistant: React.FC<LearningAssistantProps> = ({ 
  currentCategory = '',
  userLevel = 'beginner'
}) => {
  const { sendMessage, messages } = useChat();
  const { userVideos } = useLearning();
  const { learningStreak, totalLearningTime, completionRate } = useLearningStats();
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);

  // Extract video categories from user's videos
  const videoCategories = userVideos
    .map(video => video.channelTitle)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Check if user already has a learning plan
  useEffect(() => {
    const savedPlanIds = getSavedLearningPlanIds();
    const hasLearningPlan = messages.some(
      msg => msg.context === 'learning-plan' && savedPlanIds.includes(msg.id)
    );
    setHasPlan(hasLearningPlan);
  }, [messages]);

  const presetQuestions = [
    "What should I learn next based on my progress?",
    "How can I improve my learning efficiency?",
    `Can you recommend resources for ${currentCategory || 'my saved courses'}?`,
    `What are the best practices for ${currentCategory || 'this topic'}?`
  ];

  const handleAskQuestion = (question: string) => {
    sendMessage(`[Learning Assistant] ${question}`);
  };

  const handleGetPersonalizedPlan = () => {
    setIsCreatingPlan(true);

    // Build a detailed context for the AI
    const userStats = {
      level: userLevel,
      videosCount: userVideos.length,
      videosCompleted: userVideos.filter(v => v.status === 'completed').length,
      videosInProgress: userVideos.filter(v => v.status === 'in-progress').length,
      videosToLearn: userVideos.filter(v => v.status === 'to-learn').length,
      learningStreak,
      totalLearningTimeHours: Math.round(totalLearningTime / 3600),
      completionRate,
      interests: videoCategories.slice(0, 5), // Top 5 categories
      currentFilter: currentCategory
    };

    // Get recent video titles for context
    const recentVideoTitles = userVideos
      .filter(v => v.title)
      .slice(0, 5)
      .map(v => v.title);

    const prompt = `Generate a personalized learning plan for me. Here's information about my learning profile:
      - Level: ${userLevel}
      - Videos saved: ${userStats.videosCount}
      - Videos completed: ${userStats.videosCompleted}
      - Videos in progress: ${userStats.videosInProgress}
      - Learning streak: ${userStats.learningStreak} days
      - Total learning time: ${userStats.totalLearningTimeHours} hours
      - Completion rate: ${userStats.completionRate}%
      ${userStats.interests.length > 0 ? `- My interests: ${userStats.interests.join(', ')}` : ''}
      ${recentVideoTitles.length > 0 ? `- Recent videos I've saved: ${recentVideoTitles.join(', ')}` : ''}
      ${currentCategory ? `- I'm currently looking at my ${currentCategory} videos` : ''}`;

    sendMessage(`[Learning Assistant] ${prompt}`);
    
    // Reset state after 2 seconds
    setTimeout(() => {
      setIsCreatingPlan(false);
      setHasPlan(true); // Anticipate that a plan will be created
    }, 2000);
  };

  if (!isExpanded) {
    return (
      <div 
        className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="text-blue-600 mr-2" size={20} />
            <h3 className="text-lg font-medium text-blue-800">Learning Assistant</h3>
          </div>
          <ChevronDown className="text-blue-600" size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <BookOpen className="text-blue-600 mr-2" size={20} />
          <h3 className="text-lg font-medium text-blue-800">Learning Assistant</h3>
        </div>
        <button 
          onClick={() => setIsExpanded(false)}
          className="text-blue-600 hover:text-blue-800"
        >
          <ChevronUp size={20} />
        </button>
      </div>
      
      <p className="text-sm text-blue-700 mb-4">
        Get personalized help with your learning journey. Click on a question or ask your own.
      </p>
      
      <div className="space-y-2 mb-4">
        {presetQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleAskQuestion(question)}
            className="w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-100 text-sm transition-colors flex items-start"
          >
            <MessageSquare size={14} className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
            <span>{question}</span>
          </button>
        ))}
      </div>
      
      <Button 
        onClick={handleGetPersonalizedPlan}
        className="w-full justify-center"
        variant={hasPlan ? "success" : "outline"}
        disabled={isCreatingPlan}
      >
        {isCreatingPlan ? (
          <>
            <Sparkles size={16} className="mr-2 animate-pulse" />
            Creating Your Plan...
          </>
        ) : hasPlan ? (
          <>
            <Check size={16} className="mr-2" />
            Update Your Learning Plan
          </>
        ) : (
          <>
            <Brain size={16} className="mr-2" />
            Get Personalized Learning Plan
          </>
        )}
      </Button>
    </div>
  );
};

export default LearningAssistant; 