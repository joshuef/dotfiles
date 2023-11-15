#!/bin/bash


# deterministic nix: https://github.com/DeterminateSystems/nix-installer

curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install

echo "nix basic installed"

nix/bin/build

mkdir -p ~/Projects
cd ~/Projects

# clone all these into the projects folders
# safe
