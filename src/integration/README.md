# Research Method Integration Framework

## Overview

The Vision UX Research Suite is designed to support multiple research methods through a comprehensive plugin-based architecture. This framework allows developers to seamlessly integrate new research methods while maintaining consistency and leveraging existing infrastructure.

## Architecture Components

### 1. Type System (`src/types.ts`)
- **Enhanced Union Types**: Comprehensive `ResearchMethodType` supporting 18+ research methods
- **Method-Specific Configurations**: Union type `MethodSpecificConfig` with detailed configurations for each method
- **Method Metadata**: `RESEARCH_METHOD_METADATA` providing standardized information for all methods
- **Supporting Types**: Complete type definitions for all method-specific data structures

### 2. Plugin Architecture (`src/plugins/PluginManager.ts`)
- **Plugin Registration**: Automatic loading and validation of research method plugins
- **Component Management**: Centralized access to method-specific React components
- **Validation Framework**: Built-in validation for study configurations and results
- **Export System**: Flexible export formats for each research method

### 3. Data Layer (`src/data/DataManager.ts`)
- **Enhanced Validation**: Method-specific validation rules and quality metrics
- **Cross-Method Analysis**: Tools for correlating data across different research methods
- **Storage Abstraction**: Multiple storage backends with migration support
- **Quality Assurance**: Automated data quality scoring and recommendations

### 4. API Abstraction (`src/api/ApiClient.ts`)
- **Offline/Online Support**: Seamless operation in both connected and disconnected modes
- **Advanced Analytics**: Cross-method analysis and method-specific analytics
- **Recommendation Engine**: AI-powered method recommendations based on research goals
- **Export Management**: Unified export system for all research methods

### 5. Study Management (`src/IAEvaluationPlatform.tsx`)
- **Multi-Method Creation**: Enhanced study creation with category-based method selection
- **Filtering & Search**: Advanced filtering by category, complexity, and status
- **Visual Management**: Both list and grid views with method-specific icons and colors
- **Cross-Method Workflows**: Support for linked studies and research programs

## Integration Guide

### Adding a New Research Method

#### Step 1: Define Types
```typescript
// Add to ResearchMethodType union in types.ts
export type ResearchMethodType = 
  | 'existing-methods...'
  | 'your-new-method';

// Create method-specific configuration
export interface YourMethodConfig extends BaseMethodConfig {
  methodType: 'your-new-method';
  // Add method-specific configuration options
  specificOption: boolean;
  customSettings: {
    setting1: string;
    setting2: number;
  };
}

// Add to MethodSpecificConfig union
export type MethodSpecificConfig = 
  | 'existing-configs...'
  | YourMethodConfig;
```

#### Step 2: Add Method Metadata
```typescript
// Add to RESEARCH_METHOD_METADATA in types.ts
'your-new-method': {
  type: 'your-new-method',
  category: 'appropriate-category',
  complexity: 'simple' | 'moderate' | 'complex' | 'expert',
  estimatedDuration: { min: 10, max: 60, average: 30 },
  participantRequirements: { 
    minParticipants: 5, 
    maxParticipants: 50, 
    recommendedParticipants: 20 
  },
  dataTypes: ['specific-data-types'],
  compatibleMethods: ['complementary-methods'],
  prerequisites: ['required-setup-items']
}
```

#### Step 3: Create Plugin
```typescript
// Create plugin in src/plugins/methods/YourMethodPlugin.ts
export function createYourMethodPlugin(): ResearchMethodPlugin {
  return {
    id: 'your-method-core',
    name: 'Your Method Name',
    version: '1.0.0',
    description: 'Description of your research method',
    author: 'Your Team',
    methodType: 'your-new-method',
    supportedFeatures: ['feature1', 'feature2'],
    
    // React components for different views
    studyConfigComponent: YourMethodConfigComponent,
    participantComponent: YourMethodParticipantComponent,
    resultsComponent: YourMethodResultsComponent,
    analyticsComponent: YourMethodAnalyticsComponent,
    
    // Validation function
    validateStudyConfig: (config: any): ValidationResult => {
      // Implement validation logic
      return { isValid: true, errors: [], warnings: [] };
    },
    
    // Results processing
    processResults: (results: any): ProcessedResults => {
      // Implement results processing
      return { /* processed results */ };
    },
    
    // Analytics generation
    generateAnalytics: (results: any[]): AnalyticsData => {
      // Implement analytics logic
      return { /* analytics data */ };
    },
    
    // Export formats
    exportFormats: [
      {
        id: 'json',
        name: 'JSON',
        extension: 'json',
        mimeType: 'application/json',
        description: 'Raw data export'
      }
    ]
  };
}
```

#### Step 4: Register Plugin
```typescript
// Add to src/plugins/PluginManager.ts initializeCorePlugins()
if (configManager.isFeatureEnabled('yourMethodEnabled')) {
  await this.registerPlugin(createYourMethodPlugin());
}
```

