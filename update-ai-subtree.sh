#!/bin/bash

# 설정
REMOTE_REPO=typescript-ai
REMOTE_BRANCH=master
LOCAL_BRANCH=ai_master
SPLIT_BRANCH=ai_split
SUBTREE_PREFIX=src/utils/ai

# 원격 브랜치 최신 상태로 업데이트
echo "🔄 Fetching latest changes from remote..."
git fetch $REMOTE_REPO $REMOTE_BRANCH

# 로컬 브랜치에 리셋
echo "🔃 Resetting local tracking branch $LOCAL_BRANCH to remote..."
git branch -f $LOCAL_BRANCH $REMOTE_REPO/$REMOTE_BRANCH

# 서브트리 split
echo "🌳 Splitting subtree from $REMOTE_REPO..."
git switch $LOCAL_BRANCH
git subtree split --prefix=src/ai -b $SPLIT_BRANCH

# 메인 브랜치로 돌아와서 subtree pull
echo "📥 Pulling subtree into $SUBTREE_PREFIX..."
git switch -
git subtree pull --prefix=$SUBTREE_PREFIX $REMOTE_REPO $SPLIT_BRANCH

# package.json 복사
echo "📦 Copying package.json from remote repo root..."
PACKAGE_SRC_PATH=$(git --git-dir=$(git rev-parse --git-path .git) --work-tree=. show $REMOTE_REPO/$REMOTE_BRANCH:package.json 2>/dev/null)
if [ -n "$PACKAGE_SRC_PATH" ]; then
  git show $REMOTE_REPO/$REMOTE_BRANCH:package.json > $SUBTREE_PREFIX/package.json
  echo "✅ package.json copied to $SUBTREE_PREFIX"
else
  echo "⚠️  package.json not found in $REMOTE_REPO/$REMOTE_BRANCH"
fi