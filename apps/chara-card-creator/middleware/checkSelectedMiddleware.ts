import { Context } from '@nuxt/types'

export default function ({ from, route, redirect, ssrContext }: Context) {
  if (ssrContext || from.name === route.name) {
    redirect('/selectAchievement')
  }
}
