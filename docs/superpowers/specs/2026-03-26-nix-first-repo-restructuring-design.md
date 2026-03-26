# Design Spec: Nix-First Repository Restructuring (Revised)

## 1. Problem Statement
The repository currently has its Nix configuration nested in a `nix/` subdirectory, while the root contains legacy scripts and dotfiles. This makes it difficult for new users to get started and leads to configuration duplication.

## 2. Proposed Solution
Elevate the Nix configuration to the root, consolidate legacy dotfiles into Nix, and provide a streamlined "getting started" experience.

### 2.1 Repository Structure Changes
- **Move to Root:**
  - `nix/flake.nix` -> `flake.nix`
  - `nix/flake.lock` -> `flake.lock`
  - `nix/darwin/` -> `darwin/`
  - `nix/shared/` -> `shared/`
  - `nix/overlays/` -> `overlays/`
  - `nix/bin/` -> `bin/`
- **Rename/Move Scripts:**
  - `nix/bin/apply` -> `bin/bootstrap.sh`
  - Create a root symlink `bootstrap.sh -> bin/bootstrap.sh` for easy discovery.
- **Archive/Cleanup:**
  - `legacy/` -> `archived/legacy/`
  - `untrunc_build/`, `ip-check.sh`, `photorec.*` -> `archived/`
  - Keep root `LICENSE`, `README.md`, `.gitignore`, `.editorconfig`.
- **NixOS Support:**
  - Create `nixos/default.nix` and `nixos/home-manager.nix` as placeholders/stubs if they are currently missing, to avoid breaking the flake evaluation.

### 2.2 Integration Plan (Audit & Phased)
- **Shell:** Integrate `legacy/shell/shell_aliases` and `legacy/shell/shell_functions` into `shared/home-manager.nix`.
- **macOS Defaults:**
  - Map natively supported settings (from `legacy/macos_defaults.sh`) to `darwin/default.nix`'s `system.defaults`.
  - Add remaining unsupported/complex commands to `system.activationScripts.postActivation` in `darwin/default.nix`.
- **Token Replacement:**
  - Re-introduce `%USER%`, `%EMAIL%`, and `%NAME%` placeholders in root Nix files (e.g., `shared/home-manager.nix`, `darwin/default.nix`) where appropriate, to support the `bootstrap.sh` replacement logic.

### 2.3 Documentation & Setup
- **README.md:** Update the root `README.md` with clear "Getting Started" instructions and the repository's new "Nix-first" philosophy.
- **Bootstrap Script (`bin/bootstrap.sh`):**
  1. Check for Nix installation.
  2. Perform token replacement for user/email/name.
  3. Detect host OS (Darwin vs Linux) and run the appropriate build command (`darwin-build` or `nixos-build`).

## 3. Architecture & Data Flow
Nix remains the source of truth, but with a standard root-level flake. The `bootstrap.sh` script handles initial environment personalization (token replacement) and the first system activation.

## 4. Verification Plan
- **Structure:** Confirm all files are moved and `flake.nix` correctly references them (no broken imports).
- **Build:** Successfully run `bin/darwin-build` to apply the configuration.
- **Bootstrap:** Dry-run `bin/bootstrap.sh` to ensure it correctly identifies the OS and would perform token replacement and build commands.
