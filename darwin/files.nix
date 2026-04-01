{ config, pkgs, ... }:

let
  xdg_configHome = "${config.users.users.josh.home}/.config";
  xdg_dataHome   = "${config.users.users.josh.home}/.local/share";
  xdg_stateHome  = "${config.users.users.josh.home}/.local/state"; in
{
  # Ghostty base config (static, Nix-managed)
  # The main ~/.config/ghostty/config includes this via config-file directive
  # and keeps a mutable theme= line that the zsh theme-cycling hook rewrites.
  ".config/ghostty/config-base".text = ''
    # Appearance
    macos-titlebar-style = tabs

    # Tab/split behavior
    tab-inherit-working-directory = true
    split-inherit-working-directory = true

    # Let zsh hooks control tab titles
    shell-integration-features = no-title

    # Splits: cmd+d right, cmd+shift+d down, cmd+w close
    keybind = cmd+d=new_split:right
    keybind = cmd+shift+d=new_split:down
    keybind = cmd+w=close_surface

    # Tabs: cmd+t new, cmd+shift+[/] prev/next, cmd+1-9 goto
    keybind = cmd+t=new_tab
    keybind = cmd+shift+left_bracket=previous_tab
    keybind = cmd+shift+right_bracket=next_tab
    keybind = cmd+one=goto_tab:1
    keybind = cmd+two=goto_tab:2
    keybind = cmd+three=goto_tab:3
    keybind = cmd+four=goto_tab:4
    keybind = cmd+five=goto_tab:5
    keybind = cmd+six=goto_tab:6
    keybind = cmd+seven=goto_tab:7
    keybind = cmd+eight=goto_tab:8
    keybind = cmd+nine=goto_tab:9

    # Focus: cmd+opt+arrows to navigate splits
    keybind = cmd+alt+left=goto_split:left
    keybind = cmd+alt+right=goto_split:right
    keybind = cmd+alt+up=goto_split:top
    keybind = cmd+alt+down=goto_split:bottom
  '';
}
