import React, { useState, useEffect } from 'react';
import { Eye, Type, Palette, Mouse, Keyboard, Volume2, Monitor, Settings } from 'lucide-react';

export interface AccessibilityPreferences {
  // Visual preferences
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorTheme: 'default' | 'dark' | 'high-contrast' | 'custom';
  reduceMotion: boolean;
  focusIndicator: 'default' | 'enhanced' | 'custom';
  
  // Interaction preferences
  keyboardNavigation: boolean;
  mouseEnhancement: boolean;
  clickTarget: 'default' | 'large' | 'extra-large';
  
  // Audio preferences
  soundFeedback: boolean;
  screenReaderSupport: boolean;
  
  // Timing preferences
  extendedTimeout: boolean;
  autoAdvance: boolean;
  pauseAnimations: boolean;
  
  // Custom preferences
  customCSS?: string;
  assistiveTechnology?: string;
  notes?: string;
}

interface AccessibilityPreferencesProps {
  preferences: AccessibilityPreferences;
  onPreferencesChange: (preferences: AccessibilityPreferences) => void;
  onApply?: () => void;
  showAdvanced?: boolean;
  embedded?: boolean;
}

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  fontSize: 'medium',
  colorTheme: 'default',
  reduceMotion: false,
  focusIndicator: 'default',
  keyboardNavigation: true,
  mouseEnhancement: false,
  clickTarget: 'default',
  soundFeedback: false,
  screenReaderSupport: false,
  extendedTimeout: false,
  autoAdvance: false,
  pauseAnimations: false
};

