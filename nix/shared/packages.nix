{ pkgs }:
with pkgs; [
  # General packages for development and system management
  act
  ansible
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
  dust
  git-filter-repo
  diff-so-fancy
  huniq
  fastlane
  just
  killall
  cloc
  mosh
  neofetch
  ncdu
  openssh
  pandoc
  parallel
  powershell
  protobuf
  rustup
  sqlite
  tig
  testdisk
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
  # libfido2
  # pinentry-all
  # pinentry
  yubikey-manager

  # Cloud-related tools and SDKs
  awscli2
  docker
  docker-compose
  # cloudflared
  # flyctl
  # google-cloud-sdk
  # go
  # gopls
  # ngrok
  # ssm-session-manager-plugin
  terraform
  terraform-ls
  # tflint
  # transmission_4
  # slack
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
  noto-fonts-color-emoji
  meslo-lgs-nf

  # Node.js development tools
  bun
  fzf
  # nodePackages.live-server
  # nodePackages.nodemon
  # nodePackages.prettier
  # nodePackages.npm
  # nodejs

  # Source code management, Git, GitHub tools
  gh
  git-secrets

  # Text and terminal utilities
  htop
  # hunspell
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
  # slack
  rm-improved

  imagemagick

  # Python packages
  python311
  python311Packages.virtualenv
  python311Packages.pipx

  # lld linker for rust
  lld
  wasm-pack
  cmake
  # # mold linker potentially for rust...
  # mold-wrapped
  # libdrm
  # qtwayland
  # valgrind
  # pinentry-all
]
