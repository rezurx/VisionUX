# Vision UX Research Suite

> **The "MS Office of UX Research"** - A comprehensive, integrated platform for modern user experience research methods.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🚀 Overview

Vision UX is a revolutionary platform that consolidates fragmented UX research tools into one seamless experience. Built to replace expensive enterprise tools like UserZoom, Morae, and fragmented survey platforms with a modern, AI-powered research suite.

**Current Status**: Phase 1 Complete (90%) - Foundation + Survey Builder + Analytics Infrastructure

## ✨ Key Features

### 🏗️ **Multi-Method Research Platform**
- **Card Sorting & Tree Testing**: Interactive, drag-and-drop interfaces
- **Advanced Survey Builder**: Professional survey creation with conditional logic
- **Accessibility Testing**: WCAG compliance scanning and validation
- **Analytics Dashboard**: Professional D3.js visualizations with statistical rigor

### 🎯 **Advanced Survey System**
- **15+ Conditional Operators**: Complex branching logic with validation
- **Smart Question Editor**: Real-time validation with accessibility compliance
- **8 Pre-built Templates**: From quick feedback to advanced usability assessments
- **Professional Interface**: Drag-and-drop question builder with live preview

### 📊 **Professional Analytics**
- **Statistical Rigor**: Cohen's Kappa, confidence intervals, significance testing
- **Interactive Visualizations**: Similarity matrices, dendrograms, rainbow charts
- **Cross-Method Analysis**: AI-powered insights across research methods  
- **Export Flexibility**: JSON, CSV, Excel, PDF with custom aggregation

### ♿ **Accessibility-First Design**
- **WCAG Compliance**: Built-in accessibility checking and guidance
- **Screen Reader Support**: Full keyboard navigation and ARIA implementation
- **Mobile Responsive**: Professional experience on all devices
- **High Contrast**: Optimized for visual accessibility

## 🛠️ Technology Stack

### **Core Technologies**
- **Frontend**: React 18.2 + TypeScript 5.0 + Vite 4.4
- **Styling**: Tailwind CSS 3.3 + Lucide React Icons
- **Analytics**: D3.js 7.9 for advanced visualizations
- **Data Processing**: PapaParse for CSV handling + localStorage

### **Architecture Highlights**
- **Modular Component System**: Extensible research method plugins
- **Type-Safe Implementation**: Comprehensive TypeScript interfaces  
- **Performance Optimized**: Data virtualization for large datasets
- **Progressive Enhancement**: Backwards compatible feature additions

## 📋 Research Methods Supported

### **Currently Available**
- ✅ **Card Sorting**: Open, closed, and hybrid sorting methods
- ✅ **Tree Testing**: Task-based navigation validation  
- ✅ **Surveys**: Advanced conditional logic and question types
- ✅ **Analytics**: Cross-method insights and statistical analysis

### **Phase 2 (Planned)**
- 🔄 **Accessibility Auditing**: Comprehensive WCAG compliance testing
- 🔄 **Design System Analytics**: Component usage and adoption tracking
- 🔄 **Video Analysis**: AI-powered user session analysis
- 🔄 **Prototype Testing**: Interactive design validation

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Modern browser with JavaScript enabled

### **Installation**

```bash
# Clone the repository
git clone https://github.com/rezurx/VisionUX.git
cd VisionUX

# Install dependencies  
npm install

# Start development server
npm run dev
```

### **Build for Production**

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

### **Quick Issue Fixes** 🚑

```bash
# Fix blank screen (most common)
npm install lucide-react@latest
npm run dev

# Fix TypeScript errors
npm install @types/axe-core
npx tsc --noEmit

# Reset everything  
rm -rf node_modules package-lock.json
npm install
```

## 📖 Usage Guide

### **Creating Studies**

1. **Choose Research Method**: Select from card sorting, tree testing, or surveys
2. **Configure Content**: Add cards, categories, questions, or tasks
3. **Set Advanced Options**: Configure validation, branching logic, accessibility
4. **Launch Study**: Generate participant links and access codes
5. **Monitor Results**: Real-time participant tracking and data collection

### **Survey Builder Features**

```typescript
// Example: Advanced survey with conditional logic
const survey = {
  questions: [
    {
      type: 'multiple-choice',
      question: 'What device are you using?',
      options: ['Desktop', 'Mobile', 'Tablet'],
      branchingLogic: {
        'Mobile': 'skip-to-mobile-questions'
      }
    }
  ]
}
```

