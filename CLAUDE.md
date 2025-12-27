# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog built with Jekyll 4.4.1 using the Minima theme (v2.5). The blog covers personal topics including technology (SAP, AI), spirituality, music (House, Afro, Deep House), gaming, and personal life.

## Development Commands

### Prerequisites
```bash
bundle install
```
Installs all gem dependencies from Gemfile. Run this after cloning or when updating dependencies. The project uses:
- **Jekyll 4.4.1**: Static site generator
- **Minima 2.5**: Default Jekyll theme
- **jekyll-feed**: Generates RSS feed
- **Windows-specific**: tzinfo and wdm gems for Windows development

### Start Local Development Server
```bash
bundle exec jekyll serve
```
Starts dev server with auto-regeneration at `http://localhost:4000`.
- Watches for file changes and rebuilds automatically
- **Important**: Configuration changes in `_config.yml` require manual server restart

### Build for Production
```bash
bundle exec jekyll build
```
Generates static site to `_site/` directory. This is the final output for deployment.

## Content Structure

### Blog Posts
- **Location**: `_posts/`
- **Naming convention**: `YYYY-MM-DD-title.markdown` (e.g., `2025-12-21-welcome-to-jekyll.markdown`)
- **Required front matter**:
  ```yaml
  ---
  layout: post
  title: "Your Post Title"
  date: YYYY-MM-DD HH:MM:SS +0100
  categories: category-name
  ---
  ```
- Posts are published by date; future-dated posts won't appear until their date

### Pages
- `about.markdown`: Personal bio/about page (layout: page)
- `index.markdown`: Homepage (layout: home - uses special rendering)
- `404.html`: Custom 404 error page

### Site Configuration
- `_config.yml`: All site-wide settings (site title, description, social links, theme, plugins)
- `Gemfile`: Ruby gem dependencies and versions
- `Gemfile.lock`: Locked dependency versions (commit this, don't edit manually)

## Configuration Details

### _config.yml Key Settings
- `title`, `email`, `description`: Site metadata (displayed in headers/feeds)
- `baseurl`, `url`: URL configuration for deployment
- `twitter_username`, `github_username`: Social media links in footer
- `theme: minima`: Active theme
- `plugins`: jekyll-feed generates RSS at `/feed.xml`

**Important**: Server restart required for `_config.yml` changes to take effect. Stop Jekyll serve and restart.

## Theme Customization

The Minima theme (v2.5) can be customized without modifying the gem itself:
- Create `_layouts/` directory to override layout files
- Create `_includes/` directory to override partial templates
- Use `bundle info minima` to locate gem files as reference

Customization approach: Copy only the specific files you need to override, keeping the rest from the theme.

## Important Files & Directories

**Do not commit these** (already in .gitignore):
- `_site/`: Generated static HTML output
- `.jekyll-cache/`: Build cache directory

**Always commit**:
- `Gemfile.lock`: Ensures consistent gem versions across environments
