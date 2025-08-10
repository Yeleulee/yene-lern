import React, { useState } from 'react';
import { User } from '../../types';
import { X, Save, User as UserIcon, Mail, Tag } from 'lucide-react';
import Button from '../ui/Button';

interface ProfileEditFormProps {
  user: User;
  onSave: (updates: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    learningPreferences: user.learningPreferences || [],
  });
  const [newPreference, setNewPreference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const popularPreferences = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Machine Learning',
    'Data Science', 'Web Development', 'Mobile Development', 'DevOps',
    'UI/UX Design', 'Cybersecurity', 'Cloud Computing', 'Databases',
    'Artificial Intelligence', 'Blockchain', 'Game Development'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('Submitting profile update:', {
      displayName: formData.displayName.trim(),
      learningPreferences: formData.learningPreferences,
    });

    try {
      await onSave({
        displayName: formData.displayName.trim(),
        learningPreferences: formData.learningPreferences,
      });
      console.log('Profile update completed successfully');
      setSuccess(true);
      setIsLoading(false);
      
      // Close modal after showing success for a brief moment
      setTimeout(() => {
        if (onCancel) {
          onCancel();
        }
      }, 1500);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      setIsLoading(false);
    }
  };

  const addPreference = (preference: string) => {
    if (preference && !formData.learningPreferences.includes(preference)) {
      setFormData(prev => ({
        ...prev,
        learningPreferences: [...prev.learningPreferences, preference]
      }));
    }
    setNewPreference('');
  };

  const removePreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      learningPreferences: prev.learningPreferences.filter(p => p !== preference)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">Profile updated successfully!</p>
            </div>
          )}

          {/* Display Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon size={16} className="inline mr-2" />
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your display name"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Learning Preferences */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag size={16} className="inline mr-2" />
              Learning Interests
            </label>
            
            {/* Current Preferences */}
            {formData.learningPreferences.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {formData.learningPreferences.map((preference) => (
                    <span
                      key={preference}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {preference}
                      <button
                        type="button"
                        onClick={() => removePreference(preference)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Preference */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPreference}
                onChange={(e) => setNewPreference(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPreference(newPreference);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a learning interest..."
              />
              <Button
                type="button"
                onClick={() => addPreference(newPreference)}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>

            {/* Popular Preferences */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Popular interests:</p>
              <div className="flex flex-wrap gap-2">
                {popularPreferences
                  .filter(pref => !formData.learningPreferences.includes(pref))
                  .slice(0, 8)
                  .map((preference) => (
                    <button
                      key={preference}
                      type="button"
                      onClick={() => addPreference(preference)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      + {preference}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditForm;
