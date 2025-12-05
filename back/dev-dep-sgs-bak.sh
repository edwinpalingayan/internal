#!/usr/bin/bash
#-------------------------------------------------------------------------------
# Dockerイメージデプロイ処理（dev環境 sgs-bak用）
#-------------------------------------------------------------------------------
# エラー処理
set -e
trap 'echo "エラーが発生しました。処理を終了します。"; exit 1;' ERR

# 変数設定
REGION="ap-northeast-1"
AWS_ACCOUNT_ID="357430904384"
ENV="dev"
APP_NAME="sgs"
CON_NAME="bak"

cd /home/admin.apps/$ENV/$APP_NAME/env/$CON_NAME

rm -r app
unzip app.zip -d ./

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
docker build --build-arg MODE_ENV=${ENV^^} -t "$ENV-scl-rep-$APP_NAME-$CON_NAME" .
docker tag  "$ENV-scl-rep-$APP_NAME-$CON_NAME:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ENV-scl-rep-$APP_NAME-$CON_NAME:latest"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ENV-scl-rep-$APP_NAME-$CON_NAME:latest"
aws ecr describe-images --repository-name $ENV-scl-rep-$APP_NAME-$CON_NAME --query "reverse(sort_by(imageDetails, &imagePushedAt))[0]"
exit 0