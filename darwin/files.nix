{ config, pkgs, ... }:

let
  xdg_configHome = "${config.users.users.josh.home}/.config";
  xdg_dataHome   = "${config.users.users.josh.home}/.local/share";
  xdg_stateHome  = "${config.users.users.josh.home}/.local/state"; in
{

}
