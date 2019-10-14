#!/bin/bash
# inspired by fatih arslan
set -eu


echo "Linux machine setup"

# export DEBIAN_FRONTEND=noninteractive

UPGRADE_PACKAGES=${1:-none}

if [ "${UPGRADE_PACKAGES}" != "none" ]; then
  echo "==> Updating and upgrading packages ..."


  # Add atom repo
  wget -qO - https://packagecloud.io/AtomEditor/atom/gpgkey | sudo apt-key add -
  sudo sh -c 'echo "deb [arch=amd64] https://packagecloud.io/AtomEditor/atom/any/ any main" > /etc/apt/sources.list.d/atom.list'

  # Add third party repositories
  sudo add-apt-repository ppa:keithw/mosh-dev -y
  sudo add-apt-repository ppa:jonathonf/vim -y

  # CLOUD_SDK_SOURCE="/etc/apt/sources.list.d/google-cloud-sdk.list"
  # CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)"
  # if [ ! -f "${CLOUD_SDK_SOURCE}" ]; then
  #   echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a ${CLOUD_SDK_SOURCE}
  #   curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
  # fi

  sudo apt-get update
  sudo apt-get upgrade -y

  sudo apt-get install -y \
  atom-beta \
  apt-transport-https \
  build-essential \
  bzr \
  ca-certificates \
  cmake \
  curl \
  dconf-editor \
  direnv \
  dnsutils \
  docker.io \
  fakeroot-ng \
  gdb \
  git \
  git-crypt \
  gnupg \
  gnupg2 \
  libssl-dev \
  mailutils \
  man \
  mosh \
  musl-tools \
  nvim \
  netcat-openbsd \
  openssh-server \
  openssl \
  pkg-config \
  pwgen \
  python \
  python3 \
  python3-flake8 \
  python3-pip \
  python3-setuptools \
  python3-venv \
  python3-wheel \
  ripgrep \
  shellcheck \
  ssmtp \
  software-properties-common \
  sudo \
  sysfsutils \
  tig \
  tmate \
  tmux \
  tree \
  unzip \
  vino \
  virtualbox \
  virtualbox-qt \
  virtualbox-ext-pack \
  wget \
  vim-gtk3 \
  xclip \
  zgen \
  zip \
  zsh \
  --no-install-recommends

fi

# install rust
if ! [ -x "$(command -v rustup)" ]; then
  echo "==> Installing rustup"

  curl https://sh.rustup.rs -sSf | sh
fi

# install 1password
if ! [ -x "$(command -v op)" ]; then
  echo " ==> Installing one password cli"

  export OP_VERSION="v0.6.1"
  curl -sS -o 1password.zip https://cache.agilebits.com/dist/1P/op/pkg/${OP_VERSION}/op_linux_amd64_${OP_VERSION}.zip
  unzip 1password.zip op -d /usr/local/bin
  rm -f 1password.zip
fi

# install bat
if ! [ -x "$(command -v bat)" ]; then
  echo " ==> Installing bat"

  export BAT_VERSION="0.11.0"
  curl -sS -o bat.deb "https://github.com/sharkdp/bat/releases/download/v${BAT_VERSION}/bat-musl_${BAT_VERSION}_amd64.deb"
  sudo dpkg -i "bat.deb"
fi


# install doctl
if ! [ -x "$(command -v doctl)" ]; then
  echo "==> Installing doctl"

  export DOCTL_VERSION="1.20.1"
  wget https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-linux-amd64.tar.gz
  tar xf doctl-${DOCTL_VERSION}-linux-amd64.tar.gz
  chmod +x doctl
  sudo mv doctl /usr/local/bin
  rm -f doctl-${DOCTL_VERSION}-linux-amd64.tar.gz
fi



# NVIM_PLUG_FILE="${HOME}/.nvim/plug.vim"
NVIM_DIR="${HOME}/.config/nvim"

if [ ! -f "${NVIM_DIR}" ]; then
  mkdir -p $NVIM_DIR
  ln -sfn "${HOME}/.init.vim" ~/init.vim

fi

# VIM_PLUG_FILE="${HOME}/.vim/autoload/plug.vim"
# if [ ! -f "${VIM_PLUG_FILE}" ]; then
#   echo " ==> Installing vim plugins"
#   curl -fLo ${VIM_PLUG_FILE} --create-dirs https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
#
#   mkdir -p "${HOME}/.vim/plugged"
#   pushd "${HOME}/.vim/plugged"
#   git clone "https://github.com/AndrewRadev/splitjoin.vim"
#   git clone "https://github.com/ConradIrwin/vim-bracketed-paste"
#   git clone "https://github.com/Raimondi/delimitMate"
#   git clone "https://github.com/SirVer/ultisnips"
#   git clone "https://github.com/cespare/vim-toml"
#   git clone "https://github.com/corylanou/vim-present"
#   git clone "https://github.com/ekalinin/Dockerfile.vim"
#   git clone "https://github.com/elzr/vim-json"
#   git clone "https://github.com/fatih/vim-hclfmt"
#   git clone "https://github.com/fatih/vim-nginx"
#   git clone "https://github.com/fatih/vim-go"
#   git clone "https://github.com/hashivim/vim-hashicorp-tools"
#   git clone "https://github.com/junegunn/fzf.vim"
#   git clone "https://github.com/mileszs/ack.vim"
#   git clone "https://github.com/roxma/vim-tmux-clipboard"
#   git clone "https://github.com/plasticboy/vim-markdown"
#   git clone "https://github.com/scrooloose/nerdtree"
#   git clone "https://github.com/t9md/vim-choosewin"
#   git clone "https://github.com/tmux-plugins/vim-tmux"
#   git clone "https://github.com/tmux-plugins/vim-tmux-focus-events"
#   git clone "https://github.com/fatih/molokai"
#   git clone "https://github.com/tpope/vim-commentary"
#   git clone "https://github.com/tpope/vim-eunuch"
#   git clone "https://github.com/tpope/vim-fugitive"
#   git clone "https://github.com/tpope/vim-repeat"
#   git clone "https://github.com/tpope/vim-scriptease"
#   git clone "https://github.com/ervandew/supertab"
#   popd
# fi

