{ pkgs }:

with pkgs;
let shared-packages = import ../shared/packages.nix { inherit pkgs; }; in
shared-packages ++ [
  dockutil
  warp
  findutils
  coreutils
  # utm
  # transmit
  fnm
  rectangle
]
