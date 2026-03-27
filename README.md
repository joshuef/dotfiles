# Nix-First Dotfiles

This repository contains my personal dotfiles, managed primarily by **Nix**, **nix-darwin**, and **home-manager**. It is designed to be a "Nix-first" configuration, where the entire system state is defined declaratively.

## Features

- **Declarative System:** Managed by Nix Flakes for reproducible environments.
- **Cross-Platform:** Shared configurations for both macOS (nix-darwin) and Linux (NixOS).
- **Home Manager:** Manages user-level packages, shell (zsh), git, and vim.
- **Bootstrapping:** A simple script to personalize and apply the configuration on new machines.
- **Archived Legacy:** Old dotfiles and scripts are kept in `archived/` for reference.

## Getting Started

### 1. Prerequisites

- **Nix:** Install Nix using the official installer:
  ```bash
  sh <(curl -L https://nixos.org/nix/install)
  ```
- **Git:** Ensure Git is installed.

### 2. Installation

Clone this repository to `~/dotfiles`:

```bash
git clone https://github.com/joshuef/dotfiles.git ~/dotfiles
cd ~/dotfiles
```

### 3. Bootstrap

Run the bootstrap script to personalize the configuration and perform the initial build:

```bash
./bootstrap.sh
```

The script will:
- Check for Nix installation.
- Prompt for (or fetch from Git) your name, email, and username.
- Replace placeholders in the configuration files.
- Run the appropriate build command for your system (`darwin-build` or `nixos-build`).

## Repository Structure

- `flake.nix`: The entry point for the entire configuration.
- `darwin/`: macOS-specific configuration (nix-darwin).
- `nixos/`: Linux-specific configuration (NixOS stubs).
- `shared/`: Shared configuration between Darwin and NixOS.
  - `home-manager.nix`: The bulk of user-level settings (shell, aliases, git).
  - `packages.nix`: The list of packages installed on all systems.
- `bin/`: Useful scripts, including `darwin-build` and `bootstrap.sh`.
- `archived/`: Legacy dotfiles and scripts for reference.

## Customization

### Local Settings

You can add local, non-versioned settings to the following files:

- `~/.zsh.local`: Sourced by zsh at startup.
- `~/.gitconfig.local`: Included by git.

## License

The code is available under the [MIT license](LICENSE).