### **Analytics & Insights**

- **Similarity Analysis**: Understand card grouping patterns
- **Statistical Validation**: Cohen's Kappa agreement scores  
- **Cross-Method Correlation**: Find patterns across research methods
- **Export Options**: Flexible data export in multiple formats

## 🏗️ Architecture

### **Component Structure**
```
src/
├── components/
│   ├── analytics/          # D3.js visualizations
│   ├── participant/        # Participant-facing interfaces  
│   ├── survey/            # Survey builder system
│   └── accessibility/     # WCAG compliance tools
├── types.ts              # TypeScript interfaces
├── analytics.ts          # Statistical functions
└── utils.ts             # Utility functions
```

### **Key Design Patterns**
- **Plugin Architecture**: Extensible research method system
- **Type-Safe Development**: Comprehensive interface definitions
- **Mobile-First Design**: Responsive across all device types
- **Accessibility-First**: WCAG AA compliant throughout

## 📊 Analytics Capabilities

### **Statistical Methods**
- **Agreement Analysis**: Cohen's Kappa coefficient calculation
- **Hierarchical Clustering**: Ward's method for card relationships
- **Correlation Analysis**: Cross-method pattern detection  
- **Confidence Intervals**: Statistical significance validation

### **Visualization Types**  
- **Similarity Matrices**: Interactive heatmaps showing relationships
- **Dendrograms**: Hierarchical clustering visualizations
- **Rainbow Charts**: Category usage frequency analysis
- **Cross-Method Dashboards**: Integrated insights across research types

## 🎯 Roadmap

### **Phase 1**: Foundation Complete ✅
- ✅ Core platform architecture
- ✅ Survey Builder with advanced features  
- ✅ Analytics infrastructure
- ✅ Accessibility compliance

### **Phase 2**: Advanced Methods (Q1 2025)
- 🔄 Video analysis with AI transcription
- 🔄 Design system analytics
- 🔄 Advanced accessibility testing
- 🔄 Real-time collaboration

### **Phase 3**: AI Integration (Q2 2025)  
- 🔮 Cross-method AI insights
- 🔮 Automated report generation
- 🔮 Predictive user behavior analysis
- 🔮 Voice and conversational UX testing

## 🔧 Troubleshooting

**Experiencing issues?** Check our comprehensive [**Troubleshooting Guide**](TROUBLESHOOTING.md) for solutions to common problems:

- 🚨 **Blank/White Screen Issues** - CSP violations, icon import errors
- 🔨 **TypeScript Compilation Errors** - Missing dependencies, type issues  
- ⚙️ **Development Server Problems** - Port conflicts, build failures
- 📱 **Component Structure Errors** - Missing closures, reserved words

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](vision-ux-development-guide.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request with detailed description

### **Code Standards**
- TypeScript for all new code
- Comprehensive type definitions  
- Accessibility testing required
- Mobile responsiveness validated

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [Development Guide](vision-ux-development-guide.md)
- **Project Progress**: [Progress Tracking](PROJECT_PROGRESS.md)
- **Session Notes**: [Development Sessions](SESSION_HANDOFF_NOTES.md)

## 🌟 Why Vision UX?

### **For Researchers**
- **All-in-One Platform**: No more switching between multiple tools
- **Professional Results**: Publication-ready statistical analysis
- **Time Saving**: Integrated workflow from study creation to insights

### **For Organizations**  
- **Cost Effective**: Replace expensive enterprise research tools
- **Scalable**: Handle studies from 10 to 10,000+ participants
- **Compliant**: Built-in accessibility and privacy compliance

### **For Developers**
- **Modern Stack**: React, TypeScript, modern development practices
- **Extensible**: Plugin architecture for custom research methods
- **Open Source**: Community-driven development and enhancement

---

<p align="center">
  <strong>Transform your UX research with Vision UX</strong><br>
  Built with ❤️ for the UX research community
</p>

<p align="center">
  <a href="https://github.com/rezurx/VisionUX/issues">Report Bug</a> •
  <a href="https://github.com/rezurx/VisionUX/issues">Request Feature</a> •
  <a href="#contributing">Contribute</a>
</p>