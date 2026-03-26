## Shared
Much of the code running on MacOS or NixOS is actually found here.

This configuration gets imported by both modules. Some configuration examples include `git`, `zsh`, `vim`, and `tmux`.

## Layout
```
.
├── config             # Config files not written in Nix
├── cachix             # Defines cachix, a global cache for builds
├── default.nix        # Defines how we import overlays 
├── files.nix          # Non-Nix, static configuration files (now immutable!)
├── home-manager.nix   # The goods; most all shared config lives here
├── packages.nix       # List of packages to share

```

## 2025-04-21: Major Package Clean-up for macOS Sequoia
- Removed incompatible packages: `valgrind`, `libdrm`, `qtwayland`, `pinentry-all`, and any indirect references (including overlays).
- Commented out or removed packages with problematic dependencies or that are currently broken on Sequoia (see `packages.nix` for details).
- Updated deprecated Home Manager options (e.g., `zsh.enableAutosuggestions` → `zsh.autosuggestion.enable`).
- Updated `transmission` to `transmission_3` as required by Nixpkgs 24.11+.
- Build now succeeds on macOS Sequoia with these changes.

See `shared/packages.nix` for the current list of included/excluded packages.
