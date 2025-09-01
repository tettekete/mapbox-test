# Mapbox の初期調査 && 習作のためのリポジトリ

```sh
$ git clone https://github.com/tettekete/mapbox-test.git
$ cd mapbox-test
$ cp .env.development.local.example .env.development.local
$ vi .env.development.local
  # VITE_MAPBOX_TOKEN_SHUF に値を設定する。このトークンは scripts/make-shuffled-token.ts を用いて作る
$ npm run dev
  # http://localhost:5173/ で確認可能
```

