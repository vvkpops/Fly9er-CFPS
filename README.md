# CFPS WxRecall Scraper - Complete File Structure

## 🏗️ Project Structure

```
cfps-wxrecall-scraper/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Tabs.jsx
│   │   ├── configuration/
│   │   │   ├── ConfigurationPanel.jsx
│   │   │   └── GFARegionMap.jsx
│   │   ├── dataSelection/
│   │   │   ├── DataSelectionPanel.jsx
│   │   │   └── SelectionControls.jsx
│   │   ├── controls/
│   │   │   └── ControlPanel.jsx
│   │   ├── progress/
│   │   │   ├── ProgressPanel.jsx
│   │   │   └── StatisticsPanel.jsx
│   │   ├── results/
│   │   │   ├── TabbedResults.jsx
│   │   │   ├── ResultsOverview.jsx
│   │   │   ├── AlphanumericResults.jsx
│   │   │   ├── ImageResults.jsx
│   │   │   └── ImageCategoryResults.jsx
│   │   └── export/
│   │       └── ExportPanel.jsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── weatherApi.js
│   │   │   └── gfaApi.js
│   │   ├── export/
│   │   │   └── exportService.js
│   │   └── weatherFetchingService.js
│   ├── hooks/
│   │   ├── useWeatherData.js
│   │   ├── useScrapingState.js
│   │   └── useFetchProgress.js
│   ├── utils/
│   │   └── constants/
│   │       ├── gfaRegions.js
│   │       ├── dataTypes.js
│   │       └── apiEndpoints.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 📁 File Descriptions

### **Core Application Files**
- **`App.jsx`** - Main application component that orchestrates all other components
- **`main.jsx`** - React app entry point and root rendering
- **`index.css`** - Global styles and Tailwind CSS imports

### **Components Structure**

#### **🔧 Common Components** (`components/common/`)
- **`Button.jsx`** - Reusable button component with variants and sizes
- **`Card.jsx`** - Wrapper component for consistent card layouts
- **`Tabs.jsx`** - Tabbed interface component with panels

#### **⚙️ Configuration Components** (`components/configuration/`)
- **`ConfigurationPanel.jsx`** - Site configuration and settings panel
- **`GFARegionMap.jsx`** - GFA region mapping and visualization

#### **📋 Data Selection Components** (`components/dataSelection/`)
- **`DataSelectionPanel.jsx`** - Main data selection interface
- **`SelectionControls.jsx`** - Reusable selection control buttons

#### **🎛️ Control Components** (`components/controls/`)
- **`ControlPanel.jsx`** - Action buttons for fetching, debugging, testing

#### **📊 Progress Components** (`components/progress/`)
- **`ProgressPanel.jsx`** - Real-time progress tracking
- **`StatisticsPanel.jsx`** - Performance metrics and statistics

#### **📋 Results Components** (`components/results/`)
- **`TabbedResults.jsx`** - Main tabbed results interface
- **`ResultsOverview.jsx`** - Summary and overview tab
- **`AlphanumericResults.jsx`** - Text-based weather data display
- **`ImageResults.jsx`** - Weather imagery with category tabs
- **`ImageCategoryResults.jsx`** - Individual image category renderer

#### **💾 Export Components** (`components/export/`)
- **`ExportPanel.jsx`** - Data export controls (JSON, CSV, HTML)

### **Services Structure**

#### **🌐 API Services** (`services/api/`)
- **`weatherApi.js`** - Core weather API functions
- **`gfaApi.js`** - GFA-specific API handling

#### **📤 Export Services** (`services/export/`)
- **`exportService.js`** - Data export functionality

#### **🔄 Main Services**
- **`weatherFetchingService.js`** - Orchestrates weather data fetching

### **Custom Hooks** (`hooks/`)
- **`useWeatherData.js`** - Weather data state management
- **`useScrapingState.js`** - Scraping activity state
- **`useFetchProgress.js`** - Individual fetch progress tracking

### **Utilities** (`utils/constants/`)
- **`gfaRegions.js`** - GFA region mappings and metadata
- **`dataTypes.js`** - Data type definitions and options
- **`apiEndpoints.js`** - API URLs and configuration

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🎯 Key Features

### **Modular Architecture**
- **Separation of Concerns** - Each file has a single responsibility
- **Reusable Components** - Common components used throughout the app
- **Custom Hooks** - Encapsulated state logic
- **Service Layer** - API calls abstracted from components

### **Advanced UI/UX**
- **Tabbed Interface** - Reduces scrolling with organized data viewing
- **Real-time Progress** - Individual fetch status tracking
- **Smart Selection Controls** - Bulk selection with essentials shortcuts
- **Responsive Design** - Works on all screen sizes

### **Technical Excellence**
- **TypeScript Ready** - Structured for easy TypeScript migration
- **Performance Optimized** - Efficient state management and re-rendering
- **Error Handling** - Comprehensive error boundaries and user feedback
- **Export Capabilities** - Multiple format support (JSON, CSV, HTML)

## 🔧 Configuration

### **Environment Setup**
The application uses environment variables for API configuration. Create a `.env` file:

```env
VITE_CORS_PROXY=https://corsproxy.io/?
VITE_BASE_API_URL=https://plan.navcanada.ca/weather/api/alpha/
```

### **Tailwind Configuration**
Tailwind CSS is configured for the design system. Modify `tailwind.config.js` for customization.

### **Vite Configuration**
The project uses Vite for fast development and building. Configuration in `vite.config.js`.

## 📚 Development Guidelines

### **File Naming Conventions**
- **Components**: PascalCase (e.g., `ConfigurationPanel.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useWeatherData.js`)
- **Services**: camelCase (e.g., `weatherApi.js`)
- **Constants**: camelCase files, UPPER_CASE exports

### **Import Structure**
```javascript
// External libraries
import React, { useState } from 'react';
import { Play, Square } from 'lucide-react';

// Internal components
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';

// Services and hooks
import { useWeatherData } from '../../hooks/useWeatherData.js';

// Constants and utilities
import { gfaRegionMapping } from '../../utils/constants/gfaRegions.js';
```

### **Component Structure**
```javascript
// Component imports
// Constants/types
// Main component function
// Helper functions (if needed)
// Export default
```

This structure provides a scalable, maintainable, and professional codebase that follows React best practices and modern development patterns.
