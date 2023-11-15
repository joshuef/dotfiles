#!/bin/bash


# deterministic nix: https://github.com/DeterminateSystems/nix-installer
# only install if not already installed
if [ ! -d "/nix" ]; then
  curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
  mv /etc/nix/nix.conf /etc/nix/nix.conf.before.build.bkp
  echo "nix basic installed"
  echo "reloading the shell. run this cmd again afterwards"

  # reloading the shell now
  zsh
fi


# and building with nix
nix/bin/build

# clone all these into the projects folders
# safe
