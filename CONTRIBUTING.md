<div align="center">

# 🤝 Contributing to ErrorX Forum

> **Thank you for your interest in contributing to ErrorX Forum!**

[![Contributors Welcome](https://img.shields.io/badge/Contributors-Welcome-brightgreen?style=for-the-badge)](https://github.com/FakeErrorX/errorx-forum)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](https://github.com/FakeErrorX/errorx-forum/pulls)
[![Issues Welcome](https://img.shields.io/badge/Issues-Welcome-brightgreen?style=for-the-badge)](https://github.com/FakeErrorX/errorx-forum/issues)

*Help us build the best forum experience for developers and tech enthusiasts*

</div>

---

## 📋 Table of Contents

- [🎯 How to Contribute](#-how-to-contribute)
- [🐛 Reporting Bugs](#-reporting-bugs)
- [✨ Suggesting Features](#-suggesting-features)
- [🔧 Development Setup](#-development-setup)
- [📝 Code Style Guide](#-code-style-guide)
- [🧪 Testing Guidelines](#-testing-guidelines)
- [📤 Pull Request Process](#-pull-request-process)
- [🏷️ Commit Convention](#-commit-convention)
- [📚 Documentation](#-documentation)
- [❓ Questions & Support](#-questions--support)

---

## 🎯 How to Contribute

We welcome contributions from the community! Here are the main ways you can help:

### **🔍 Ways to Contribute**

| Type | Description | Impact |
|------|-------------|---------|
| 🐛 **Bug Reports** | Report issues and bugs | High |
| ✨ **Feature Requests** | Suggest new features | High |
| 🔧 **Code Contributions** | Fix bugs, add features | Very High |
| 📝 **Documentation** | Improve docs and guides | Medium |
| 🧪 **Testing** | Write tests, test features | High |
| 🎨 **UI/UX** | Design improvements | Medium |
| 🌐 **Translations** | Add language support | Medium |

---

## 🐛 Reporting Bugs

### **Before Reporting**

1. **Search existing issues** to avoid duplicates
2. **Check if it's already fixed** in the latest version
3. **Verify it's a bug** and not a feature request

### **Bug Report Template**

When reporting a bug, please include:

```markdown
## 🐛 Bug Description
**Clear and concise description of the bug**

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## 🎯 Expected Behavior
**What you expected to happen**

## 📱 Actual Behavior
**What actually happened**

## 🖼️ Screenshots
**If applicable, add screenshots**

## 💻 Environment
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Browser: [e.g., Chrome 91, Firefox 89, Safari 14]
- Node.js: [e.g., 18.17.0]
- Next.js: [e.g., 15.0.0]

## 📋 Additional Context
**Any other context about the problem**
```

---

## ✨ Suggesting Features

### **Feature Request Template**

```markdown
## ✨ Feature Description
**Clear and concise description of the feature**

## 🎯 Problem Statement
**What problem does this feature solve?**

## 💡 Proposed Solution
**Describe your proposed solution**

## 🔄 Alternatives Considered
**Describe any alternative solutions you've considered**

## 📱 Mockups/Examples
**If applicable, add mockups or examples**

## 🎯 Use Cases
**Who would use this feature and how?**

## 📋 Additional Context
**Any other context about the feature request**
```

---

## 🔧 Development Setup

### **Prerequisites**

- **Node.js** 18+ 
- **PostgreSQL** database
- **Git** for version control
- **VS Code** (recommended) or your preferred editor

### **1️⃣ Fork & Clone**

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/errorx-forum.git
cd errorx-forum

# Add upstream remote
git remote add upstream https://github.com/FakeErrorX/errorx-forum.git
```

### **2️⃣ Install Dependencies**

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### **3️⃣ Environment Setup**

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Make sure to set up your database and other services
```

### **4️⃣ Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### **5️⃣ Start Development**

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

**🎉 Open [http://localhost:3000](http://localhost:3000) to view the application!**

---

## 📝 Code Style Guide

### **General Guidelines**

- **Use TypeScript** for all new code
- **Follow existing patterns** in the codebase
- **Write clean, readable code**
- **Add comments** for complex logic
- **Use meaningful variable names**

### **File Structure**

```
src/
├── app/                    # Next.js App Router
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── seo/              # SEO components
├── lib/                  # Utility libraries
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

### **Naming Conventions**

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `user-profile.tsx` |
| **Components** | PascalCase | `UserProfile` |
| **Functions** | camelCase | `getUserProfile` |
| **Variables** | camelCase | `userProfile` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL` |
| **Types** | PascalCase | `UserProfile` |
| **Interfaces** | PascalCase | `IUserProfile` |

### **Code Examples**

#### **✅ Good**

```typescript
// Component with proper typing
interface UserProfileProps {
  userId: string;
  username: string;
  email: string;
}

export function UserProfile({ userId, username, email }: UserProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpdateProfile = async (data: UpdateProfileData) => {
    setIsLoading(true);
    try {
      await updateUserProfile(userId, data);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-profile">
      <h1>{username}</h1>
      <p>{email}</p>
    </div>
  );
}
```

#### **❌ Bad**

```typescript
// Component without proper typing
export function userprofile(props: any) {
  const [loading, setLoading] = useState(false);
  
  const handleUpdate = async (data: any) => {
    setLoading(true);
    await updateUserProfile(props.userId, data);
    setLoading(false);
  };

  return (
    <div>
      <h1>{props.username}</h1>
      <p>{props.email}</p>
    </div>
  );
}
```

---

## 🧪 Testing Guidelines

### **Testing Requirements**

- **Write tests** for new features
- **Update tests** when fixing bugs
- **Maintain test coverage** above 80%
- **Test both happy path and edge cases**

### **Test Structure**

```
tests/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                  # End-to-end tests
└── fixtures/             # Test data
```

### **Test Examples**

```typescript
// Unit test example
import { render, screen } from '@testing-library/react';
import { UserProfile } from '@/components/UserProfile';

describe('UserProfile', () => {
  it('renders user information correctly', () => {
    const mockUser = {
      userId: '1',
      username: 'testuser',
      email: 'test@example.com',
    };

    render(<UserProfile {...mockUser} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});
```

---

## 📤 Pull Request Process

### **Before Submitting**

1. **Create a feature branch** from `main`
2. **Make your changes** following the code style guide
3. **Write tests** for your changes
4. **Update documentation** if needed
5. **Test your changes** thoroughly

### **PR Template**

```markdown
## 📝 Description
**Brief description of changes**

## 🔄 Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## 🧪 Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## 📋 Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design tested

## 🖼️ Screenshots
**If applicable, add screenshots**

## 📚 Additional Notes
**Any additional information**
```

### **Review Process**

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** by reviewers
4. **Approval** from maintainers
5. **Merge** to main branch

---

## 🏷️ Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear commit messages.

### **Format**

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### **Types**

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add Google OAuth login` |
| `fix` | Bug fix | `fix(ui): resolve button alignment issue` |
| `docs` | Documentation | `docs(readme): update installation guide` |
| `style` | Code style | `style(components): format code with prettier` |
| `refactor` | Code refactoring | `refactor(api): simplify user validation` |
| `test` | Tests | `test(auth): add unit tests for login` |
| `chore` | Maintenance | `chore(deps): update dependencies` |

### **Examples**

```bash
# Good commits
git commit -m "feat(posts): add post creation functionality"
git commit -m "fix(ui): resolve responsive layout issues"
git commit -m "docs(api): update authentication endpoints"

# Bad commits
git commit -m "fix stuff"
git commit -m "update"
git commit -m "WIP"
```

---

## 📚 Documentation

### **Documentation Standards**

- **Keep docs up-to-date** with code changes
- **Use clear, concise language**
- **Include code examples** where helpful
- **Add screenshots** for UI changes
- **Follow markdown best practices**

### **Documentation Types**

| Type | Location | Purpose |
|------|----------|---------|
| **API Docs** | `docs/api/` | API endpoint documentation |
| **Component Docs** | `docs/components/` | Component usage examples |
| **Setup Guides** | `docs/setup/` | Installation and configuration |
| **Contributing** | `CONTRIBUTING.md` | This file |

---

## ❓ Questions & Support

### **Getting Help**

- **GitHub Discussions** - General questions and discussions
- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Real-time chat and support
- **Email** - Direct contact for sensitive issues

### **Community Guidelines**

- **Be respectful** and inclusive
- **Help others** when you can
- **Follow the code of conduct**
- **Ask questions** - no question is too simple
- **Share knowledge** and learn together

---

## 🎉 Recognition

### **Contributor Recognition**

We recognize contributors in several ways:

- **Contributor badges** on GitHub
- **Hall of Fame** in README
- **Release notes** mentions
- **Social media** shoutouts
- **Swag** for significant contributions

### **Contributor Levels**

| Level | Requirements | Benefits |
|-------|-------------|----------|
| **🌱 Newcomer** | First contribution | Welcome message |
| **🌿 Contributor** | 3+ contributions | Contributor badge |
| **🌳 Regular** | 10+ contributions | Hall of Fame |
| **🌲 Maintainer** | 50+ contributions | Maintainer status |

---

<div align="center">

**Thank you for contributing to ErrorX Forum! 🎉**

*Together, we're building the best forum experience for developers and tech enthusiasts.*

[![GitHub](https://img.shields.io/badge/GitHub-FakeErrorX-181717?style=for-the-badge&logo=github)](https://github.com/FakeErrorX)
[![Twitter](https://img.shields.io/badge/Twitter-@FakeErrorX-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/FakeErrorX)

</div>
