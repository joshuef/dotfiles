{ pkgs }:

with pkgs;
let shared-packages = import ../shared/packages.nix { inherit pkgs; }; in
shared-packages ++ [
  dockutil
  #ios detox tests needs this
  # applesimutils
  # warp
  findutils
  coreutils
  git-lfs
  # iterm2
  # utm
  # transmit
  fnm
  # rectangle
  unar
  libusb1
  cocoapods
]
