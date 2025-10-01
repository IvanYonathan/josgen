# JosGen Development Guide

This guide explains the project setup, development commands, architecture, and development patterns for the JosGen application.

## 🚀 Getting Started & Development Commands

### **Initial Project Setup**

```bash
# 1. Clone the repository
git clone <repository-url>
cd josgen

# 2. Install PHP dependencies
composer install

# 3. Install Node.js dependencies
npm install

# 4. Copy environment file
cp .env.example .env

# 5. Generate application key
php artisan key:generate

# 6. Run database migrations (if database is configured)
php artisan migrate

# 7. Start development servers
php artisan serve      # Laravel backend (usually runs on http://localhost:8000)
npm run dev            # Vite frontend dev server (usually runs on http://localhost:5173)
```

### **Daily Development Commands**

```bash
# Start both servers (run in separate terminals)
php artisan serve      # Terminal 1: Backend API server
npm run dev           # Terminal 2: Frontend dev server with hot reload
```

### **After Git Pull - Dependency Updates**

When another teammate adds new Laravel or React libraries, run these commands after pulling:

```bash
# 1. Update PHP dependencies (if composer.lock changed)
composer install

# 2. Update Node.js dependencies (if package-lock.json changed)
npm install

# 3. Run any new database migrations
php artisan migrate

# 4. Clear Laravel caches (if needed)
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# 5. Restart servers
php artisan serve      # Restart backend
npm run dev           # Restart frontend
```

### **Build Commands**

```bash
# Development build (MUST DO THIS BEFORE PUSHING OR AFTER DOING FRONTEND CHANGES TO CHECK BUILD ERROR)
npm run build

# Production build (optimized)
npm run build --mode production

# Check for TypeScript errors
npm run type-check

# Run linting (if configured)
npm run lint
```

### **Useful Laravel Commands**

```bash
# Database
php artisan migrate                    # Run migrations
php artisan migrate:rollback          # Rollback last migration
php artisan migrate:fresh --seed      # Fresh migration with seeders
php artisan db:seed                   # Run seeders

# Cache management
php artisan config:cache              # Cache config
php artisan route:cache               # Cache routes
php artisan view:cache                # Cache views
php artisan optimize:clear            # Clear all caches

# Debugging
php artisan tinker                    # Laravel REPL
php artisan route:list                # List all routes
php artisan queue:work                # Process queue jobs
```

### **Troubleshooting Common Issues**

```bash
# If frontend build fails
rm -rf node_modules package-lock.json
npm install

# If backend has issues
composer dump-autoload
php artisan config:clear
php artisan cache:clear

# If database issues
php artisan migrate:fresh
php artisan db:seed

# Permission issues (Linux/Mac)
chmod -R 775 storage bootstrap/cache
```

---

## 🏗️ Project Architecture Overview

The project follows a **modular, feature-based architecture** with clear separation of concerns:

```
resources/js/
├── components/          # Reusable UI components
├── pages/              # Page components and routes
├── types/              # TypeScript type definitions
├── lib/                # API calls, utilities, and services
├── i18n/               # Internationalization files
├── layouts/            # Layout components
└── hooks/              # Custom React hooks
```

---

## 📁 Types Folder (`/types/`)

The types folder contains **TypeScript type definitions** organized by feature/domain.

### Structure Pattern
```
types/
├── division/
│   ├── division.ts           # Main division types
│   └── members/
│       └── division-members.ts
├── event/
│   └── event.ts
├── user/
│   └── user.ts
├── api/
│   └── response.ts           # Common API response types
└── index.d.ts                # Global type exports
```

### Naming Conventions

#### 1. **Entity Types** (Main data structures)
```typescript
export interface Division {
  id: number;
  name: string;
  description: string | null;
  leader_id: number | null;
  leader?: User;
  created_at: string;
  updated_at: string;
  // Computed fields
  members_count?: number;
  events_count?: number;
}
```

#### 2. **Request Types** (API input parameters)
```typescript
export interface CreateDivisionRequest {
  name: string;
  description?: string;
  leader_id?: number;
}

export interface UpdateDivisionRequest {
  id: number;
  name: string;
  description?: string;
  leader_id?: number;
}
```

#### 3. **Response Types** (API responses)
```typescript
export interface DivisionResponse {
  division: Division;
}

export interface DivisionListResponse {
  divisions: Division[];
  total?: number;
}
```

### Creating New Types

1. **Create feature folder**: `types/feature-name/`
2. **Main entity file**: `feature-name.ts`
3. **Sub-entities**: `feature-name/sub-feature/sub-feature.ts`

**Example for "Project" feature:**
```typescript
// types/project/project.ts
export interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed';
  division_id: number;
  division?: Division;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  division_id: number;
}

export interface ProjectResponse {
  project: Project;
}
```

---

## 🔧 Lib Folder (`/lib/`)

The lib folder contains **API calls, utilities, and services**.

