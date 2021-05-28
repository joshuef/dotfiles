# Setup fzf
# ---------
if [[ ! "$PATH" == */home/josh/.fzf/bin* ]]; then
  export PATH="${PATH:+${PATH}:}/home/josh/.fzf/bin"
fi

# Auto-completion
# ---------------
[[ $- == *i* ]] && source "/home/josh/.fzf/shell/completion.zsh" 2> /dev/null

# Key bindings
# ------------
source "/home/josh/.fzf/shell/key-bindings.zsh"
