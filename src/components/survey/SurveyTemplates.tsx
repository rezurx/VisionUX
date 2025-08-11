import React, { useState } from 'react';
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  BarChart3,
  Heart,
  ShoppingCart,
  Monitor,
  Briefcase,
  GraduationCap,
  Smartphone,
  Globe,
  Target,
  Check,
  X,
  FileText,
  Download,
  Copy
} from 'lucide-react';
import { SurveyQuestion, SurveyConfig, SurveyOption } from '../../types';

interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'research' | 'feedback' | 'evaluation' | 'demographic' | 'nps' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  questions: SurveyQuestion[];
  config: Partial<SurveyConfig>;
  tags: string[];
  icon: React.ReactNode;
  previewImage?: string;
  usageCount?: number;
  rating?: number;
}

interface SurveyTemplatesProps {
  onSelectTemplate: (template: SurveyTemplate) => void;
  onClose: () => void;
  selectedCategory?: string;
}

// Predefined survey templates
const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'user-satisfaction',
    name: 'User Satisfaction Survey',
    description: 'Measure overall user satisfaction with your product or service',
    category: 'feedback',
    difficulty: 'beginner',
    estimatedTime: 5,
    tags: ['satisfaction', 'feedback', 'product', 'service'],
    icon: <Star className="w-5 h-5" />,
    usageCount: 1250,
    rating: 4.8,
    questions: [
      {
        id: 'satisfaction-overall',
        type: 'rating-scale',
        question: 'Overall, how satisfied are you with our product/service?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] }
      },
      {
        id: 'satisfaction-features',
        type: 'rating-scale',
        question: 'How would you rate the quality of our features?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] }
      },
      {
        id: 'satisfaction-recommend',
        type: 'rating-scale',
        question: 'How likely are you to recommend us to others?',
        required: true,
        scale: { min: 0, max: 10, labels: ['Not likely at all', '', '', '', '', '', '', '', '', '', 'Extremely likely'] }
      },
      {
        id: 'satisfaction-feedback',
        type: 'text',
        question: 'What can we do to improve your experience?',
        required: false,
        validation: { maxLength: 500 }
      }
    ],
    config: {
      showProgressIndicator: true,
      allowPartialCompletion: false,
      randomizeQuestionOrder: false
    }
  },
  {
    id: 'website-usability',
    name: 'Website Usability Evaluation',
    description: 'Evaluate the usability and user experience of your website',
    category: 'evaluation',
    difficulty: 'intermediate',
    estimatedTime: 8,
    tags: ['usability', 'website', 'ux', 'navigation'],
    icon: <Monitor className="w-5 h-5" />,
    usageCount: 890,
    rating: 4.6,
    questions: [
      {
        id: 'navigation-ease',
        type: 'rating-scale',
        question: 'How easy was it to navigate through our website?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy'] }
      },
      {
        id: 'design-appeal',
        type: 'rating-scale',
        question: 'How appealing is the visual design of our website?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Very Unappealing', 'Unappealing', 'Neutral', 'Appealing', 'Very Appealing'] }
      },
      {
        id: 'information-findable',
        type: 'boolean',
        question: 'Were you able to find the information you were looking for?',
        required: true
      },
      {
        id: 'mobile-experience',
        type: 'rating-scale',
        question: 'If you used our website on mobile, how was the experience?',
        required: false,
        scale: { min: 1, max: 5, labels: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] }
      },
      {
        id: 'improvement-suggestions',
        type: 'text',
        question: 'What improvements would you suggest for our website?',
        required: false,
        validation: { maxLength: 300 }
      }
    ],
    config: {
      showProgressIndicator: true,
      allowPartialCompletion: true,
      randomizeQuestionOrder: false
    }
  },
  {
    id: 'nps-survey',
    name: 'Net Promoter Score (NPS)',
    description: 'Measure customer loyalty and likelihood to recommend',
    category: 'nps',
    difficulty: 'beginner',
    estimatedTime: 3,
    tags: ['nps', 'loyalty', 'recommendation', 'score'],
    icon: <Target className="w-5 h-5" />,
    usageCount: 2100,
    rating: 4.9,
    questions: [
      {
        id: 'nps-score',
        type: 'rating-scale',
        question: 'How likely are you to recommend our company/product/service to a friend or colleague?',
        required: true,
        scale: { min: 0, max: 10, labels: ['Not at all likely', '', '', '', '', '', '', '', '', '', 'Extremely likely'] }
      },
      {
        id: 'nps-reason',
        type: 'text',
        question: 'What is the primary reason for your score?',
        required: false,
        validation: { maxLength: 200 }
      }
    ],
    config: {
      showProgressIndicator: false,
      allowPartialCompletion: false,
      randomizeQuestionOrder: false,
      branchingLogic: [
        {
          id: 'nps-follow-up',
          condition: {
            questionId: 'nps-score',
            operator: 'greater-than',
            value: 8
          },
          action: {
            type: 'skip-to',
            targetId: 'nps-reason'
          }
        }
      ]
    }
  },
  {
    id: 'demographics',
    name: 'Demographic Information',
    description: 'Collect basic demographic information from participants',
    category: 'demographic',
    difficulty: 'beginner',
    estimatedTime: 4,
    tags: ['demographics', 'profile', 'age', 'location'],
    icon: <Users className="w-5 h-5" />,
    usageCount: 1550,
    rating: 4.3,
    questions: [
      {
        id: 'age-range',
        type: 'multiple-choice',
        question: 'What is your age range?',
        required: true,
        options: [
          { id: 'age-18-24', text: '18-24 years', value: '18-24' },
          { id: 'age-25-34', text: '25-34 years', value: '25-34' },
          { id: 'age-35-44', text: '35-44 years', value: '35-44' },
          { id: 'age-45-54', text: '45-54 years', value: '45-54' },
          { id: 'age-55-64', text: '55-64 years', value: '55-64' },
          { id: 'age-65+', text: '65+ years', value: '65+' }
        ]
      },
      {
        id: 'gender',
        type: 'multiple-choice',
        question: 'How do you identify?',
        required: false,
        options: [
          { id: 'gender-male', text: 'Male', value: 'male' },
          { id: 'gender-female', text: 'Female', value: 'female' },
          { id: 'gender-non-binary', text: 'Non-binary', value: 'non-binary' },
          { id: 'gender-prefer-not', text: 'Prefer not to say', value: 'prefer-not-to-say' },
          { id: 'gender-other', text: 'Other', value: 'other' }
        ]
      },
      {
        id: 'location',
        type: 'text',
        question: 'What country/region are you located in?',
        required: false,
        validation: { maxLength: 100 }
      },
      {
        id: 'tech-savvy',
        type: 'rating-scale',
        question: 'How would you rate your technical expertise?',
        required: false,
        scale: { min: 1, max: 5, labels: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'] }
      }
    ],
    config: {
      showProgressIndicator: true,
      allowPartialCompletion: true,
      randomizeQuestionOrder: false
    }
  },
  {
    id: 'product-feedback',
    name: 'Product Feature Feedback',
    description: 'Gather detailed feedback on specific product features',
    category: 'feedback',
    difficulty: 'intermediate',
    estimatedTime: 10,
    tags: ['product', 'features', 'feedback', 'improvement'],
    icon: <ShoppingCart className="w-5 h-5" />,
    usageCount: 720,
    rating: 4.5,
    questions: [
      {
        id: 'feature-usage',
        type: 'multiple-choice',
        question: 'Which features do you use most frequently?',
        required: true,
        options: [
          { id: 'feature-dashboard', text: 'Dashboard', value: 'dashboard' },
          { id: 'feature-reports', text: 'Reports', value: 'reports' },
          { id: 'feature-analytics', text: 'Analytics', value: 'analytics' },
          { id: 'feature-integrations', text: 'Integrations', value: 'integrations' },
          { id: 'feature-settings', text: 'Settings', value: 'settings' }
        ]
      },
      {
        id: 'feature-satisfaction',
        type: 'rating-scale',
        question: 'How satisfied are you with the features you use?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] }
      },
      {
        id: 'missing-features',
        type: 'text',
        question: 'What features are missing that would improve your workflow?',
        required: false,
        validation: { maxLength: 400 }
      },
      {
        id: 'feature-priority',
        type: 'ranking',
        question: 'Rank these potential new features by importance to you:',
        required: true,
        options: [
          { id: 'feature-mobile-app', text: 'Mobile app', value: 'mobile-app' },
          { id: 'feature-automation', text: 'Automation tools', value: 'automation' },
          { id: 'feature-collaboration', text: 'Team collaboration', value: 'collaboration' },
          { id: 'feature-api', text: 'Advanced API access', value: 'api' }
        ]
      }
    ],
    config: {
      showProgressIndicator: true,
      allowPartialCompletion: true,
      randomizeQuestionOrder: false
    }
  },
  {
    id: 'event-feedback',
    name: 'Event Feedback Survey',
    description: 'Collect feedback from event attendees',
    category: 'feedback',
    difficulty: 'beginner',
    estimatedTime: 6,
    tags: ['event', 'feedback', 'satisfaction', 'improvement'],
    icon: <GraduationCap className="w-5 h-5" />,
    usageCount: 680,
    rating: 4.4,
    questions: [
      {
        id: 'event-rating',
        type: 'rating-scale',
        question: 'How would you rate the overall event?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] }
      },
      {
        id: 'content-quality',
        type: 'rating-scale',
        question: 'How would you rate the quality of the content/presentations?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] }
      },
      {
        id: 'organization',
        type: 'rating-scale',
        question: 'How well organized was the event?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] }
      },
      {
        id: 'attend-again',
        type: 'boolean',
        question: 'Would you attend a similar event in the future?',
        required: true
      },
      {
        id: 'improvements',
        type: 'text',
        question: 'What could we improve for future events?',
        required: false,
        validation: { maxLength: 300 }
      }
    ],
    config: {
      showProgressIndicator: true,
      allowPartialCompletion: false,
      randomizeQuestionOrder: false
    }
  },
  {
    id: 'advanced-usability',
    name: 'Advanced Usability Assessment',
    description: 'Comprehensive usability evaluation with branching logic and conditional questions',
    category: 'evaluation',
    difficulty: 'advanced',
    estimatedTime: 15,
    tags: ['usability', 'advanced', 'conditional', 'comprehensive'],
    icon: <Monitor className="w-5 h-5" />,
    usageCount: 340,
    rating: 4.7,
    questions: [
      {
        id: 'device-type',
        type: 'multiple-choice',
        question: 'What device are you primarily using for this evaluation?',
        required: true,
        options: [
          { id: 'desktop', text: 'Desktop/Laptop', value: 'desktop' },
          { id: 'tablet', text: 'Tablet', value: 'tablet' },
          { id: 'mobile', text: 'Mobile Phone', value: 'mobile' }
        ]
      },
      {
        id: 'experience-level',
        type: 'rating-scale',
        question: 'How would you rate your overall experience with similar websites/applications?',
        required: true,
        scale: { min: 1, max: 5, labels: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'] }
      },
      {
        id: 'task-completion',
        type: 'boolean',
        question: 'Were you able to complete the main task successfully?',
        required: true
      },
      {
        id: 'task-difficulty',
        type: 'rating-scale',
        question: 'How difficult was it to complete the task?',
        required: true,
        scale: { min: 1, max: 7, labels: ['Very Easy', 'Easy', 'Somewhat Easy', 'Neither', 'Somewhat Difficult', 'Difficult', 'Very Difficult'] }
      },
      {
        id: 'mobile-specific',
        type: 'rating-scale',
        question: 'How would you rate the mobile experience specifically?',
        required: false,
        scale: { min: 1, max: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] }
      },
      {
        id: 'improvement-areas',
        type: 'ranking',
        question: 'Rank these areas by priority for improvement:',
        required: true,
        options: [
          { id: 'navigation', text: 'Navigation and menu structure', value: 'navigation' },
          { id: 'visual-design', text: 'Visual design and layout', value: 'visual-design' },
          { id: 'content', text: 'Content clarity and organization', value: 'content' },
          { id: 'performance', text: 'Loading speed and performance', value: 'performance' }
        ]
      },
      {
        id: 'detailed-feedback',
        type: 'text',
        question: 'Please provide specific feedback about what could be improved:',
        required: false,
        validation: { maxLength: 500 }
      }
    ],
    config: {
      showProgressIndicator: true,
      allowPartialCompletion: true,
      randomizeQuestionOrder: false,
      branchingLogic: [
        {
          id: 'mobile-branch',
          condition: {
            questionId: 'device-type',
            operator: 'equals',
            value: 'mobile'
          },
          action: {
            type: 'skip-to',
            targetId: 'mobile-specific'
          }
        },
        {
          id: 'skip-mobile-for-desktop',
          condition: {
            questionId: 'device-type',
            operator: 'not-equals',
            value: 'mobile'
          },
          action: {
            type: 'skip-to',
            targetId: 'improvement-areas'
          }
        }
      ]
    }
  },
  {
    id: 'quick-feedback',
    name: 'Quick Feedback (1 minute)',
    description: 'Ultra-short feedback survey for high-traffic scenarios',
    category: 'feedback',
    difficulty: 'beginner',
    estimatedTime: 1,
    tags: ['quick', 'short', 'minimal', 'high-traffic'],
    icon: <Clock className="w-5 h-5" />,
    usageCount: 890,
    rating: 4.2,
    questions: [
      {
        id: 'quick-satisfaction',
        type: 'rating-scale',
        question: 'How was your experience today?',
        required: true,
        scale: { min: 1, max: 5, labels: ['😞', '😐', '😊', '😄', '🤩'] }
      },
      {
        id: 'quick-comment',
        type: 'text',
        question: 'Anything else you\'d like us to know? (optional)',
        required: false,
        validation: { maxLength: 100 }
      }
    ],
    config: {
      showProgressIndicator: false,
      allowPartialCompletion: false,
      randomizeQuestionOrder: false
    }
  }
];

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates', count: SURVEY_TEMPLATES.length },
  { id: 'research', label: 'Research', count: SURVEY_TEMPLATES.filter(t => t.category === 'research').length },
  { id: 'feedback', label: 'Feedback', count: SURVEY_TEMPLATES.filter(t => t.category === 'feedback').length },
  { id: 'evaluation', label: 'Evaluation', count: SURVEY_TEMPLATES.filter(t => t.category === 'evaluation').length },
  { id: 'nps', label: 'NPS', count: SURVEY_TEMPLATES.filter(t => t.category === 'nps').length },
  { id: 'demographic', label: 'Demographics', count: SURVEY_TEMPLATES.filter(t => t.category === 'demographic').length }
];

