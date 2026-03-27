# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Nix-first dotfiles repository managing system configuration declaratively across macOS (nix-darwin) and Linux (NixOS) using Nix Flakes and Home Manager.

## Build Commands

```bash
# Full system build (auto-detects platform)
bin/build

# macOS-specific build
bin/darwin-build

# NixOS-specific build
bin/nixos-build

# First-time setup on a new machine (handles personalization tokens)
bin/bootstrap.sh
```

There are no tests or linters — validation happens at build time via Nix evaluation.

## Architecture

**Entry point**: `flake.nix` defines all inputs (nixpkgs, darwin, home-manager, nix-homebrew, disko) and outputs (darwinConfigurations, nixosConfigurations, devShells).

**Configuration layers**:

- **System level**: `darwin/default.nix` (macOS system settings, Nix daemon, overlays) and `nixos/default.nix` (Linux equivalent)
- **User level — shared**: `shared/home-manager.nix` is the bulk of the config — zsh, git, aliases, shell functions, environment variables, and PATH setup
- **User level — platform-specific**: `darwin/home-manager.nix` (Homebrew brews/casks, Dock layout) and `nixos/home-manager.nix`
- **Packages**: `shared/packages.nix` (cross-platform), `darwin/packages.nix` (macOS-only), `darwin/casks.nix` (GUI apps via Homebrew)
- **Static files**: `shared/files.nix` and `darwin/files.nix` manage dotfiles placed in `$HOME`
- **Overlays**: `overlays/` and `shared/default.nix` for custom package builds and patches

**Personalization**: `bin/bootstrap.sh` replaces `josh`, `joshuef@gmail.com`, `Josh Wilson`, and `%INTERFACE%` tokens in config files on first run.

## Key Conventions

- **Indentation**: 2 spaces, UTF-8, LF line endings (see `.editorconfig`)
- **Commits**: Conventional Commits format (`fix:`, `feat:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`) — see `.gitmessage` for the template
- **Local overrides**: `~/.zsh.local` and `~/.gitconfig.local` exist for machine-specific config that shouldn't be versioned
- **Platform branching**: Darwin-specific code goes in `darwin/`, NixOS in `nixos/`, everything else in `shared/`
- **Legacy reference**: `archived/` contains old pre-Nix configs kept for reference — don't modify these