### Structure Pattern
```
lib/
├── api/                    # API functions by feature
│   ├── auth/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── me.ts
│   ├── division/
│   │   ├── list-divisions.ts
│   │   ├── get-division.ts
│   │   ├── create-division.ts
│   │   ├── update-division.ts
│   │   ├── delete-division.ts
│   │   └── members/
│   │       ├── list-division-members.ts
│   │       └── add-division-members.ts
│   └── project/            # New feature example
│       ├── list-projects.ts
│       ├── get-project.ts
│       └── create-project.ts
├── axios/                  # HTTP client setup
├── auth/                   # Authentication utilities
└── utils.ts                # Common utilities
```

### API Function Pattern

Each API function follows this template:

```typescript
// lib/api/division/list-divisions.ts
import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { Division } from "@/types/division/division";

export async function listDivisions(): Promise<{ divisions: Division[], total: number }> {
  const response = await AxiosJosgen.post<ApiResponse<Division[]>>("/division/list", {});
  if (!response.data.status) throw new Error(response.data.message || 'Failed to load divisions');
  return {
    divisions: response.data.data,
    total: response.data.total || response.data.data.length
  };
}
```

### Creating New API Functions

**Template for CRUD operations:**

```typescript
// lib/api/project/list-projects.ts
export async function listProjects(): Promise<{ projects: Project[], total: number }> {
  const response = await AxiosJosgen.post<ApiResponse<Project[]>>("/project/list", {});
  if (!response.data.status) throw new Error(response.data.message || 'Failed to load projects');
  return {
    projects: response.data.data,
    total: response.data.total || response.data.data.length
  };
}

// lib/api/project/create-project.ts
export async function createProject(request: CreateProjectRequest): Promise<ProjectResponse> {
  const response = await AxiosJosgen.post<ApiResponse<Project>>("/project/create", request);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to create project');
  return { project: response.data.data };
}

// lib/api/project/get-project.ts
export async function getProject(request: GetProjectRequest): Promise<ProjectResponse> {
  const response = await AxiosJosgen.post<ApiResponse<Project>>("/project/get", request);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to get project');
  return { project: response.data.data };
}
```

---

## 🌍 i18n Folder (`/i18n/`)

Internationalization setup supporting multiple languages.

### Structure
```
i18n/
├── config.ts              # i18n configuration
├── en/                     # English translations
│   ├── translation.ts      # Main translation aggregator
│   ├── common.json         # Common terms
│   ├── dashboard.json      # Dashboard-specific
│   ├── division.json       # Division-specific
│   └── login.json          # Auth-specific
└── id/                     # Indonesian translations
    ├── translation.ts      # Main translation aggregator
    ├── common.json
    ├── dashboard.json
    └── division.json
```

### Translation File Structure

**Feature-specific translations** (`en/division.json`):
```json
{
  "title": "Divisions",
  "description": "View and Manage Divisions here",
  "createDivision": {
    "title": "Create New Division",
    "form": {
      "name": {
        "label": "Division Name",
        "placeholder": "Enter division name"
      },
      "description": {
        "label": "Description",
        "placeholder": "Enter division description (optional)"
      }
    },
    "button": {
      "create": "Create Division",
      "cancel": "Cancel"
    }
  }
}
```

### Using Translations in Components

```typescript
import { useTranslation } from '@/hooks/use-translation';

export function ProjectPage() {
  const { t } = useTranslation('project'); // Load project translations

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('createProject.button.create')}</button>
    </div>
  );
}
```

### Adding New Translations

1. **Create feature translation file**: `en/feature-name.json`
2. **Add Indonesian version**: `id/feature-name.json`
3. **Import in translation aggregator**: `en/translation.ts`

**Example for Project:**
```json
// en/project.json
{
  "title": "Projects",
  "description": "Manage your projects",
  "createProject": {
    "title": "Create New Project",
    "form": {
      "name": {
        "label": "Project Name",
        "placeholder": "Enter project name"
      }
    }
  }
}
```

---

## 🎨 Frontend Component Structure

### Page Component Organization

```
pages/
├── feature-name/
│   ├── feature-name-page.tsx          # Main page component
│   ├── components/                     # Page-specific components
│   │   ├── create-feature-dialog.tsx
│   │   ├── feature-list-item.tsx
│   │   └── edit-feature-form.tsx
│   └── containers/                     # Complex logic containers (optional)
│       └── feature-data-container.tsx
```

### Naming Conventions

- **Page Components**: `feature-name-page.tsx` (e.g., `division-page.tsx`)
- **Page-specific Components**: `action-feature-component.tsx` (e.g., `create-division-sheet.tsx`)
- **Containers**: `feature-purpose-container.tsx` (for complex state/logic)

### Page Component Template