const SurveyTemplates: React.FC<SurveyTemplatesProps> = ({
  onSelectTemplate,
  onClose,
  selectedCategory = 'all'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'name' | 'time'>('popular');
  const [previewTemplate, setPreviewTemplate] = useState<SurveyTemplate | null>(null);

  // Filter and sort templates
  const filteredTemplates = SURVEY_TEMPLATES
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'all' || template.difficulty === difficultyFilter;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'time':
          return a.estimatedTime - b.estimatedTime;
        default:
          return 0;
      }
    });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research': return <BarChart3 className="w-4 h-4" />;
      case 'feedback': return <Heart className="w-4 h-4" />;
      case 'evaluation': return <Monitor className="w-4 h-4" />;
      case 'nps': return <Target className="w-4 h-4" />;
      case 'demographic': return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Survey Templates</h2>
            <p className="text-gray-600 mt-1">Choose from pre-built templates to get started quickly</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TEMPLATE_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.count})
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name A-Z</option>
              <option value="time">Shortest Time</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No templates found</p>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setPreviewTemplate(template)}
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {template.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{template.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {getCategoryIcon(template.category)}
                          <span className="text-xs text-gray-500 capitalize">{template.category}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                  </div>

                  {/* Template Info */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>

                  {/* Template Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{template.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>{template.questions.length} questions</span>
                    </div>
                  </div>

                  {/* Template Rating and Usage */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{template.rating?.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({template.usageCount?.toLocaleString()} uses)</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(template);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Preview Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {previewTemplate.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{previewTemplate.name}</h3>
                    <p className="text-gray-600">{previewTemplate.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {previewTemplate.questions.map((question, index) => (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-medium rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </h4>
                          <div className="text-sm text-gray-600 mb-2">
                            Type: <span className="capitalize">{question.type.replace('-', ' ')}</span>
                          </div>
                          
                          {/* Question Preview */}
                          {question.type === 'multiple-choice' && question.options && (
                            <div className="space-y-1">
                              {question.options.map(option => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border border-gray-300 rounded"></div>
                                  <span className="text-sm">{option.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.type === 'rating-scale' && question.scale && (
                            <div className="flex items-center space-x-2">
                              {Array.from({ length: question.scale.max - question.scale.min + 1 }, (_, i) => (
                                <div key={i} className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-sm">
                                  {question.scale!.min + i}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.type === 'text' && (
                            <div className="w-full h-20 border border-gray-300 rounded bg-white"></div>
                          )}
                          
                          {question.type === 'boolean' && (
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border border-gray-300 rounded"></div>
                                <span className="text-sm">Yes</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border border-gray-300 rounded"></div>
                                <span className="text-sm">No</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Actions */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{previewTemplate.estimatedTime} minutes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{previewTemplate.questions.length} questions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{previewTemplate.rating?.toFixed(1)} rating</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onSelectTemplate(previewTemplate);
                      setPreviewTemplate(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Use This Template</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyTemplates;