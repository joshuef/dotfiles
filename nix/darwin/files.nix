{ config, pkgs, ... }:

let
  xdg_configHome = "${config.users.users.dustin.home}/.config";
  xdg_dataHome   = "${config.users.users.dustin.home}/.local/share";
  xdg_stateHome  = "${config.users.users.dustin.home}/.local/state"; in
{

}
