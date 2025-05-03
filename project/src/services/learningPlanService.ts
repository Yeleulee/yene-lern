import { Message } from '../context/ChatContext';

export interface LearningPlan {
  id: string;
  content: string;
  timestamp: Date;
  tags?: string[];
}

// Load saved learning plan IDs from localStorage
export const getSavedLearningPlanIds = (): string[] => {
  try {
    const savedPlansData = localStorage.getItem('saved_learning_plans');
    if (savedPlansData) {
      return JSON.parse(savedPlansData);
    }
  } catch (error) {
    console.error('Error loading saved plans:', error);
  }
  return [];
};

// Save a learning plan ID to localStorage
export const saveLearningPlanId = (messageId: string): void => {
  try {
    const existingIds = getSavedLearningPlanIds();
    if (!existingIds.includes(messageId)) {
      const updatedIds = [...existingIds, messageId];
      localStorage.setItem('saved_learning_plans', JSON.stringify(updatedIds));
    }
  } catch (error) {
    console.error('Error saving learning plan:', error);
  }
};

// Remove a learning plan ID from localStorage
export const removeLearningPlanId = (messageId: string): void => {
  try {
    const existingIds = getSavedLearningPlanIds();
    const updatedIds = existingIds.filter(id => id !== messageId);
    localStorage.setItem('saved_learning_plans', JSON.stringify(updatedIds));
  } catch (error) {
    console.error('Error removing learning plan:', error);
  }
};

// Convert chat messages to learning plan objects
export const getLearningPlansFromMessages = (messages: Message[]): LearningPlan[] => {
  const savedPlanIds = getSavedLearningPlanIds();
  
  return messages
    .filter(message => 
      message.context === 'learning-plan' && 
      savedPlanIds.includes(message.id)
    )
    .map(message => ({
      id: message.id,
      content: message.content,
      timestamp: new Date(message.timestamp),
      tags: extractTagsFromPlan(message.content)
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort newest first
};

// Extract topic tags from the learning plan content
const extractTagsFromPlan = (content: string): string[] => {
  // Look for topics mentioned in the content
  const tags: Set<string> = new Set();
  
  // Common programming/tech topics to look for
  const commonTopics = [
    'JavaScript', 'React', 'Node', 'CSS', 'HTML', 'Python', 
    'Java', 'TypeScript', 'Angular', 'Vue', 'Frontend', 'Backend',
    'Web Development', 'Mobile', 'Data Science', 'Machine Learning',
    'UI', 'UX', 'Design', 'Databases'
  ];
  
  // Search for common topics in the content
  commonTopics.forEach(topic => {
    if (content.includes(topic)) {
      tags.add(topic);
    }
  });
  
  return Array.from(tags);
};

// Export plan as a formatted PDF or text
export const exportLearningPlan = (plan: LearningPlan, format: 'text' | 'pdf' = 'text'): void => {
  if (format === 'text') {
    const blob = new Blob([plan.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-plan-${new Date(plan.timestamp).toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // PDF export would require a PDF library, which is beyond the scope of this implementation
    alert('PDF export feature coming soon!');
  }
}; 