#### Step 5: Add Validation
```typescript
// Add case to DataManager.ts validateMethodSpecificData()
case 'your-new-method':
  // Add method-specific validation rules
  if (!study.yourMethodData || study.yourMethodData.length === 0) {
    errors.push({ 
      field: 'yourMethodData', 
      message: 'Your method requires specific data', 
      code: 'REQUIRED_FIELD' 
    });
  }
  break;
```

#### Step 6: Update Study Management
```typescript
// Add to IAEvaluationPlatform.tsx createDefaultMethodConfig()
case 'your-new-method':
  return {
    methodType: 'your-new-method',
    version: '1.0',
    // Add default configuration
    specificOption: true,
    customSettings: {
      setting1: 'default',
      setting2: 10
    }
  } as YourMethodConfig;
```

## Best Practices

### 1. Component Design
- **Consistency**: Follow existing UI patterns and component structures
- **Accessibility**: Ensure all components meet WCAG 2.1 AA standards
- **Responsiveness**: Support both desktop and mobile layouts
- **Error Handling**: Provide clear error messages and recovery options

### 2. Data Handling
- **Validation**: Implement comprehensive validation at both client and data layers
- **Quality Metrics**: Calculate and store data quality indicators
- **Export Support**: Provide multiple export formats appropriate for your method
- **Backward Compatibility**: Ensure data migrations work smoothly

### 3. User Experience
- **Progressive Disclosure**: Start simple, allow advanced configuration
- **Help & Guidance**: Provide contextual help and method documentation
- **Performance**: Optimize for large datasets and many participants
- **Offline Support**: Ensure core functionality works without internet

### 4. Testing
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Verify plugin integration with core system
- **User Testing**: Validate with actual researchers and participants
- **Performance Tests**: Ensure scalability with real-world data volumes

## Available Utilities

### Validation Helpers
```typescript
import { DataValidator } from '../data/DataManager';

// Validate study configuration
const validation = DataValidator.validateStudy(study);

// Check cross-method compatibility
const compatibility = DataValidator.validateCrossMethodCompatibility([study1, study2]);

// Generate insights
const insights = DataValidator.generateCrossMethodInsights([study1, study2]);
```

### API Helpers
```typescript
import { AnalyticsService } from '../api/ApiClient';

// Generate method-specific analytics
const analytics = await AnalyticsService.methodAnalytics(studyId, 'advanced');

// Get method recommendations
const recommendations = await AnalyticsService.getRecommendations(goals);

// Export study data
const exported = await AnalyticsService.export(studyId, options);
```

### Plugin Utilities
```typescript
import { pluginManager } from '../plugins/PluginManager';

// Check if method is available
const hasMethod = pluginManager.hasPlugin('your-new-method');

// Get method component
const ConfigComponent = pluginManager.getStudyConfigComponent('your-new-method');

// Validate configuration
const validation = await pluginManager.validateStudyConfig('your-new-method', config);
```

## Migration Support

The framework includes comprehensive migration tools to help evolve your research methods:

### Schema Migrations
- Version-controlled data structure changes
- Automatic migration execution with rollback support
- Data validation before and after migrations
- Backup creation and restoration

### Configuration Migrations
- Feature flag management for gradual rollouts
- Environment-specific configurations
- User preference migrations
- Plugin dependency management

## Extension Points

### Custom Analytics
Extend the analytics system with method-specific visualizations and insights:

```typescript
// Custom analytics component
const CustomAnalyticsComponent: React.FC<{results: any[]}> = ({ results }) => {
  // Implement custom visualizations
  return <div>Custom analytics for your method</div>;
};
```

### Export Formats
Add specialized export formats for your research method:

```typescript
// Custom exporter
const customExporter = async (data: any, format: string): Promise<ExportResult> => {
  // Implement custom export logic
  return { success: true, filename: 'export.custom', size: 1024, downloadUrl: 'blob://...' };
};
```

### Validation Rules
Implement method-specific validation logic:

```typescript
// Custom validator
const validateCustomMethod = (config: any): ValidationResult => {
  const errors: any[] = [];
  const warnings: any[] = [];
  
  // Add your validation logic here
  
  return { isValid: errors.length === 0, errors, warnings };
};
```

## Support & Resources

- **Documentation**: Comprehensive API documentation in `/docs`
- **Examples**: Working examples in `/examples`
- **Templates**: Starter templates in `/templates`
- **Community**: Join our developer community for support
- **Issues**: Report bugs and request features on GitHub

## Contributing

We welcome contributions to extend the research method capabilities:

1. **Fork** the repository
2. **Create** a feature branch for your new method
3. **Implement** following this integration guide
4. **Test** thoroughly with real research scenarios
5. **Document** your method and any new patterns
6. **Submit** a pull request with detailed description

## License

This integration framework is part of the Vision UX Research Suite and follows the same licensing terms.