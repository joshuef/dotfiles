# Nix-First Repository Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the Nix configuration to the root, consolidate legacy dotfiles, and provide a streamlined "getting started" experience.

**Architecture:** Use `git mv` to restructure the repository, update internal Nix paths, re-introduce tokens for personalization, and create a root `bootstrap.sh`.

**Tech Stack:** Nix, Bash, Git

---

### Task 1: Restructure Filesystem (Nix to Root)

**Files:**
- Modify: `nix/*` (Move to root)
- Modify: `flake.nix`, `darwin/default.nix`, `shared/home-manager.nix`, etc. (Update paths)

- [ ] **Step 1: Move Nix core files to root**

Run:
```bash
git mv nix/flake.nix flake.nix
git mv nix/flake.lock flake.lock
git mv nix/darwin darwin
git mv nix/shared shared
git mv nix/overlays overlays
git mv nix/bin bin
```

- [ ] **Step 2: Update internal Nix paths**

Modify `flake.nix` to use `./darwin` instead of `./nix/darwin`, etc.
Modify `darwin/default.nix` to use `./home-manager.nix` instead of `../nix/darwin/home-manager.nix` (if applicable).
Audit all `import` and `callPackage` calls in the moved files.

- [ ] **Step 3: Create NixOS stubs**

Create `nixos/default.nix`:
```nix
{ config, pkgs, ... }:
{
  imports = [ ./home-manager.nix ../shared ];
  system.stateVersion = "23.11";
}
```

Create `nixos/home-manager.nix`:
```nix
{ config, pkgs, ... }:
{
  home.stateVersion = "23.11";
  imports = [ ../shared/home-manager.nix ];
}
```

- [ ] **Step 4: Verify structure and build**

Run: `bin/darwin-build --dry-run`
Expected: Nix evaluation succeeds.

- [ ] **Step 5: Commit restructuring**

```bash
git add .
git commit -m "refactor: move nix configuration to repository root"
```

### Task 2: Root Cleanup and Archiving

**Files:**
- Create: `archived/`
- Modify: Root directory

- [ ] **Step 1: Create archived directory and move legacy files**

Run:
```bash
mkdir -p archived
git mv legacy archived/
git mv untrunc_build archived/
git mv ip-check.sh archived/
git mv photorec.se2 archived/
git mv photorec.ses archived/
```

- [ ] **Step 2: Update .gitignore**

Modify `.gitignore` to ignore the `result` symlink (now at root) and other temp files.

- [ ] **Step 3: Commit cleanup**

```bash
git add .
git commit -m "chore: archive legacy files and clean up repository root"
```

### Task 3: Tokenize Nix Configuration

**Files:**
- Modify: `flake.nix`, `darwin/default.nix`, `shared/home-manager.nix`, `bin/darwin-build`

- [ ] **Step 1: Replace hardcoded "josh" with %USER%**

In `flake.nix`: `let user = "%USER%"; in { ... }`
In `darwin/default.nix`: `let user = "%USER%"; in { ... }`
In `bin/darwin-build`: `sudo /bin/chmod +a "%USER% allow ..."`

- [ ] **Step 2: Replace hardcoded email/name with %EMAIL% and %NAME%**

In `shared/home-manager.nix`:
```nix
let name = "%NAME%";
    user = "%USER%";
    email = "%EMAIL%"; in
```

- [ ] **Step 3: Verify syntax**

Run: `nix-instantiate --parse flake.nix > /dev/null` (Note: This may fail due to tokens, which is expected for now but we should check for other syntax errors).

- [ ] **Step 4: Commit tokenization**

```bash
git add .
git commit -m "feat: re-introduce placeholders for bootstrap personalization"
```

### Task 4: Create Bootstrap Script

**Files:**
- Create: `bootstrap.sh` (symlink)
- Modify: `bin/bootstrap.sh` (renamed from `apply`)

- [ ] **Step 1: Rename and enhance `bin/apply` to `bin/bootstrap.sh`**

Update `bin/bootstrap.sh`:
- Add a check for Nix installation.
- Update token replacement logic to exclude `.git/` and `docs/`.
- Add host detection:
```bash
if [[ "$OS" == "Darwin" ]]; then
  ./bin/darwin-build
else
  # nixos-build placeholder or instructions
  echo "Please run ./bin/nixos-build for Linux systems."
fi
```

- [ ] **Step 2: Create root symlink**

Run: `ln -s bin/bootstrap.sh bootstrap.sh`

- [ ] **Step 3: Commit bootstrap**

```bash
git add .
git commit -m "feat: add root bootstrap script and symlink"
```

### Task 5: Final Documentation and Audit

**Files:**
- Modify: `README.md`
- Modify: `shared/home-manager.nix` (Merge legacy aliases)

- [ ] **Step 1: Merge high-value legacy aliases/functions**

Audit `archived/legacy/shell/shell_aliases` and move useful ones into `shared/home-manager.nix` `initExtra`.

- [ ] **Step 2: Rewrite README.md**

Include sections:
- Project Philosophy
- Quick Start (`./bootstrap.sh`)
- Repository Structure
- Customization

- [ ] **Step 3: Commit final changes**

```bash
git add .
git commit -m "docs: rewrite README and finalize repository restructuring"
```