const AccessibilityPreferences: React.FC<AccessibilityPreferencesProps> = ({
  preferences,
  onPreferencesChange,
  onApply,
  showAdvanced = false,
  embedded = false
}) => {
  const [localPreferences, setLocalPreferences] = useState<AccessibilityPreferences>(preferences);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);
  const [previewMode, setPreviewMode] = useState(false);

  // Apply preferences to document
  const applyPreferences = (prefs: AccessibilityPreferences) => {
    const root = document.documentElement;
    
    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '22px'
    };
    root.style.fontSize = fontSizeMap[prefs.fontSize];
    
    // High contrast
    if (prefs.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Color theme
    root.setAttribute('data-theme', prefs.colorTheme);
    
    // Reduce motion
    if (prefs.reduceMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
    
    // Focus indicator
    if (prefs.focusIndicator === 'enhanced') {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    // Click target size
    if (prefs.clickTarget !== 'default') {
      root.setAttribute('data-click-target', prefs.clickTarget);
    } else {
      root.removeAttribute('data-click-target');
    }
    
    // Pause animations
    if (prefs.pauseAnimations) {
      root.classList.add('pause-animations');
    } else {
      root.classList.remove('pause-animations');
    }
    
    // Custom CSS
    let customStyleElement = document.getElementById('accessibility-custom-styles');
    if (prefs.customCSS) {
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'accessibility-custom-styles';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = prefs.customCSS;
    } else if (customStyleElement) {
      customStyleElement.remove();
    }
  };

  useEffect(() => {
    if (previewMode) {
      applyPreferences(localPreferences);
    }
  }, [localPreferences, previewMode]);

  const handlePreferenceChange = (key: keyof AccessibilityPreferences, value: any) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    onPreferencesChange(newPreferences);
  };

  const handleApply = () => {
    applyPreferences(localPreferences);
    onApply?.();
  };

  const handleReset = () => {
    setLocalPreferences(defaultPreferences);
    onPreferencesChange(defaultPreferences);
    applyPreferences(defaultPreferences);
  };

  const containerClass = embedded 
    ? "bg-white rounded-lg border p-4"
    : "bg-white rounded-lg shadow border p-6";

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Accessibility Preferences</h2>
        </div>
        
        {!embedded && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1 text-sm rounded ${
                previewMode 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {previewMode ? 'Exit Preview' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {showAdvancedOptions ? 'Hide Advanced' : 'Show Advanced'}
            </button>
          </div>
        )}
      </div>

      {/* Visual Preferences */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-gray-600" />
            Visual Preferences
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={localPreferences.fontSize}
                onChange={(e) => handlePreferenceChange('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="small">Small (14px)</option>
                <option value="medium">Medium (16px)</option>
                <option value="large">Large (18px)</option>
                <option value="extra-large">Extra Large (22px)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Theme
              </label>
              <select
                value={localPreferences.colorTheme}
                onChange={(e) => handlePreferenceChange('colorTheme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Default</option>
                <option value="dark">Dark Mode</option>
                <option value="high-contrast">High Contrast</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localPreferences.highContrast}
                onChange={(e) => handlePreferenceChange('highContrast', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable high contrast mode</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localPreferences.reduceMotion}
                onChange={(e) => handlePreferenceChange('reduceMotion', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Reduce motion and animations</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localPreferences.pauseAnimations}
                onChange={(e) => handlePreferenceChange('pauseAnimations', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Pause all animations</span>
            </label>
          </div>
        </div>

        {/* Interaction Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Keyboard className="w-5 h-5 mr-2 text-gray-600" />
            Interaction Preferences
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus Indicator
              </label>
              <select
                value={localPreferences.focusIndicator}
                onChange={(e) => handlePreferenceChange('focusIndicator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Default</option>
                <option value="enhanced">Enhanced (thicker outline)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Click Target Size
              </label>
              <select
                value={localPreferences.clickTarget}
                onChange={(e) => handlePreferenceChange('clickTarget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Default</option>
                <option value="large">Large (44px minimum)</option>
                <option value="extra-large">Extra Large (56px minimum)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.keyboardNavigation}
                  onChange={(e) => handlePreferenceChange('keyboardNavigation', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable enhanced keyboard navigation</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localPreferences.mouseEnhancement}
                  onChange={(e) => handlePreferenceChange('mouseEnhancement', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Mouse cursor enhancement</span>
              </label>
            </div>
          </div>
        </div>

        {/* Timing Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Monitor className="w-5 h-5 mr-2 text-gray-600" />
            Timing & Interaction
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localPreferences.extendedTimeout}
                onChange={(e) => handlePreferenceChange('extendedTimeout', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Request extended timeout periods</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localPreferences.autoAdvance}
                onChange={(e) => handlePreferenceChange('autoAdvance', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Disable automatic page advancement</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localPreferences.soundFeedback}
                onChange={(e) => handlePreferenceChange('soundFeedback', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable sound feedback</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localPreferences.screenReaderSupport}
                onChange={(e) => handlePreferenceChange('screenReaderSupport', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Using screen reader (optimized announcements)</span>
            </label>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-600" />
              Advanced Options
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assistive Technology
                </label>
                <input
                  type="text"
                  value={localPreferences.assistiveTechnology || ''}
                  onChange={(e) => handlePreferenceChange('assistiveTechnology', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JAWS, NVDA, VoiceOver"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={localPreferences.notes || ''}
                  onChange={(e) => handlePreferenceChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional accessibility needs or preferences..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom CSS (Advanced)
                </label>
                <textarea
                  value={localPreferences.customCSS || ''}
                  onChange={(e) => handlePreferenceChange('customCSS', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="/* Custom CSS for additional accessibility modifications */"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!embedded && (
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset to Defaults
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Preferences
            </button>
          </div>
        </div>
      )}

      {/* Preference Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Active Preferences Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
          <div>Font: {localPreferences.fontSize}</div>
          <div>Theme: {localPreferences.colorTheme}</div>
          <div>High Contrast: {localPreferences.highContrast ? 'On' : 'Off'}</div>
          <div>Reduced Motion: {localPreferences.reduceMotion ? 'On' : 'Off'}</div>
          <div>Screen Reader: {localPreferences.screenReaderSupport ? 'Yes' : 'No'}</div>
          <div>Extended Timeouts: {localPreferences.extendedTimeout ? 'On' : 'Off'}</div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage accessibility preferences
export const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    const saved = localStorage.getItem('accessibility-preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  const updatePreferences = (newPreferences: AccessibilityPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('accessibility-preferences', JSON.stringify(newPreferences));
  };

  const resetPreferences = () => {
    updatePreferences(defaultPreferences);
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences
  };
};

export { defaultPreferences };
export default AccessibilityPreferences;