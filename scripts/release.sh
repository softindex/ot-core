#!/bin/bash

# git status -s 1> /dev/null && echo "Commit repo first" && exit 1

VERSION=v$(cat package.json | awk 'BEGIN{FS="\""}/"version"/{print $4}')

! [ -z $(git tag -l $VERSION) ] && echo "Tag already exists" && exit 1

npm run build \
  && cat .gitignore | awk '$0!~"lib"{print}' > ~.gitignore \
  && mv ~.gitignore .gitignore \
  && git add . \
  && git commit -m $VERSION \
  && git tag $VERSION \
  && git push --tags origin \
  && git reset --hard HEAD~1