```typescript
// pages/project/project-page.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Project } from '@/types/project/project';
import { listProjects } from '@/lib/api/project/list-projects';

export default function ProjectPage() {
  const { t } = useTranslation('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listProjects();
      setProjects(response.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={() => {/* Open create dialog */}}>
          {t('createProject.button.create')}
        </Button>
      </div>

      {/* Loading/Error/Content states */}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{project.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Page-specific Components

**Create components in `/components/` subdirectory:**

```typescript
// pages/project/components/create-project-dialog.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { CreateProjectRequest, ProjectResponse } from '@/types/project/project';
import { createProject } from '@/lib/api/project/create-project';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: ProjectResponse) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
  const { t } = useTranslation('project');
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    division_id: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await createProject(formData);
      onProjectCreated(response);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createProject.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder={t('createProject.form.name.placeholder')}
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          {/* Add more form fields */}
          <Button type="submit" disabled={loading}>
            {t('createProject.button.create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔌 Adding Backend APIs (Division Example)

### 1. **Create Laravel API Endpoints**

```php
// routes/api.php
Route::middleware(['auth:web,sanctum'])->group(function () {
    Route::prefix('project')->group(function () {
        Route::post('list', [ProjectController::class, 'list']);
        Route::post('get', [ProjectController::class, 'get']);
        Route::post('create', [ProjectController::class, 'create']);
        Route::post('update', [ProjectController::class, 'update']);
        Route::post('delete', [ProjectController::class, 'delete']);
    });
});
```

### 2. **Create Controller**

```php
// app/Http/Controllers/Api/ProjectController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function list(Request $request)
    {
        $projects = Project::with(['division'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Projects retrieved successfully',
            'data' => $projects,
            'total' => $projects->count()
        ]);
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'division_id' => 'required|exists:divisions,id'
        ]);

        $project = Project::create($validated);
        $project->load(['division']);

        return response()->json([
            'status' => true,
            'message' => 'Project created successfully',
            'data' => $project
        ]);
    }
}
```

### 3. **Create Model**

```php
// app/Models/Project.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    protected $fillable = [
        'name',
        'description',
        'division_id',
        'status',
        'start_date',
        'end_date'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date'
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }
}
```

### 4. **Frontend Integration Steps**

**Step 1: Create Types**
```typescript
// types/project/project.ts
export interface Project {
  id: number;
  name: string;
  description?: string;
  division_id: number;
  division?: Division;
  status: 'planning' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}
```

**Step 2: Create API Functions**
```typescript
// lib/api/project/list-projects.ts
export async function listProjects(): Promise<{ projects: Project[], total: number }> {
  const response = await AxiosJosgen.post<ApiResponse<Project[]>>("/project/list", {});
  if (!response.data.status) throw new Error(response.data.message || 'Failed to load projects');
  return {
    projects: response.data.data,
    total: response.data.total || response.data.data.length
  };
}
```

**Step 3: Create Page Component**
```typescript
// pages/project/project-page.tsx
export default function ProjectPage() {
  // Implementation as shown in template above
}
```

**Step 4: Add Route**
```typescript
// pages/app.tsx
<Route path="/project" element={<ProjectPage />} />
```

**Step 5: Add to Navigation**
```typescript
// components/app-sidebar.tsx
{
  title: 'Projects',
  href: '/project',
  icon: Briefcase,
},
```

---

## 🚀 Development Workflow

### 1. **Planning New Feature**
1. Define data structure and API endpoints
2. Create TypeScript types
3. Implement backend API
4. Create frontend API functions
5. Build page components
6. Add translations
7. Add to navigation

### 2. **Code Organization Best Practices**
- **One feature per folder** in types, api, pages
- **Consistent naming** across all layers
- **Reusable components** in `/components/ui/`
- **Feature-specific components** in `/pages/feature/components/`
- **Mock data during development** with TODO comments for API integration

### 3. **Testing Strategy**
- Test API endpoints with Postman/Insomnia
- Add error handling for all API calls
- Implement loading and error states
- Use TypeScript for type safety

---

## 📋 Quick Reference

### File Naming Patterns
- **Pages**: `feature-name-page.tsx`
- **Types**: `feature-name.ts`
- **API**: `action-feature.ts` (e.g., `list-projects.ts`)
- **Components**: `purpose-feature-component.tsx`
- **Translations**: `feature-name.json`

### Import Patterns
```typescript
// Types
import { Project } from '@/types/project/project';

// API
import { listProjects } from '@/lib/api/project/list-projects';

// Components
import { Button } from '@/components/ui/button';

// Hooks
import { useTranslation } from '@/hooks/use-translation';
```

### Common Patterns
- **Loading states**: `const [loading, setLoading] = useState(true);`
- **Error handling**: `const [error, setError] = useState<string | null>(null);`
- **API calls**: Always wrap in try-catch with loading states
- **Translations**: Use `useTranslation('feature-name')` hook

---

## ⚡ Quick Command Reference

### **Daily Development**
```bash
# Start development (2 terminals)
php artisan serve    # Backend
npm run dev         # Frontend
```

### **After Git Pull**
```bash
composer install    # If composer.lock changed
npm install         # If package-lock.json changed
php artisan migrate # Run new migrations
```

### **When Things Break**
```bash
# Clear all caches
php artisan optimize:clear

# Reinstall dependencies
rm -rf node_modules && npm install
composer dump-autoload
```

### **Database Reset**
```bash
php artisan migrate:fresh --seed
```

---

This guide provides the foundation for consistent, scalable development in the JosGen application. Follow these patterns to maintain code quality and team productivity.