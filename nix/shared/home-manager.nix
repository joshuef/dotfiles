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
    export PATH=$HOME/.bun/bin:$PATH
    export PATH="/Applications/Antigravity.app/Contents/Resources/app/bin:$PATH"

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
    # alias code=cursor

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

    alias agy="antigravity"

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
    ignores = [ "*.swp" ".envrc" ".DS_Store" ];
    userName = name;
    userEmail = email;
    lfs.enable = true;

    aliases = {
      # Staging
      a = "add";
      aa = "add --all";

      # Branch
      branch-name = "rev-parse --abbrev-ref HEAD";
      branch-diff = "diff main...HEAD";
      branch-files = "!git diff main...HEAD --name-status | sed '/^D/d ; s/^.\\s\\+//'";

      # br = branch
      # Sorts by recent branches
      br = "!r() { refbranch=$1 count=$2; git for-each-ref --sort=-committerdate refs/heads --format='%(refname:short)|%(HEAD)%(color:yellow)%(refname:short)|%(color:bold green)%(committerdate:relative)|%(color:blue)%(subject)%(color:reset)' --color=always --count=\${count:-20} | while read line; do branch=$(echo \"$line\" | awk 'BEGIN { FS = \"|\" }; { print $1 }' | tr -d '*'); ahead=$(git rev-list --count \"\${refbranch:-origin/main}..\${branch}\"); behind=$(git rev-list --count \"\${branch}..\${refbranch:-origin/main}\"); colorline=$(echo \"$line\" | sed 's/^[^|]*|//'); echo \"$ahead|$behind|$colorline\" | awk -F'|' -vOFS='|' '{$5=substr($5,1,70)}1' ; done | ( echo \"ahead|behind||branch|lastcommit|message\\n\" && cat) | column -ts'|';}; r";
      brold = "!r() { count=$1; git for-each-ref --sort=committerdate refs/heads --format='%(refname:short)|%(HEAD)%(color:yellow)%(refname:short)|%(color:bold green)%(committerdate:relative)|%(color:blue)%(subject)%(color:reset)' --color=always --count=\${count:-20} | while read line; do branch=$(echo \"$line\" | awk 'BEGIN { FS = \"|\" }; { print $1 }' | tr -d '*'); ahead=$(git rev-list --count \"\${origin/main}..\${branch}\"); behind=$(git rev-list --count \"\${branch}..\${origin/main}\"); colorline=$(echo \"$line\" | sed 's/^[^|]*|//'); echo \"$ahead|$behind|$colorline\" | awk -F'|' -vOFS='|' '{$5=substr($5,1,70)}1' ; done | ( echo \"ahead|behind||branch|lastcommit|message\\n\" && cat) | column -ts'|';}; r";

      # Commit
      c = "commit";
      ca = "commit -a";
      cm = "commit -m";
      cn = "commit --no-verify -m";
      cal = "!git add -A && git commit";
      cam = "commit -am";
      cne = "commit --no-edit";
      amend = "commit --amend";
      amend-all = "!git add --all && git commit --amend --reuse-message=HEAD";

      # Clone
      cl = "clone";
      sclone = "clone --depth=1";

      # Checkout
      co = "checkout";
      cb = "checkout -b";

      # Cherry-pick
      cp = "cherry-pick";

      # Diff
      d = "diff --color-words";
      dc = "diff --cached";
      df = "!\"git diff-index --quiet HEAD -- || clear; git --no-pager diff --patch-with-stat\"";

      # Fix Conflicts
      fc = "!\"git diff --name-only | uniq | xargs nvim\"";

      # Merge
      m = "merge";

      # Pull
      up = "pull";
      plom = "pull origin main";
      plum = "pull upstream main";
      pluum = "pull upstream master";
      preb = "!git fetch upstream && git rebase upstream/main";

      # Push
      p = "push";
      pom = "push origin main";
      poh = "push origin head";

      # Pulls functions
      pum = "!f() { git co main; git pull upstream main; }; f";
      pud = "!f() { echo \"Were not using dev branch anywhere just now...\" }; f";

      # PRs
      pro = "!f() { git co main; git clean-branch origin-$1; git fetch origin pull/$1/head:PR-origin-$1; git co PR-origin-$1; }; f";
      pru = "!f() { git co main; git clean-branch upstream-$1; git fetch upstream pull/$1/head:PR-upstream-$1; git co PR-upstream-$1; }; f";
      pruu = "!f() { git co master; git clean-branch upstream-$1; git fetch upstream pull/$1/head:PR-upstream-$1; git co PR-upstream-$1; }; f";

      # Stash
      st = "stash";
      stp = "stash pop";

      # Status/Logging
      s = "status";
      ss = "status -sb";
      hist = "log --graph --pretty=custom";
      l = "log --pretty=custom";
      ll = "log --stat --abbrev-commit";
      lc = "shortlog --summary --numbered";

      # Reset
      unstage = "reset HEAD --";
      undo = "reset --soft HEAD~1";
      reset = "reset --hard HEAD~1";

      # Tag pushing
      put = "!f() { git push upstream --no-verify; git tag $1; git push upstream --no-verify $1; }; f";

      # Remote
      r = "remote -v";

      # Rebase
      ri = "rebase -i";
      fix = "!f() { git commit --fixup \${1:-HEAD}; GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash; }; f";
      fixall = "!f() { git add --all; git commit --fixup \${1:-HEAD}; GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash; }; f";

      # Submodules
      subpl = "submodule update --init --recursive";

      # Repository Setup
      addr = "!f() { git remote add -f $1 git@github.com:$1/$(basename -s .git `git config --get remote.origin.url`).git; }; f";

      # Git flow
      new = "!git pull origin develop && git flow feature start";
      done = "!git pull origin develop && git flow feature finish \"$(git symbolic-ref --short HEAD | sed -n 's/^feature\\///p')\"";
      go = "!git checkout $1 && pull";
      master = "!git checkout master && pull";
      main = "!git checkout main && pull";
      develop = "!git checkout develop && pull";
      mmm = "!git fetch origin main && git rebase origin/main";
      ddd = "!git fetch origin develop && git rebase origin/develop";

      # Misc
      publish = "!git push --set-upstream origin $(git branch-name)";
      
      # Accidentally typing git git
      git = "!exec git";

      # Cleanup
      cab = "!f() { git branch | grep -v '^*' | xargs git branch -D; }; f";
      cob = "!r() { count=$2; git for-each-ref --sort=committerdate refs/heads ;}; r";
      cold = "!r() { count=$1; git for-each-ref --sort=committerdate refs/heads --count=\${count:-3} --format='%(refname:short)' --color=always | xargs git branch -D ; }; r";

      clean-branch = "!f() { git branch -D $(git branch --color=never | grep $1); }; f";
      clean-local = "!f() { git tag -d $(git tag -l | grep $1); }; f";
      clean-origin = "!f() { git fetch origin --tags; git push origin --delete $(git tag -l | grep $1) --no-verify; }; f";
      clean-upstream = "!f() { git fetch upstream --tags; git push upstream --delete $(git tag -l | grep $1) --no-verify; }; f";
      clean-tags = "!f() { git fetch; git clean-origin $1; git clean-local $1; }; f";
      clean-tags-upstream = "!f() { git fetch; git clean-origin $1; git clean-upstream $1; git clean-local $1; }; f";

      # Find commits by source code
      cc = "!f() { git log --pretty=custom --decorate --date=short -S\"$1\"; }; f";

      # Find commits by commit message
      fcm = "!f() { git log --pretty=custom --decorate --date=short --grep=\"$1\"; }; f";

      # Credit an author
      credit = "!f() { if [ -n \"$1\" ] && [ -n \"$2\" ]; then git commit --amend --author \"$1 <$2>\" -C HEAD; fi }; f";

      # List remote branches
      lrb = "!f() { remote=\"\${1:-origin}\"; git ls-remote --heads \"$remote\"; }; f";

      # Merge GitHub pull request
      mpr = "!f() { declare currentBranch=\"$(git symbolic-ref --short HEAD)\"; declare branch=\"\${2:-$currentBranch}\"; if [ $(printf \"%s\" \"$1\" | grep '^[0-9]\\+$' > /dev/null; printf $?) -eq 0 ]; then git fetch origin refs/pull/$1/head:pr/$1 && git checkout -B $branch && git rebase $branch pr/$1 && git checkout -B $branch && git merge pr/$1 && git branch -D pr/$1 && git commit --amend -m \"$(git log -1 --pretty=%B)\n\nClose #$1\"; fi }; f";

      # Retag
      retag = "!f() { git tag -d \"$1\" &> /dev/null; git tag $1; }; f";
    };
    
    extraConfig = {
      init.defaultBranch = "main";
      core = {
        editor = "nvim";
        autocrlf = "input";
        excludesfile = "~/.gitignore_global";
        pager = "diff-so-fancy | less --tabs=4 -RFX";
      };
      
      pull.rebase = true;
      push.default = "current";
      push.followTags = true;
      rebase.autoStash = true;
      fetch.prune = true;
      rerere.enabled = true;
      branch.autosetuprebase = "always";
      
      "diff \"bin\"" = {
        textconv = "hexdump -v -C";
      };

      "diff \"nodiff\"" = {
        command = "echo";
      };
      
      color = {
        ui = true;
        diff = {
            frag = "magenta bold";
            meta = "yellow";
            new = "green bold";
            old = "red bold";
            commit = "yellow bold";
            whitespace = "red reverse";
        };
      };
      
      "color \"diff-highlight\"" = {
        oldNormal = "red bold";
        oldHighlight = "red bold 52";
        newNormal = "green bold";
        newHighlight = "green bold 22";
      };
      
      "color \"status\"" = {
        added = "green reverse";
        changed = "yellow reverse";
        untracked = "red reverse";
      };

      "color \"branch\"" = {
        current = "green bold";
        local = "green";
        remote = "yellow";
      };
      
      pager = {
        diff = "diff-so-fancy | less --tabs=4 -RFX";
        show = "diff-so-fancy | less --tabs=4 -RFX";
      };
      
      pretty = {
        custom = "%C(magenta)%h%C(red)%d %C(yellow)%ar %C(green)%s %C(yellow)(%an)";
      };
      
      # URL Rewrites
      "url \"git@github.com:\"" = {
        insteadOf = ["gh:" "git://github.com"];
        pushInsteadOf = ["github:" "git://github.com/" "https://github.com/"];
      };
      "url \"git://github.com/\"" = {
        insteadOf = "github:";
      };
      "url \"git@gist.github.com:\"" = {
         insteadOf = "gst:";
         pushInsteadOf = ["gist:" "git://gist.github.com/" "https://gist.github.com/"];
      };
      "url \"git://gist.github.com/\"" = {
          insteadOf = "gist:";
      };
      
      # Secrets
      secrets = {
        providers = "git secrets --aws-provider";
      };
      
      include = {
        path = "~/.gitconfig.local";
      };
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
