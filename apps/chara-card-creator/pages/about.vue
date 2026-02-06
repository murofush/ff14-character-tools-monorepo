<template>
  <v-row justify="center" id="about">
    <v-col cols="11" sm="9" md="8">
      <v-card>
        <v-card-title>
          <h1>このサイトについて</h1>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <h2>概要</h2>
              <p>
                画像を切り取ったときに簡易的なcopyrightを自動で挿入してくれるサイトです。
              </p>
              <p>
                今のところcopyrightを挿入するだけの機能しかないですが、今後色々追加してく予定です（未定）
              </p>
            </v-col>
            <v-col cols="12">
              <h2>プライバシー</h2>
              <p>
                このサイトは「Google Analytics」を使用しております。<br />
                「Google
                Analytics」はデータ収集のためにCookieを使用しております。<br />
                ただし、このCookieによるデータ収集は個人を特定するものではありません。
              </p>
              <p class="mt-3">詳細に関しましては下記をご覧ください。</p>
              <ul>
                <li>
                  <a
                    href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                    >Google アナリティクス利用規約</a
                  >
                </li>
                <li>
                  <a href="https://policies.google.com/privacy?hl=ja"
                    >Google ポリシーと規約</a
                  >
                </li>
              </ul>
              <p class="mt-3">
                また、「<a href="https://tools.google.com/dlpage/gaoptout?hl=ja"
                  >Google アナリティクス オプトアウト アドオン</a
                >」を利用することでGoogle
                Analyticsによる情報収集を無効化することができます。
              </p>
            </v-col>
            <v-col>
              <v-row no-gutters justify="center">
                <v-btn
                  color="primary"
                  nuxt
                  to="/"
                  large
                  block
                  class="font-weight-bold"
                  >サイトに戻る</v-btn
                >
              </v-row>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<style lang="scss" scoped>
  #about {
    margin-top: 32px;
  }
  h2 {
    margin: 12px 0;
  }
  p {
    margin-bottom: 8px;
  }
</style>
