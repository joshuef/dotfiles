{ pkgs }:

with pkgs;
let shared-packages = import ../shared/packages.nix { inherit pkgs; }; in
shared-packages ++ [
  dockutil
  # warp
  findutils
  coreutils
  # iterm2
  # utm
  # transmit
  fnm
  rectangle
  unar

]
