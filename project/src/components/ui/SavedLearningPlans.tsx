import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { BookOpen, ChevronRight, ChevronDown, Download, Trash, Tag } from 'lucide-react';
import { 
  getSavedLearningPlanIds, 
  removeLearningPlanId, 
  getLearningPlansFromMessages,
  exportLearningPlan,
  LearningPlan
} from '../../services/learningPlanService';

const SavedLearningPlans: React.FC = () => {
  const [savedPlanIds, setSavedPlanIds] = useState<string[]>([]);
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const { messages } = useChat();

  useEffect(() => {
    // Load saved plan IDs from localStorage
    const savedIds = getSavedLearningPlanIds();
    setSavedPlanIds(savedIds);
  }, []);

  // Update plans whenever messages or savedPlanIds change
  useEffect(() => {
    const learningPlans = getLearningPlansFromMessages(messages);
    setPlans(learningPlans);
  }, [messages, savedPlanIds]);

  // If there are no saved plans, don't render the component
  if (plans.length === 0) {
    return null;
  }

  const formatDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRemovePlan = (planId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the parent onClick
    if (window.confirm('Are you sure you want to remove this learning plan?')) {
      removeLearningPlanId(planId);
      setSavedPlanIds(savedPlanIds.filter(id => id !== planId));
      if (selectedPlan === planId) {
        setSelectedPlan(null);
      }
    }
  };

  const handleExportPlan = (plan: LearningPlan, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the parent onClick
    exportLearningPlan(plan, 'text');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      <div 
        className="p-3 bg-indigo-50 flex items-center justify-between cursor-pointer"
        onClick={() => setShowPlans(!showPlans)}
      >
        <div className="flex items-center">
          <BookOpen className="text-indigo-600 mr-2" size={18} />
          <h3 className="font-medium text-indigo-900">Saved Learning Plans ({plans.length})</h3>
        </div>
        {showPlans ? (
          <ChevronDown className="text-indigo-600" size={18} />
        ) : (
          <ChevronRight className="text-indigo-600" size={18} />
        )}
      </div>

      {showPlans && (
        <div className="divide-y divide-gray-100">
          {/* List of saved plans */}
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedPlan === plan.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  <div className="font-medium flex items-center">
                    Learning Plan ({formatDate(plan.timestamp)})
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {plan.content.substring(0, 60)}...
                  </div>
                  {plan.tags && plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {plan.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          <Tag size={10} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center ml-2">
                  <button
                    onClick={(e) => handleExportPlan(plan, e)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Export plan"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={(e) => handleRemovePlan(plan.id, e)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-full ml-1"
                    title="Remove plan"
                  >
                    <Trash size={16} />
                  </button>
                  {selectedPlan === plan.id ? (
                    <ChevronDown size={16} className="text-gray-500 ml-1" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500 ml-1" />
                  )}
                </div>
              </div>

              {/* Expanded plan content */}
              {selectedPlan === plan.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                  <div className="whitespace-pre-line text-gray-700">
                    {plan.content.split(/\d+\./).map((section, i) => {
                      if (i === 0) return null; // Skip the first empty part
                      
                      // Find the section title
                      const titleMatch = section.match(/([^\n]+)/);
                      const title = titleMatch ? titleMatch[0].trim() : '';
                      // Get the content after the title
                      const content = titleMatch 
                        ? section.replace(titleMatch[0], '').trim() 
                        : section.trim();
                        
                      return (
                        <div key={i} className="mb-3">
                          <div className="font-medium text-indigo-700 mb-1">{i}. {title}</div>
                          <div className="pl-4 text-gray-700">{content}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedLearningPlans; 