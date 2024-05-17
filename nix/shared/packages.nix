{ pkgs }:
with pkgs; [
  # General packages for development and system management
  act
    (import (builtins.fetchTree {
      type = "github";
      owner = "NixOS";
      repo = "nixpkgs";
      rev = "13606dcd4639a04891eef831a022b0ab8e815b38";
    }) { system = pkgs.system; }).ansible
  # ansible
  # awscli
  aspell
  aspellDicts.en
  bash-completion
  bat
  btop
  coreutils
  difftastic
  doctl
  direnv
  du-dust
  git-filter-repo
  github-copilot-cli
  diff-so-fancy
  huniq
  just
  killall
  mosh
  neofetch
  ncdu
  openssh
  pandoc
  parallel
  protobuf
  rustup
  sqlite
  tig
  # trashy
  wget
  yarn
  zip
  zsh
  yq

  # Encryption and security tools
  # _1password
  age
  age-plugin-yubikey
  gnupg
  libfido2
  pinentry
  yubikey-manager

  # Cloud-related tools and SDKs
  docker
  docker-compose
  awscli2
  cloudflared
  flyctl
  google-cloud-sdk
  go
  gopls
  ngrok
  ssm-session-manager-plugin
  terraform
  terraform-ls
  tflint
  transmission
  slack
  # heaptrack

  # Media-related packages
  # emacs-all-the-icons-fonts
  # dejavu_fonts
  ffmpeg
  fd
  font-awesome
  glow
  hack-font
  noto-fonts
  noto-fonts-emoji
  meslo-lgs-nf

  # Node.js development tools
  fzf
  nodePackages.live-server
  nodePackages.nodemon
  nodePackages.prettier
  nodePackages.npm
  nodejs

  # Source code management, Git, GitHub tools
  gh

  # Text and terminal utilities
  htop
  hunspell
  iftop
  jq
  neovim
  ripgrep
  tree
  # tmux
  unrar
  unzip
  zsh-powerlevel10k
  zsh-z
  slack
  rm-improved

  # Python packages
  python311
  python311Packages.virtualenv
  python311Packages.pipx

  # lld linker for rust
  lld_16
  wasm-pack
  cmake
  # # mold linker potentially for rust...
  # mold-wrapped
]
