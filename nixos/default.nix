{ config, pkgs, ... }:
{
  imports = [ ./home-manager.nix ../shared ];
  system.stateVersion = "23.11";
}
