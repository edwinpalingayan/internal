# React + TypeScript + Vite
フロントエンド開発セットアップ

## 🚀 クイックスタート

1. **Dockerイメージをビルド**
   ```bash
   docker build -t react .
   ```
   → カレントディレクトリの `Dockerfile` から `react` という名前のイメージを作成します。

2. **Dockerコンテナを起動**
   ```bash
   docker run --rm -d --net=net -p "80:80" --name react react
   ```
   → バックグラウンドでコンテナを起動し、ホストのポート80をコンテナのポート80にマッピングします。

---

## 📂 メモ

- すべてのコマンドは `app` ディレクトリ内で実行してください。
- 開発サーバーを起動する前に **Docker コンテナが稼働していること**を確認してください。
- 依存関係でエラーが出た場合は、キャッシュをクリアして再インストールしてください。

---

## 🛠 必要環境

- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) （推奨: 最新のLTS）
- [Yarn](https://yarnpkg.com/)

---

## ❗ トラブルシューティング

- **Docker が起動しない場合**
  Docker Desktop が起動しているか確認してください。`compose.yaml` を変更した場合は再ビルドします:
  ```bash
  docker compose down
  docker compose up --build
  ```

- **ポートが使用中の場合 (例: 80)**
  ```bash
  lsof -i :80
  kill -9 <PID>
  ```

- **依存関係がインストールできない場合**
  ```bash
  rm -rf node_modules package-lock.json yarn.lock
  npm cache clean --force
  yarn install
  ```

- **アプリが表示されない場合**
  ```bash
  docker compose logs -f
  ```
  またはローカルで直接
  ```bash
  yarn dev
  ```
  を試してください。
  （`.env` の設定も確認してください）

- **それでも解決しない場合**
  すべてを削除して再セットアップします:
  ```bash
  docker compose down --volumes --remove-orphans
  docker system prune -af
  ```

---

## ✅ まとめコマンド

```bash
docker compose up
cd app
rm -rf node_modules package-lock.json yarn.lock && npm cache clean --force && yarn && yarn dev
```
