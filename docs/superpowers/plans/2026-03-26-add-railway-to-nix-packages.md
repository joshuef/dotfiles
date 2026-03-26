# Add Railway CLI to Shared Nix Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `railway` CLI to the shared Nix configuration and apply the change.

**Architecture:** Modify `nix/shared/packages.nix` to include `railway` in the `with pkgs; [...]` list, then run the `apply` script.

**Tech Stack:** Nix

---

### Task 1: Modify `nix/shared/packages.nix`

**Files:**
- Modify: `nix/shared/packages.nix`

- [ ] **Step 1: Add `railway` to the packages list**

In `nix/shared/packages.nix`, locate the "Cloud-related tools and SDKs" section and add `railway` (alphabetically preferred).

```nix
  # Cloud-related tools and SDKs
  awscli2
  docker
  docker-compose
  # cloudflared
  # flyctl
  # google-cloud-sdk
  # go
  # gopls
  # ngrok
  railway
  # ssm-session-manager-plugin
  terraform
```

- [ ] **Step 2: Verify syntax (dry run)**

Run: `nix-instantiate --parse nix/shared/packages.nix > /dev/null`
Expected: Success (no output/exit code 0)

- [ ] **Step 3: Commit the change**

```bash
git add nix/shared/packages.nix
git commit -m "feat: add railway to shared packages"
```

### Task 2: Apply and Verify

**Files:**
- Run: `nix/bin/apply`

- [ ] **Step 1: Check if `railway` is already in PATH**

Run: `which railway`
Expected: `railway not found` (unless already installed via other means)

- [ ] **Step 2: Apply the Nix configuration**

Run: `./nix/bin/apply`
Expected: Nix build and activation finish successfully.

- [ ] **Step 3: Verify `railway` installation**

Run: `railway --version`
Expected: `railway version x.y.z`

- [ ] **Step 4: Commit verification results (if any logs generated)**
(Optional)
