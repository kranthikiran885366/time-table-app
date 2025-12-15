# Contributing to Timetable Management System

First off, thank you for considering contributing to the Timetable Management System! It's people like you that make this project such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [your-email@example.com].

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (v5.0+)
- Flutter SDK (latest stable)
- Git

### Setting up Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/timetable-management-system.git
   cd timetable-management-system
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/timetable-management-system.git
   ```

4. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create and configure your .env file
   npm run dev
   ```

5. **Flutter Setup**
   ```bash
   cd flutter_app
   flutter pub get
   flutter run -d chrome
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed**
- **Explain which behavior you expected to see instead**
- **Include screenshots if possible**
- **Include your environment details** (OS, Node version, Flutter version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed feature**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues for beginners
- `help wanted` - Issues that need assistance
- `documentation` - Documentation improvements

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or fixes

Example: `feature/excel-batch-upload`, `fix/authentication-token-expiry`

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, maintainable code
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Flutter tests
   cd flutter_app
   flutter test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Keep your branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### Backend (Node.js/Express)

- Use **ES6+** syntax
- Use **async/await** for asynchronous code
- Follow **RESTful API** conventions
- Use **camelCase** for variables and functions
- Use **PascalCase** for models and classes
- Add JSDoc comments for functions
- Handle errors properly with try-catch blocks
- Use middleware for authentication and validation

**Example:**
```javascript
/**
 * Get all timetable entries for a specific section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTimetableBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const timetable = await Timetable.find({ section: sectionId })
      .populate('subject')
      .populate('room');
    
    res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Frontend (Flutter/Dart)

- Follow **Dart style guide**
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and widgets
- Use **snake_case** for file names
- Add documentation comments (`///`) for public APIs
- Use **Provider** for state management
- Create reusable widgets
- Handle loading and error states properly

**Example:**
```dart
/// A widget that displays a timetable card
class TimetableCard extends StatelessWidget {
  final Timetable timetable;
  final VoidCallback? onTap;

  const TimetableCard({
    Key? key,
    required this.timetable,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(timetable.subject.name),
        subtitle: Text('Room: ${timetable.room.number}'),
        onTap: onTap,
      ),
    );
  }
}
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(excel-upload): add batch upload support for timetables

Add ability to upload multiple Excel files at once with validation
and conflict detection.

Closes #123
```

```bash
fix(auth): resolve token expiration issue

Token was expiring too quickly due to incorrect time calculation.
Updated to use proper milliseconds conversion.

Fixes #456
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update the README.md** with details of changes if applicable
5. **Ensure your code follows** the coding standards
6. **Fill in the PR template** completely

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe the tests you ran

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally
```

### Review Process

- At least one maintainer must approve the PR
- All CI checks must pass
- Address all review comments
- Squash commits if requested
- Be responsive to feedback

## Questions?

Feel free to:
- Open an issue with the `question` label
- Email the maintainers
- Join our community chat

Thank you for contributing! 🎉
