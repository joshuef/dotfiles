#!/bin/bash
# inspired by fatih arslan

echo "Macos machine setup"

# Run brew installers first
echo "==> Running homebrew installers"
./install/brew.sh

# echo "==> Installing nvm"
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash


# install rust
if ! [ -x "$(command -v rustup)" ]; then
  echo "==> Installing rustup"

  curl https://sh.rustup.rs -sSf | sh
fi


HOURLY_CRON="/etc/cron.hourly"
if [ ! -d "$HOURLY_CRON/ip-check" ]; then
    sudo ln -snf $(pwd)/ip-check.sh "$HOURLY_CRON/ip-check"
    sudo chmod 0600 "$HOURLY_CRON/ip-check"
    sudo chmod +x "$HOURLY_CRON/ip-check"
fi

NVIM_DIR="${HOME}/.nvim"

if [ ! -d "${NVIM_DIR}" ]; then
  echo " ==> Setting up nvim"
  mkdir -p ~/.local/share/nvim/backup
  mkdir -p ~/.local/share/nvim/undodir
  echo " ==> Installing nvim config"

  ln -sfn "$(pwd)/nvim/init.vim" "${HOME}/.config/nvim/init.vim"

  echo " ==> Installing nvim plugins"
  ln -sfn "$(pwd)/nvim/plugins.vim" "${HOME}/.config/nvim/plugins.vim"
  curl -fLo "${HOME}/.config/nvim/plug.vim" https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim

  nvim -c 'PlugInstall | :q | :q'
  nvim -c 'UpdateInstalledPlugins | :q | :q'
  # nvim -c 'CocInst coc-json coc-html|q coc-eslint coc-rsl coc-tsserver coc-css'
  pip3 install --user pynvim
  # install ripgrep
  curl -LO https://github.com/BurntSushi/ripgrep/releases/download/11.0.2/ripgrep_11.0.2_amd64.deb
  sudo dpkg -i ripgrep_11.0.2_amd64.deb
  rm ripgrep_11.0.2_amd64.deb

fi


if ! [ -x "$(command -v trash)" ]; then
  echo " ==> Installing trash"
  yarn global add trash-cli
fi




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

  echo " ==> Installing zsh plugins"
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "${HOME}/.oh-my-zsh/plugins/zsh-syntax-highlighting"
  git clone https://github.com/zsh-users/zsh-autosuggestions "${HOME}/.oh-my-zsh/plugins/zsh-autosuggestions"
  git clone https://github.com/agkozak/zsh-z "${HOME}/.oh-my-zsh/plugins/zsh-z"
  git clone https://github.com/bhilburn/powerlevel9k.git "${HOME}/.oh-my-zsh/themes/powerlevel9k"
fi


# TODO: enable this...
if [ ! -d "$HOME/.zshrc" ]; then
# if [ ! -d /mnt/dev/code/dotfiles ]; then
  echo "==> Setting up dotfiles"
#   # the reason we dont't copy the files individually is, to easily push changes
#   # if needed
#   cd "/mnt/dev/code"
#   git clone --recursive https://github.com/joshuef/dotfiles.git
#
#   cd "/mnt/dev/code/dotfiles"
#   git remote set-url origin git@github.com:joshuef/dotfiles.git
#
#   ln -sfn $(pwd)/vimrc "${HOME}/.vimrc"
  ln -sfn $(pwd)/shell/zshrc "${HOME}/.zshrc"
  ln -sfn $(pwd)/shell/zshrc "${HOME}/.zshrc"
  # ln -sfn $(pwd)/zprofile "${HOME}/.zprofile"
#   ln -sfn $(pwd)/tmuxconf "${HOME}/.tmux.conf"
#   ln -sfn $(pwd)/tigrc "${HOME}/.tigrc"
#   ln -sfn $(pwd)/git-prompt.sh "${HOME}/.git-prompt.sh"
  ln -sfn $(pwd)/git/gitconfig "${HOME}/.gitconfig"
#   ln -sfn $(pwd)/agignore "${HOME}/.agignore"
  # ln -sfn $(pwd)/ssh_config "${HOME}/.ssh/config"
fi

zsh

# Run NPM installers
echo "==> Running NPM installers"
./install/npm.sh


echo "==!!> TODO: set shell to zsh.w.."
echo "run: \"chsh -s /usr/bin/zsh\" to set zsh as shell"

# Set correct timezone
# timedatectl set-timezone Europe/Madrid

echo ""
echo "==> Done!"

echo "Now:"

echo "nvim -c 'CocInst coc-json coc-html|q coc-eslint coc-rsl coc-tsserver coc-css'"
echo " then zsh""


# setup dominat colour for photog border / squared
curl http://www.fmwconcepts.com/imagemagick/downloadcounter.php\?scriptname\=dominantcolor\&dirname\=dominantcolor > /usr/local/bin/dominantcolor
chmod +x /usr/local/bin/dominantcolor
