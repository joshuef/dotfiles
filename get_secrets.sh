#!/bin/bash
echo "=>>>Pulling secrets"

op get document 'github_rsa' > github_rsa --tags devops
# op get document 'zsh_private' > zsh_private
# op get document 'zsh_history' > zsh_history

rm -f ~/.ssh/github_rsa
ln -sfn $(pwd)/github_rsa ~/.ssh/github_rsa
chmod 0600 ~/.ssh/github_rsa

# ln -sfn $(pwd)/zsh_private ~/.zsh_private
# ln -sfn $(pwd)/zsh_history ~/.zsh_history



echo "IdentityFile ~/.ssh/github_rsa" > ~/.ssh/config

echo "Done!"
