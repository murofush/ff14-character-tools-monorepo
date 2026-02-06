// NuxtでClientSideで何かを実行したい場合にはここから

import { Context } from '@nuxt/types'
export default async (context: Context) => {
  await context.store.dispatch('characterInfo/nuxtClientInit', context)
}
