# AI Recruitment Frontend

A modern React-based frontend for the AI-powered talent management system. This application provides intuitive interfaces for managing candidate profiles, performing semantic search, and managing AI prompt templates.

## 🚀 Features

- **Candidate Management**: Complete CRUD operations for candidate profiles
- **Resume Parsing**: AI-powered resume parsing and automatic profile creation
- **Semantic Search**: Natural language search with hybrid scoring (semantic + keyword)
- **Prompt Template Management**: Manage AI prompt templates for profile summarization
- **Bulk AI Operations**: Regenerate AI summaries for all candidates
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live status updates for long-running operations

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components
- **State Management**: React Hooks
- **HTTP Client**: Fetch API with custom wrapper
- **Icons**: Lucide React
- **Forms**: React Hook Form

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- AI Recruitment Backend running (local or cloud)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd AiRecruitmentFrontend
npm install --legacy-peer-deps
```

### 2. Environment Configuration

```bash
# Copy the environment sample
cp env.sample .env.local

# Edit .env.local with your configuration
# For local development:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# For production:
NEXT_PUBLIC_API_URL=https://ai-recruitment-backend.grayisland-39090923.eastasia.azurecontainerapps.io/api
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔧 Environment Configuration

The application uses environment variables for configuration. See `env.sample` for all available options:

### Key Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_DEBUG` | Enable debug features | `true` |
| `NEXT_PUBLIC_DEFAULT_PAGE_SIZE` | Default pagination size | `20` |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout (ms) | `30000` |

### Environment Setup for Different Stages

#### Development (Local Backend)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

#### Production (Azure Cloud)
```bash
NEXT_PUBLIC_API_URL=https://ai-recruitment-backend.grayisland-39090923.eastasia.azurecontainerapps.io/api
NODE_ENV=production
NEXT_PUBLIC_DEBUG=false
```

## 📁 Project Structure

```
AiRecruitmentFrontend/
├── app/                          # Next.js app directory
│   ├── candidates/              # Candidate management pages
│   │   ├── [id]/               # Individual candidate details
│   │   ├── create/             # Create new candidate
│   │   └── page.tsx            # Candidates list (main page)
│   ├── search/                 # Semantic search page
│   ├── templates/              # Prompt template management
│   ├── chatbot/                # AI chatbot interface (future)
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Dashboard/home page
├── components/                  # Reusable components
│   ├── ui/                     # UI component library
│   └── layout/                 # Layout components
├── lib/                        # Utilities and configurations
│   ├── api.ts                  # API client and types
│   └── utils.ts                # Helper utilities
├── hooks/                      # Custom React hooks
├── public/                     # Static assets
└── styles/                     # Global styles
```

## 🔌 API Integration

The frontend integrates with the AI Recruitment Backend through a custom API client (`lib/api.ts`). Key features:

- **Automatic timeout handling** (30s default)
- **Error handling and retry logic**
- **TypeScript interfaces** for all API responses
- **Request/response logging** in development

### Key API Endpoints

- `GET /candidates` - List candidates with pagination
- `POST /candidates/semantic-search` - Semantic search
- `POST /candidates/parse-resume` - Resume parsing
- `GET /candidates/ai-summary/prompt-templates` - Template management
- `POST /candidates/ai-summary/bulk-regenerate` - Bulk operations

## 📱 Key Features

### 1. Candidate Management
- **List View**: Paginated candidate list with search
- **Profile Creation**: Resume upload → AI parsing → Manual review → Profile creation
- **Profile Editing**: Module-based editing (basic info, career, skills, education, etc.)
- **Status Management**: Activate/deactivate candidates

### 2. Semantic Search
- **Natural Language**: Search using descriptive queries
- **Hybrid Scoring**: Combines semantic similarity and keyword matching
- **Adjustable Precision**: Broad/Balanced/Narrow search modes
- **Rich Results**: Relevance scores, confidence levels, detailed breakdowns

### 3. Template Management
- **CRUD Operations**: Create, edit, activate, delete prompt templates
- **Template Validation**: Ensures required placeholders are present
- **Bulk Regeneration**: Update all candidate AI summaries with new templates

### 4. Resume Processing
- **PDF Upload**: Drag-and-drop resume upload
- **AI Parsing**: Extract candidate information automatically
- **Review & Edit**: Manual review before profile creation
- **AI Finalization**: Generate summaries and embeddings

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme support (via next-themes)
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: User-friendly error messages and recovery
- **Accessibility**: WCAG 2.1 AA compliant
- **Real-time Feedback**: Toast notifications for all actions

## 🔍 Search Functionality

### Search Modes
- **Broad** (0.3 threshold): More results, less precise
- **Balanced** (0.7 threshold): Good balance of results and precision
- **Narrow** (0.9 threshold): Fewer results, more precise

### Example Queries
- "Python developer with machine learning experience"
- "Full-stack developer with React and Node.js"
- "Senior software engineer with cloud experience"
- "Data scientist with 5+ years experience"

## 📊 Performance

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Next.js Image component
- **API Caching**: Strategic response caching
- **Debounced Search**: 500ms debounce for search inputs
- **Virtual Scrolling**: For large candidate lists (if needed)

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

Make sure to set these in your production environment:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
NODE_ENV=production
NEXT_PUBLIC_DEBUG=false
```

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `NEXT_PUBLIC_API_URL` in `.env.local`
   - Ensure backend is running and accessible
   - Verify CORS settings on backend

2. **Resume Upload Failed**
   - Check file size limits (10MB default)
   - Ensure file is PDF format
   - Verify backend has proper file upload handling

3. **Search Not Working**
   - Check if candidates have AI embeddings generated
   - Verify semantic search is enabled on backend
   - Try broader search thresholds

4. **Build Errors**
   - Run `npm install --legacy-peer-deps` for dependency conflicts
   - Check TypeScript errors with `npm run lint`

### Development Debug

Enable debug mode by setting:
```bash
NEXT_PUBLIC_DEBUG=true
```

This enables:
- Console logging for API requests
- Error details in UI
- Development tools

## 📈 Future Enhancements

- **Advanced Search Filters**: Industry, location, salary ranges
- **Candidate Comparison**: Side-by-side candidate comparison
- **Interview Scheduling**: Integrated calendar system
- **Email Integration**: Direct communication with candidates
- **Analytics Dashboard**: Search analytics and system metrics
- **Mobile App**: React Native companion app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Note**: This frontend is designed to work with the AI Recruitment Backend. Make sure the backend is properly configured and running before using the frontend features. 