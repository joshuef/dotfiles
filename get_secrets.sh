#!/bin/bash
echo "=>>>Pulling secrets"

op get document 'zhwkovejeqq7x55sy3ba6ovy5i' > github_rsa --tags devops
op get document 'kk2wcb4oiptf7g2zprmdgo34uy' > sharing_rsa --tags devops
# op get document 'zsh_private' > zsh_private
# op get document 'zsh_history' > zsh_history

rm -f ~/.ssh/github_rsa
rm -f ~/.ssh/sharing_rsa
ln -sfn $(pwd)/github_rsa ~/.ssh/github_rsa
ln -sfn $(pwd)/sharing ~/.ssh/sharing_rsa
chmod 0600 ~/.ssh/github_rsa
chmod 0600 ~/.ssh/sharing_rsa
ssh-keygen -y -f ~/.ssh/sharing_rsa > ~/.ssh/sharing_rsa.pub

# ln -sfn $(pwd)/zsh_private ~/.zsh_private
# ln -sfn $(pwd)/zsh_history ~/.zsh_history



echo "IdentityFile ~/.ssh/github_rsa" > ~/.ssh/config

echo "Done!"
