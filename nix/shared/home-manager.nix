{ config, pkgs, lib, ... }:

let name = "Josh Wilson";
    user = "josh";
    email = "joshuef@gmail.com"; in
{

  fzf = {    enable = true;  };
  zoxide = {    enable = true;  };
  # Shared shell configuration
  zsh.enable = true;
  zsh.autosuggestion.enable = true;
  zsh.syntaxHighlighting.enable = true;
  zsh.autocd = false;
  # zsh.oh-my-zsh = {
  #      enable = true;
  #     #  theme = "robbyrussel";
  #       # plugins=["git" "tmux" "docker" "systemd" "z" "syntax-highlighting" "autosuggestions"];
  #   };
  zsh.cdpath = [ "~/.local/share/src" ];
  zsh.zplug = {
    enable = true;

    plugins = [
      { name = "plugins/colored-man-pages"; tags = [from:oh-my-zsh]; }
      { name = "plugins/colorize";          tags = [from:oh-my-zsh]; }
      { name = "plugins/command-not-found"; tags = [from:oh-my-zsh]; }
      { name = "plugins/fd";                tags = [from:oh-my-zsh]; }
      { name = "plugins/fzf";               tags = [from:oh-my-zsh]; }
      { name = "plugins/git";               tags = [from:oh-my-zsh]; }
      { name = "plugins/ripgrep";           tags = [from:oh-my-zsh]; }
      # { name = "plugins/tmux";              tags = [from:oh-my-zsh]; }
      # { name = "plugins/vi-mode";           tags = [from:oh-my-zsh]; }
      { name = "plugins/cargo";             tags = [from:oh-my-zsh]; }
      { name = "plugins/H-S-MW";             tags = [from:oh-my-zsh]; }
      { name = "plugins/zsh-syntax-highlighting";  tags = [from:oh-my-zsh]; }
      { name = "plugins/zsh-autosuggestions";      tags = [from:oh-my-zsh]; }
      { name = "plugins/direnv";            tags = [from:oh-my-zsh]; }
      # { name = "plugins/pass";              tags = [from:oh-my-zsh]; }
      { name = "plugins/rsync";             tags = [from:oh-my-zsh]; }
      # { name = "plugins/"; tags = [from:oh-my-zsh]; }
      { name = "kutsan/zsh-system-clipboard"; }  # IMPORTANT
      # { name = "romkatv/powerlevel10k"; tags = [ as:theme depth:1 ]; }
    ];
  };
  zsh.plugins = [
    {
        name = "powerlevel10k";
        src = pkgs.zsh-powerlevel10k;
        file = "share/zsh-powerlevel10k/powerlevel10k.zsh-theme";
    }
    # {
    #     name = "zinit";
    #     src = pkgs.zinit;
    # }
    # {
    #     name = "zsh-syntax-highlighting";
    #     src = pkgs.zsh-syntax-highlighting;
    # }
    # {
    #     name = "zsh-history-search-multi-word";
    #     src = pkgs.zsh-history-search-multi-word;
    # }
    # {
    #     name = "zsh-autosuggestions";
    #     src = pkgs.zsh-autosuggestions;
    # }
    {
        name = "powerlevel10k-config";
        src = lib.cleanSource ./config;
        file = "p10k.zsh";
    }
  ];
  zsh.initExtra = lib.mkBefore ''
    if [[ -f /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh ]]; then
      . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
      . /nix/var/nix/profiles/default/etc/profile.d/nix.sh
    fi


    # Basic shell configs
    setopt inc_append_history # Append history as commands are executed
    setopt hist_ignore_all_dups # Don't save duplicates
    unsetopt share_history # Disable sharing history between terminals (sessions)

    # Defaults
    export SHELL=/bin/zsh

    # Preferred editor for local and remote sessions
    if [[ -n $SSH_CONNECTION ]]; then
      export EDITOR='nano'
    else
      export EDITOR='nano'
    fi

    # Prefer US English and use UTF-8
    export LC_ALL="en_US.UTF-8"
    export LANG="en_US"



    # Expansion and Globbing
    setopt extended_glob # treat #, ~, and ^ as part of patterns for filename generation



    # Define variables for directories
    export PATH=$HOME/.pnpm-packages/bin:$HOME/.pnpm-packages:$PATH
    export PATH=$HOME/.npm-packages/bin:$HOME/bin:$PATH
    export PATH=$HOME/.local/share/bin:$PATH
    export PATH=$HOME/.local/bin:$PATH
    export PATH=$HOME/.cargo/bin:$PATH
    export PATH=$HOME/.maestro/bin:$PATH
    export PNPM_HOME=~/.pnpm-packages

    # Remove history data we don't want to see
    export HISTIGNORE="pwd:ls:cd"

    # Usability aliases
    # alias rm="trashy"
    alias cat="bat"

    FZF_DEFAULT_OPTS="--bind='ctrl-o:execute(code {})+abort'"
    # FZF_DEFAULT_COMMAND='rg --files --hidden'

    HISTFILE=~/.zsh_history
    HISTSIZE=10000
    SAVEHIST=10000
    setopt appendhistory

    # # no correct for command args
    setopt nocorrectall; setopt correct

    # looping cmds until fail
    untilfail() {
      while "$@"; do :; done
    }

    # nix shortcuts
    shell() {
        nix-shell '<nixpkgs>' -A "$1"
    }

    # pnpm is a javascript package manager
    alias pn=pnpm
    alias px=pnpx

    # Cursor/code setup
    alias code=cursor

    # Use difftastic, syntax-aware diffing
    alias diff=difft

    # Always color ls and group directories
    alias ls='ls --color=auto'

    # Ssh via jumpbox on DO
    ssj() {
        local jumpbox_ip=$JUMPBOX_IP
        local target_ip="$1"
        ssh -A -J root@$jumpbox_ip root@$target_ip
    }

    # Rsync via jumpbox on DO
    rj() {
        local jumpbox_ip=$JUMPBOX_IP
        local target_ip="$1"
        local remote_path="$2"
        local local_path="$3"

        rsync -avz --include="$include_glob" --exclude="*.gz" -e "ssh -A -J root@$jumpbox_ip" root@$target_ip:$remote_path $local_path

    }


    #   -----------------------------
    #   2.  MAKE TERMINAL BETTER
    #   -----------------------------

    alias du="ncdu --color dark -rr -x --exclude .git --exclude node_modules"


    # Make Tab autocomplete regardless of filename case (cd ~/dow<Tab> => cd ~/Downloads/)
    set completion-ignore-case on

    # Immediately add a trailing slash when autocompleting symlinks to directories
    set mark-symlinked-directories on

    # Do not expand "~" to the home directory when completing. (The actual value passed on to the command still is expanded,
    # though. Which is good.) "Off" is the default value, but some servers override this
    set expand-tilde off

    # Flip through autocompletion matches with Shift-Tab
    bindkey '\e[Z' menu-complete

    # Do not autocomplete hidden files ("dot files") unless the pattern explicitly begins with a dot
    set match-hidden-files off

    # Show all autocomplete results at once
    set page-completions off

    # If there are more than 200 possible completions for a word, ask to show them all
    set completion-query-items 200

    # Auto list all TAB possible completions (use instead of TAB-cycling)
    set show-all-if-ambiguous on

    # Show extra file information when completing, like `ls -F` does
    set visible-stats on

    # Be more intelligent when autocompleting by also looking at the text after
    # the cursor. For example, when the current line is "cd ~/src/mozil", and
    # the cursor is on the "z", pressing Tab will not autocomplete it to "cd
    # ~/src/mozillail", but to "cd ~/src/mozilla". (This is supported by the
    # Readline used by Bash 4.)
    set skip-completed-text on

    # Use the text that has already been typed as the prefix for searching through
    # commands (basically more intelligent Up/Down behavior)
    bindkey '\e[B' history-beginning-search-forward
    bindkey '\e[A' history-beginning-search-backward

    # ctrl left, ctrl right for moving on the readline by word
    bindkey '\e[1;5C' forward-word
    bindkey '\e[1;5D' backward-word
    #pg up/down
    bindkey "\e[5~" beginning-of-line
    bindkey "\e[6~" end-of-line

    # Try to stay at the same position when moving through the history
    set history-preserve-point on


    #
    # Line editing
    #

    # Allow UTF-8 input and output, instead of showing stuff like $'\0123\0456'
    set input-meta on
    set output-meta on
    set convert-meta off

    # Delete for wonky terminals
    bindkey '\e[3~' delete-char

    # Home/End
    bindkey '\e[1~' beginning-of-line
    bindkey '\e[4~' end-of-line

    # Use Alt/Meta + Delete to delete the preceding word
    bindkey '\e[3;3~' kill-word


    #
    # Misc
    #

    # Disable beeping and window flashing
    set bell-style none

    alias subl='/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl'
    alias ls='ls -GFhl'
    alias cp='cp -iv'                           # Preferred 'cp' implementation
    alias mv='mv -iv'                           # Preferred 'mv' implementation
    alias mkdir='mkdir -pv'                     # Preferred 'mkdir' implementation
    alias ll='ls -FGlAhp'                       # Preferred 'ls' implementation
    alias less='less -FSRXc'                    # Preferred 'less' implementation
    cd() { builtin cd "$@"; ll; }               # Always list directory contents upon 'cd'
    alias cd..='cd ../'                         # Go back 1 directory level (for fast typers)
    alias ..='cd ../'                           # Go back 1 directory level
    alias ...='cd ../../'                       # Go back 2 directory levels
    alias .3='cd ../../../'                     # Go back 3 directory levels
    alias .4='cd ../../../../'                  # Go back 4 directory levels
    alias .5='cd ../../../../../'               # Go back 5 directory levels
    alias .6='cd ../../../../../../'            # Go back 6 directory levels
    alias edit='subl'                           # edit:         Opens any file in sublime editor
    alias f='open -a Finder ./'                 # f:            Opens current directory in MacOS Finder
    alias ~="cd ~"                              # ~:            Go Home
    alias c='clear'                             # c:            Clear terminal display
    # alias which='type -all'                     # which:        Find executables
    alias show_options='shopt'                  # Show_options: display bash options settings
    alias fix_stty='stty sane'                  # fix_stty:     Restore terminal settings when screwed up
    alias cic='set completion-ignore-case On'   # cic:          Make tab-completion case-insensitive
    mcd () { mkdir -p "$1" && cd "$1"; }        # mcd:          Makes new Dir and jumps inside
    trash () { command mv "$@" ~/.Trash ; }     # trash:        Moves a file to the MacOS trash
    ql () { qlmanage -p "$*" >& /dev/null; }    # ql:           Opens any file in MacOS Quicklook Preview
    alias DT='tee ~/Desktop/terminalOut.txt'    # DT:           Pipe content to file on MacOS Desktop


    # ripgrap all and fzf for search across many file types for strings
    rgfz() {
      RG_PREFIX="rga --files-with-matches"
      local file
      file="$(
        FZF_DEFAULT_COMMAND="$RG_PREFIX '$1'" \
          fzf --sort --preview="[[ ! -z {} ]] && rga --pretty --context 5 {q} {}" \
            --phony -q "$1" \
            --bind "change:reload:$RG_PREFIX {q}" \
            --preview-window="70%:wrap"
      )" &&
      echo "opening $file" &&
      xdg-open "$file"
    }
  '';

  git = {
    enable = true;
    ignores = [ "*.swp" ".envrc" ];
    userName = name;
    userEmail = email;
    lfs = {
      enable = true;
    };
    extraConfig = {
      init.defaultBranch = "main";
      core = {
	    editor = "nvim";
        autocrlf = "input";
        excludesfile = "~/.gitignore_global";
      };
      pull.rebase = true;
      rebase.autoStash = true;
    };
  };

  vim = {
    enable = true;
    plugins = with pkgs.vimPlugins; [ vim-airline vim-airline-themes vim-startify ];
    settings = { ignorecase = true; };
    extraConfig = ''
      "" General
      set number
      set history=1000
      set nocompatible
      set modelines=0
      set encoding=utf-8
      set scrolloff=3
      set showmode
      set showcmd
      set hidden
      set wildmenu
      set wildmode=list:longest
      set cursorline
      set ttyfast
      set nowrap
      set ruler
      set backspace=indent,eol,start
      set laststatus=2
      set clipboard=autoselect

      " Dir stuff
      set nobackup
      set nowritebackup
      set noswapfile
      set backupdir=~/.config/vim/backups
      set directory=~/.config/vim/swap

      " Relative line numbers for easy movement
      set relativenumber
      set rnu

      "" Whitespace rules
      set tabstop=8
      set shiftwidth=2
      set softtabstop=2
      set expandtab

      "" Searching
      set incsearch
      set gdefault

      "" Statusbar
      set nocompatible " Disable vi-compatibility
      set laststatus=2 " Always show the statusline
      let g:airline_theme='bubblegum'
      let g:airline_powerline_fonts = 1

      "" Local keys and such
      let mapleader=","
      let maplocalleader=" "

      "" Change cursor on mode
      :autocmd InsertEnter * set cul
      :autocmd InsertLeave * set nocul

      "" File-type highlighting and configuration
      syntax on
      filetype on
      filetype plugin on
      filetype indent on

      "" Paste from clipboard
      nnoremap <Leader>, "+gP

      "" Copy from clipboard
      xnoremap <Leader>. "+y

      "" Move cursor by display lines when wrapping
      nnoremap j gj
      nnoremap k gk

      "" Map leader-q to quit out of window
      nnoremap <leader>q :q<cr>

      "" Move around split
      nnoremap <C-h> <C-w>h
      nnoremap <C-j> <C-w>j
      nnoremap <C-k> <C-w>k
      nnoremap <C-l> <C-w>l

      "" Easier to yank entire line
      nnoremap Y y$

      "" Move buffers
      nnoremap <tab> :bnext<cr>
      nnoremap <S-tab> :bprev<cr>

      "" Like a boss, sudo AFTER opening the file to write
      cmap w!! w !sudo tee % >/dev/null

      let g:startify_lists = [
        \ { 'type': 'dir',       'header': ['   Current Directory '. getcwd()] },
        \ { 'type': 'sessions',  'header': ['   Sessions']       },
        \ { 'type': 'bookmarks', 'header': ['   Bookmarks']      }
        \ ]

      let g:startify_bookmarks = [
        \ '~/.local/share/src',
        \ ]

      let g:airline_theme='bubblegum'
      let g:airline_powerline_fonts = 1
      '';
     };

  # alacritty = {
  #   enable = true;
  #   settings = {
  #     cursor = {
  #       style = "Block";
  #     };

  #     window = {
  #       opacity = 1.0;
  #       padding = {
  #         x = 24;
  #         y = 24;
  #       };
  #     };

  #     font = {
  #       normal = {
  #         family = "MesloLGS NF";
  #         style = "Regular";
  #       };
  #       size = lib.mkMerge [
  #         (lib.mkIf pkgs.stdenv.hostPlatform.isLinux 10)
  #         (lib.mkIf pkgs.stdenv.hostPlatform.isDarwin 14)
  #       ];
  #     };

  #     dynamic_padding = true;
  #     decorations = "full";
  #     title = "Terminal";
  #     class = {
  #       instance = "Alacritty";
  #       general = "Alacritty";
  #     };

  #     colors = {
  #       primary = {
  #         background = "0x1f2528";
  #         foreground = "0xc0c5ce";
  #       };

  #       normal = {
  #         black = "0x1f2528";
  #         red = "0xec5f67";
  #         green = "0x99c794";
  #         yellow = "0xfac863";
  #         blue = "0x6699cc";
  #         magenta = "0xc594c5";
  #         cyan = "0x5fb3b3";
  #         white = "0xc0c5ce";
  #       };

  #       bright = {
  #         black = "0x65737e";
  #         red = "0xec5f67";
  #         green = "0x99c794";
  #         yellow = "0xfac863";
  #         blue = "0x6699cc";
  #         magenta = "0xc594c5";
  #         cyan = "0x5fb3b3";
  #         white = "0xd8dee9";
  #       };
  #     };
  #   };
  # };

  ssh = {
    enable = true;

    extraConfig = lib.mkMerge [
      ''
        Host *
          IdentityAgent "~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"

        Host github.com
          Hostname github.com
          IdentitiesOnly yes

        ## Download these to ~/.ssh before we can use them
        Host github.com
          IdentityFile ~/.ssh/github_rsa.pub
          IdentitiesOnly yes

        IdentityFile ~/.ssh/sharing_rsa.pub

        Host *
            ControlMaster auto
            ControlPath ~/.ssh/control:%h:%p:%r

        Include ~/.orbstack/ssh/config

      ''
      # (lib.mkIf pkgs.stdenv.hostPlatform.isLinux
      #   ''
      #     IdentityFile /home/${user}/.ssh/github_rsa
      #   '')
      # (lib.mkIf pkgs.stdenv.hostPlatform.isDarwin
      #   ''
      #     IdentityFile /Users/${user}/.ssh/github_rsa
      #   '')
    ];
  };

}
