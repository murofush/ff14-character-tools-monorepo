// Axiosは使ってないが、念の為
import { Plugin } from '@nuxt/types'
import { initializeAxios } from '~/utils/api'

const accessor: Plugin = ({ $axios }) => {
  initializeAxios($axios)
}

export default accessor
