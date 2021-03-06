#!/bin/bash
# inspired by fatih arslan
set -eu

# export DEBIAN_FRONTEND=noninteractive

UPGRADE_PACKAGES=${1:-none}

if [ "${UPGRADE_PACKAGES}" != "none" ]; then
  echo "==> Updating and upgrading packages ..."

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
fi

sudo apt-get install -qq \
  apt-transport-https \
  build-essential \
  bzr \
  ca-certificates \
  cmake \
  curl \
  direnv \
  dnsutils \
  docker.io \
  fakeroot-ng \
  gdb \
  git \
  git-crypt \
  gnupg \
  gnupg2 \
  man \
  mosh \
  musl-tools \
  netcat-openbsd \
  openssh-server \
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
  software-properties-common \
  sudo \
  tig \
  tmate \
  tmux \
  tree \
  unzip \
  wget \
  zgen \
  zip \
  zsh \
  --no-install-recommends \

rm -rf /var/lib/apt/lists/*

# install rust
if ! [ -x "$(command -v rustup)" ]; then

  curl https://sh.rustup.rs -sSf | sh
fi

# install 1password
if ! [ -x "$(command -v op)" ]; then
  export OP_VERSION="v0.6.1"
  curl -sS -o 1password.zip https://cache.agilebits.com/dist/1P/op/pkg/${OP_VERSION}/op_linux_amd64_${OP_VERSION}.zip
  unzip 1password.zip op -d /usr/local/bin
  rm -f 1password.zip
fi

# install doctl
if ! [ -x "$(command -v doctl)" ]; then
  export DOCTL_VERSION="1.20.1"
  wget https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-linux-amd64.tar.gz
  tar xf doctl-${DOCTL_VERSION}-linux-amd64.tar.gz
  chmod +x doctl
  mv doctl /usr/local/bin
  rm -f doctl-${DOCTL_VERSION}-linux-amd64.tar.gz
fi


if [ ! -d "${HOME}/.fzf" ]; then
  echo " ==> Installing fzf"
  git clone https://github.com/junegunn/fzf "${HOME}/.fzf"
  pushd "${HOME}/.fzf"
  git remote set-url origin git@github.com:junegunn/fzf.git
  ${HOME}/.fzf/install --bin --64 --no-bash --no-zsh --no-fish
  popd
fi

if [ ! -d "${HOME}/.zsh" ]; then
  echo " ==> Installing zsh plugins"
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "${HOME}/.zsh/zsh-syntax-highlighting"
  git clone https://github.com/zsh-users/zsh-autosuggestions "${HOME}/.zsh/zsh-autosuggestions"
fi

if [ ! -d "${HOME}/.tmux/plugins" ]; then
  echo " ==> Installing tmux plugins"
  git clone https://github.com/tmux-plugins/tpm "${HOME}/.tmux/plugins/tpm"
  git clone https://github.com/tmux-plugins/tmux-open.git "${HOME}/.tmux/plugins/tmux-open"
  git clone https://github.com/tmux-plugins/tmux-yank.git "${HOME}/.tmux/plugins/tmux-yank"
  git clone https://github.com/tmux-plugins/tmux-prefix-highlight.git "${HOME}/.tmux/plugins/tmux-prefix-highlight"
fi

echo "==> Setting shell to zsh..."
chsh -s /usr/bin/zsh


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

if ! [ -x "$(command -v op)" ]; then

  echo "Pulling secrets"

  op get document 'github_rsa' > github_rsa
  # op get document 'zsh_private' > zsh_private
  # op get document 'zsh_history' > zsh_history

  rm -f ~/.ssh/github_rsa
  ln -sfn $(pwd)/github_rsa ~/.ssh/github_rsa
  chmod 0600 ~/.ssh/github_rsa

  # ln -sfn $(pwd)/zsh_private ~/.zsh_private
  # ln -sfn $(pwd)/zsh_history ~/.zsh_history

  echo "Done!"
fi


# Set correct timezone
timedatectl set-timezone Europe/Madrid

echo ""
echo "==> Done!"