if ! [ -x "$(command -v yarn)" ]; then
  echo " ==> Installing yarn"

  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
  sudo apt-get update && sudo apt-get install yarn
fi

if ! [ -x "$(command -v trash)" ]; then
  echo " ==> Installing trash"
  yarn global add trash-cli
fi


if [ ! -d "${HOME}/.fzf" ]; then
  echo " ==> Installing fzf"
  git clone https://github.com/junegunn/fzf "${HOME}/.fzf"
  pushd "${HOME}/.fzf"
  git remote set-url origin git@github.com:junegunn/fzf.git
  ${HOME}/.fzf/install
  popd
fi

#
# if [ ! -d "${HOME}/.kinto" ]; then
#   echo " ==> Installing kinto key mapper for MacLike keys"
#   echo "start/stop commands: https://github.com/rbreaves/kinto"
#   git clone https://github.com/rbreaves/kinto.git "${HOME}/.kinto"
#   ${HOME}/.kinto/install.py
#   echo '1' | sudo tee -a /sys/module/hid_apple/parameters/swap_opt_cmd
#   options hid_apple swap_opt_cmd="1" | sudo tee -a /etc/modprobe.d/hid_apple.conf
#   update-initramfs -u -k all
#
# fi


if [ ! -d "${HOME}/.tmux/plugins" ]; then
  echo " ==> Installing tmux plugins"

  git clone https://github.com/gpakosz/.tmux.git "${HOME}/.oh-my-tmux"
  ln -sfn "${HOME}/.oh-my-tmux/.tmux.conf" ~/.tmux.conf
  chmod 0600 ~/.tmux.conf
  git clone https://github.com/tmux-plugins/tpm "${HOME}/.tmux/plugins/tpm"

  ln -sfn $(pwd)/.tmux.conf.local ~/.tmux.conf.local
  chmod 0600 ~/.tmux.conf.local

fi

if [ ! -d "${HOME}/.oh-my-zsh" ]; then
  echo " ==> Installing ohmyzsh"
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
  echo " ==> Installing zsh nerd fonts"

  # macos
  # brew tap homebrew/cask-fonts
  # brew cask install font-hack-nerd-font
  git clone https://github.com/ryanoasis/nerd-fonts.git ~/nerd-fonts --depth=1
  ${HOME}/nerd-fonts/install.sh
  echo " ==> Installing zsh plugins"
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "${HOME}/.oh-my-zsh/plugins/zsh-syntax-highlighting"
  git clone https://github.com/zsh-users/zsh-autosuggestions "${HOME}/.oh-my-zsh/plugins/zsh-autosuggestions"
  git clone https://github.com/agkozak/zsh-z "${HOME}/.oh-my-zsh/plugins/zsh-z"
  git clone https://github.com/bhilburn/powerlevel9k.git "${HOME}/.oh-my-zsh/themes/powerlevel9k"
fi


if [ ! -d "${HOME}/bin/diff-so-fancy" ]; then
  echo " ==> Installing diff so fancy"
  cp ./git/diff-so-fancy ~/bin
  chmod +x ~/bin/diff-so-fancy
fi

if [ ! -d "${HOME}/.atom/packages.list" ]; then
  echo " ==> Installing atom packages"
  ln -sfn ./atom ~/.atom
  apm-beta install --packages-file atom/packages.list

fi



echo "==!!> TODO: set shell to zsh..."
echo "run: \"chsh -s /usr/bin/zsh\" to set zsh as shell"


echo "==!!>Disable Firefox ctrl+mousewheel: https://support.mozilla.org/en-US/questions/1113500"

# TODO: enable this...
# if [ ! -d /mnt/dev/code/dotfiles ]; then
#   echo "==> Setting up dotfiles"
#   # the reason we dont't copy the files individually is, to easily push changes
#   # if needed
#   cd "/mnt/dev/code"
#   git clone --recursive https://github.com/joshuef/dotfiles.git
#
#   cd "/mnt/dev/code/dotfiles"
#   git remote set-url origin git@github.com:joshuef/dotfiles.git
#
#   ln -sfn $(pwd)/vimrc "${HOME}/.vimrc"
#   ln -sfn $(pwd)/zshrc "${HOME}/.zshrc"
#   ln -sfn $(pwd)/tmuxconf "${HOME}/.tmux.conf"
#   ln -sfn $(pwd)/tigrc "${HOME}/.tigrc"
#   ln -sfn $(pwd)/git-prompt.sh "${HOME}/.git-prompt.sh"
#   ln -sfn $(pwd)/gitconfig "${HOME}/.gitconfig"
#   ln -sfn $(pwd)/agignore "${HOME}/.agignore"
#   ln -sfn $(pwd)/sshconfig "${HOME}/.ssh/config"
# fi


# Set correct timezone
timedatectl set-timezone Europe/Madrid

echo ""
echo "==> Done!"

echo "Now:"
echo "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash"
echo " then zsh and then \"nvm i stable\""
