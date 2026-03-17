# Repository Structure

Complete structure of the ai-scaffold repository.

## Root Level Files

```
/
├── index.html                 # Main application
├── manifest.json              # PWA manifest
├── favicon.ico.txt           # Favicon placeholder
├── browserconfig.xml         # Browser configuration
├── humans.txt               # Humans.txt for team info
├── robots.txt               # SEO robots file
├── sitemap.xml              # SEO sitemap
├── 404.html                # Custom 404 page
├── .nojekyll               # Disable Jekyll on GitHub Pages
├── .gitignore               # Git ignore rules
├── .gitattributes           # Git attributes
├── .env.example             # Environment template
├── package.json             # NPM package file
├── .npmrc                  # NPM configuration
├── .nvmrc                  # Node version file
├── Makefile                # Build automation
├── Procfile                # Heroku deployment
├── vercel.json             # Vercel deployment
├── netlify.toml            # Netlify deployment
├── LICENSE                  # MIT License
├── README.md                # Main documentation
├── AUTHORS                  # Contributors list
├── CHANGELOG.md             # Version history
├── CONTRIBUTING.md          # Contribution guide
├── CODE_OF_CONDUCT.md       # Community guidelines
├── SECURITY.md              # Security policy
├── SUPPORT.md               # Support documentation
└── STRUCTURE.md            # This file
```

## Folders

### Source Code
```
├── src/                     # Source code (future use)
│   ├── components/           # UI components
│   ├── hooks/               # React hooks
│   ├── utils/               # Utilities
│   ├── services/            # API services
│   ├── constants/           # Constants
│   └── types/               # Type definitions
├── lib/                     # Shared libraries
│   ├── api/                 # API integrations
│   ├── utils/               # Utilities
│   ├── constants/            # Constants
│   └── types/               # Type definitions
├── constants/               # Application constants
├── types/                  # Type definitions
├── middleware/             # Custom middleware
├── helpers/                # Helper functions
└── config/                 # Configuration files
```

### Assets
```
├── assets/                  # Static assets
│   ├── css/                 # Stylesheets
│   │   ├── placeholder.css   # Placeholder CSS
│   │   ├── variables.css    # CSS variables
│   │   └── reset.css       # CSS reset
│   ├── js/                  # JavaScript files
│   │   └── placeholder.js   # Placeholder JS
│   ├── images/              # Images
│   │   ├── icon-192.png.txt # PWA icon placeholder
│   │   ├── icon-512.png.txt # PWA icon placeholder
│   │   ├── screenshot-wide.png.txt
│   │   ├── screenshot-narrow.png.txt
│   │   ├── logo.png.txt     # Logo placeholder
│   │   └── background.png.txt # Background placeholder
│   └── fonts/               # Fonts
│       ├── Roboto.txt       # Font placeholder
│       └── Mono.txt         # Monospace font placeholder
└── public/                 # Public static files
```

### Documentation
```
├── docs/                    # Documentation
│   ├── README.md            # Documentation index
│   ├── ARCHITECTURE.md      # System architecture
│   ├── API.md               # API reference
│   ├── DEPLOYMENT.md        # Deployment guide
│   ├── FAQ.md               # FAQ
│   ├── ROADMAP.md           # Roadmap
│   ├── TROUBLESHOOTING.md   # Troubleshooting guide
│   ├── api/                 # API documentation
│   └── guides/              # User guides
```

### Configuration
```
├── .github/                  # GitHub configuration
│   ├── ISSUE_TEMPLATE/       # Issue templates
│   │   ├── bug_report.md   # Bug report form
│   │   └── feature_request.md # Feature request form
│   ├── PULL_REQUEST_TEMPLATE/ # PR templates
│   │   └── pr_template.md
│   ├── workflows/            # GitHub Actions
│   │   ├── ci.yml          # CI/CD pipeline
│   │   ├── lint.yml        # Lint workflow
│   │   └── label.yml       # PR labeling
│   ├── dependabot.yml       # Dependency updates
│   └── FUNDING.yml         # Sponsorship info
└── config/                   # App configuration
    ├── evolution.json        # Evolution settings
    └── manifest.json        # PWA manifest
```

### Development
```
├── examples/                 # Example implementations
│   ├── basic/               # Basic examples
│   │   └── single-cycle.html
│   └── advanced/            # Advanced examples
│       └── multi-repo-evolution.js
├── tests/                   # Test suite
│   ├── unit/                # Unit tests
│   │   └── evolution.test.js
│   ├── integration/          # Integration tests
│   │   └── github-api.test.js
│   └── e2e/                 # End-to-end tests
│       └── evolution-flow.test.js
├── tools/                   # Development tools
│   └── validate.js         # Validation tool
├── scripts/                 # Automation scripts
│   ├── setup.sh            # Setup script
│   ├── deploy.sh           # Deployment script
│   └── test.sh             # Test runner
└── sw/                      # Service workers
    └── service-worker.js    # PWA service worker
```

### IDE & OS
```
├── .vscode/                 # VS Code settings
│   ├── settings.json        # Editor settings
│   ├── extensions.json      # Recommended extensions
│   ├── launch.json         # Debug configurations
│   └── tasks.json          # Task configurations
├── .idea/                   # JetBrains IDE placeholder
└── __MACOSX/                # macOS system files
```

### Security
```
└── .well-known/              # Security and well-known files
    ├── security.txt          # Security policy contact
    └── README.md            # Directory documentation
```

## File Count Summary

- **Total Files**: 80+
- **Total Folders**: 40+
- **Documentation Files**: 15+
- **Configuration Files**: 20+
- **Example Files**: 5+
- **Test Files**: 5+
- **Asset Files**: 15+
- **Placeholder Files**: 25+

## All Placeholder Files Marked

All empty directories contain `.gitkeep` files.
All placeholder assets have `.txt` extension or descriptive content.
All configuration templates have `.example` extension.

## Migration Notes

For future component-based architecture migration:

1. Use `src/` for application code
2. Use `lib/` for shared utilities
3. Use `public/` for static assets
4. Configure build tool (Vite, Webpack, etc.)
5. Update `index.html` to load from build output

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment guides.
