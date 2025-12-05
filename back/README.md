# README
## セットアップ
### 1.パッケージインストール
DockerDesktopを起動して、compose.yamlがあるフォルダで以下のコマンドを実行。
※appフォルダの下にnode_modulesフォルダと.envファイルが作られる。.envファイル（0バイト）は削除してok。
```
docker compose run --rm -it app bash -c "yarn"
```

### 2.コンテナ起動（compose.yamlから起動する場合）
compose.yamlがあるフォルダで以下のコマンドを実行。
```
docker compose up -d
```

### 3.コンテナ起動（Dockerfileから起動する場合）
Dockerfileがあるフォルダで以下のコマンドを順番に実行。
```
docker build --build-arg MODE_ENV=OTH -t "dblinkapi" .
docker run --rm -d --net=net -p "3000:3000" --name dblinkapi dblinkapi
```

## アプリの構成
```
app/
├─package.json
├─yarn.lock
├─tsconfig.json
└─src/
   ├─.env                       # 環境変数設定ファイル　★★★★変更要！（アプリ・実行環境毎の設定が必要）
   ├─index.ts                   # エントリポイント
   ├─app/                       # アプリ用フォルダ
   │  └─test/                  #                      　★★★★変更要！
   │     ├─get_vm_test.ts      # [個別処理]SELECT     　★★★★変更要！
   │     ├─post_vm_test.ts     # [個別処理]INSERT     　★★★★変更要！
   │     ├─patch_vm_test.ts    # [個別処理]UPDATE     　★★★★変更要！
   │     └─delete_vm_test.ts   # [個別処理]DELETE     　★★★★変更要！
   └─common/                    # 共通処理用フォルダ
      ├─appExecutor.ts          # アプリ実行
      ├─authentication.ts       # 認証
      ├─const.ts                # 定数
      ├─database.ts             # データベース処理
      ├─log.ts                  # ログ
      ├─requestHandler.ts       # リクエスト処理
      ├─sendResponse.ts         # レスポンス送信
      ├─sqlExecutor.ts          # SQL実行
      ├─types.ts                # 型
      └─validation.ts           # バリデーション
```








## サンプルCURL
### SELECT
```
curl -s -X POST -H "Content-Type: application/json" `
-H 'Authorization:Bearer <認証情報>' `
-d '
{
  "from" : "2000-01-01T00:00:00.000Z"
 ,"to"   : "2099-12-31T00:00:00.000Z"
}
' http://<ホスト名>:<ポート>/test/get_vm_test
```

### INSERT
```
curl -s -X POST -H "Content-Type: application/json" `
-H 'Authorization:Bearer <認証情報>' `
-d '
[
  {
    "code"       : "A01",
    "name"       : "AAA",
    "created_by" : "App_Bxx",
    "updated_by" : "App_Bxx"
  },
  {
    "code"       : "A02",
    "name"       : "BBB",
    "created_by" : "App_Bxx",
    "updated_by" : "App_Bxx"
  }
]
' http://<ホスト名>:<ポート>/test/post_vm_test
```

### UPDATE
```
curl -s -X POST -H "Content-Type: application/json" `
-H 'Authorization:Bearer <認証情報>' `
-d '
{
  "set"          : {
    "updated_by" : "App_Bxx",
    "name"       : "CCC"
  },
  "where"        : {
    "code"       : "A01"
  }
}
' http://<ホスト名>:<ポート>/test/patch_vm_test
```

### DELETE
```
curl -s -X POST -H "Content-Type: application/json" `
-H 'Authorization:Bearer <認証情報>' `
-d '
{
  "from" : "2000-01-01T00:00:00.000Z"
 ,"to"   : "2099-12-31T00:00:00.000Z"
}
' http://<ホスト名>:<ポート>/test/delete_vm_testd
```

※認証情報の作成は以下を参照
https://hash-base64.vercel.app/
