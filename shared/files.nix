{ pkgs, config, ... }:

{
  # Initializes Emacs with org-mode so we can tangle the main config
  # ".emacs.d/init.el" = {
  #   # text = builtins.readFile ../shared/config/emacs/init.el;
  # };

  # Oh My Posh config
  ".config/omp.toml".source = ./config/omp.toml;
}
