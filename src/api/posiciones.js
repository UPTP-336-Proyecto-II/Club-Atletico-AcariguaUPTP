import request from '@/utils/request'

export function getPosiciones() {
  return request({
    url: '/posiciones',
    method: 'get'
  })
}
