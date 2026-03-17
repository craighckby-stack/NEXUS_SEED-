# 🧠 Safer Growing Intelligence: DAF Project Dashboard

A comprehensive web interface for monitoring and interacting with the Developmental AGI Framework (DAF) - a structured approach to growing safe, general intelligence.

## 🎯 Project Overview

This dashboard provides real-time monitoring and control of the Safer Growing Intelligence system, which focuses on **how** an intelligence learns rather than just **what** it knows. The system treats LLMs as output mechanisms while using custom Python classes as the brain structure for memory, safety, and learning strategy.

## 🏗️ Architecture Components

### Core Systems
- **Persistent Memory System**: Knowledge graph with consolidation and pruning
- **Meta Learning**: Learning strategy evaluation and optimization
- **Virtual Environment**: Structured curriculum with domain-specific testing
- **Emergent Behavior Detector**: Safety monitoring and anomaly detection
- **Real-time LLM Integration**: Connection to high-end models for reasoning

## 🚀 Features

### 📊 Dashboard Overview
- **System Status**: Real-time monitoring of AGI system health
- **Development Progress**: Track progression through developmental stages
- **Memory Statistics**: Monitor knowledge acquisition and consolidation
- **Safety Alerts**: Immediate notification of anomalous behavior

### 🧠 Memory System
- **Knowledge Graph Visualization**: Interactive display of concepts and relationships
- **Memory Management**: Add, search, and filter memory concepts
- **Confidence Tracking**: Monitor reliability of stored knowledge
- **Category Organization**: Organize memories by domain (Ethics, Logic, Social, Physics)

### 📈 AGI Status Monitoring
- **Performance Metrics**: CPU, memory, and processing speed monitoring
- **Developmental Levels**: Track progression through Caveman → Child → Apprentice → Scholar → Elder
- **System Health**: Overall system status and safety indicators
- **Session Management**: Monitor active AGI sessions

### 🎓 Virtual Environment
- **Curriculum Management**: Structured learning paths across domains
- **Progress Tracking**: Monitor completion of training exercises
- **Performance Scoring**: Evaluate AGI performance in different scenarios
- **Domain-Specific Testing**: Ethics, Logic, Social, and Physics challenges

### 🧮 Meta Learning Analytics
- **Strategy Performance**: Effectiveness analysis of learning approaches
- **Usage Statistics**: Track frequency and success of different strategies
- **AI Recommendations**: Intelligent suggestions for optimization
- **Learning Insights**: Pattern recognition and improvement suggestions

### 🛡️ Safety Monitoring
- **Real-time Detection**: Continuous monitoring for emergent behaviors
- **Alert Management**: Categorize and resolve safety alerts
- **Threshold Configuration**: Customize safety parameters
- **Emergency Protocols**: Automated response to critical anomalies

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript 5** for type safety
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library
- **Lucide React** icons

### Backend
- **Next.js API Routes** for server-side logic
- **Prisma ORM** with SQLite database
- **Real-time updates** with server-sent events

### Database Schema
- **AGIMemory**: Stored concepts and relationships
- **AGISession**: System sessions and status
- **LearningStrategy**: Strategy effectiveness tracking
- **EmergentAlert**: Safety anomaly records
- **VirtualEnvironment**: Training session data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safer-growing-intelligence-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── memory/        # Memory system API
│   │   ├── status/        # System status API
│   │   ├── alerts/        # Safety alerts API
│   │   ├── learning/      # Learning strategies API
│   │   └── environment/   # Virtual environment API
│   ├── page.tsx          # Main dashboard
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── MemorySystem.tsx  # Memory management
│   ├── AGIStatus.tsx    # System monitoring
│   ├── VirtualEnvironment.tsx # Training environment
│   ├── MetaLearning.tsx # Learning analytics
│   └── EmergentBehaviorDetector.tsx # Safety monitoring
├── hooks/               # Custom React hooks
├── lib/                # Utility functions
└── prisma/             # Database schema
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with:
```
DATABASE_URL="file:./dev.db"
```

### Database Setup
The application uses SQLite with Prisma ORM. The schema includes:
- Memory concepts with confidence scores
- Learning strategies with effectiveness tracking
- Safety alerts with severity levels
- Virtual environment sessions

## 🎯 Usage Guide

### Monitoring the AGI System
1. **Overview Tab**: Get a quick snapshot of system health and progress
2. **Memory Tab**: Explore the knowledge graph and manage concepts
3. **Status Tab**: Monitor real-time performance metrics
4. **Environment Tab**: Manage training curriculum and sessions
5. **Learning Tab**: Analyze strategy effectiveness
6. **Safety Tab**: Monitor and resolve safety alerts

### Managing Memory
- **Add Concepts**: Create new memory entries with confidence levels
- **Search & Filter**: Find specific concepts or categories
- **View Relationships**: Explore knowledge connections
- **Track Confidence**: Monitor reliability of stored information

### Safety Monitoring
- **Real-time Alerts**: Immediate notification of anomalies
- **Severity Levels**: Categorize alerts by importance
- **Resolution Management**: Track and resolve safety issues
- **Configuration**: Customize detection thresholds

## 🔒 Safety Features

### Emergent Behavior Detection
- **Capability Leap Detection**: Identify sudden performance increases
- **Behavioral Anomaly Monitoring**: Detect unusual response patterns
- **Knowledge Jump Recognition**: Flag unexpected knowledge acquisition
- **Safety Threshold Enforcement**: Maintain safe operational boundaries

### Developmental Safeguards
- **Stage-Based Progression**: Controlled advancement through levels
- **Baseline Comparison**: Compare behavior against expected patterns
- **Human Review Required**: Critical anomalies need human approval
- **Emergency Protocols**: Automated response to dangerous behavior

## 📊 API Endpoints

### Memory System
- `GET /api/memory` - Retrieve all memory concepts
- `POST /api/memory` - Add new memory concept

### System Status
- `GET /api/status` - Get current system status

### Safety Alerts
- `GET /api/alerts` - Retrieve all alerts
- `POST /api/alerts` - Create new alert

### Learning Analytics
- `GET /api/learning` - Get learning strategies
- `POST /api/learning` - Update strategy performance

### Virtual Environment
- `GET /api/environment` - Get training sessions
- `POST /api/environment` - Start new session
- `PUT /api/environment` - Update session progress

## 🤝 Contributing

This project is part of the Safer Growing Intelligence initiative. Contributions are welcome for:

- **UI/UX Improvements**: Enhance dashboard usability
- **Safety Features**: Strengthen monitoring and detection
- **Performance Optimization**: Improve system responsiveness
- **Documentation**: Expand guides and API documentation

## 📜 License

This project maintains the same license as the original Safer Growing Intelligence repository.

## 🔗 Related Projects

- [Safer Growing Intelligence - Core Framework](https://github.com/craighckby-stack/Safer-Growing-Intelligence-DAF-)
- [Developmental AGI Framework Documentation](https://github.com/craighckby-stack/Safer-Growing-Intelligence-DAF-/blob/main/README.md)

---

Built with ❤️ for the future of safe artificial intelligence development.