{ pkgs }:

with pkgs; [
  # General packages for development and system management
  act
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
  diff-so-fancy
  just
  killall
  mosh
  neofetch
  openssh
  pandoc
  protobuf
  rustc
  sqlite
  tig
  wget
  yarn
  zip
  zsh

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
  # ansible

  # Media-related packages
  emacs-all-the-icons-fonts
  dejavu_fonts
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
  ripgrep
  tree
  tmux
  unrar
  unzip
  zsh-z
  zsh-powerlevel10k
  zsh-autosuggestions
  zsh-syntax-highlighting
  zsh-history-search-multi-word
  slack

  # Python packages
  python311
  python311Packages.virtualenv
  python311Packages.pipx

]
