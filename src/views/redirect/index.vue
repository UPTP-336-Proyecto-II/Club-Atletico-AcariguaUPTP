<script>
import { useRoute, useRouter } from 'vue-router'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { params, query } = route
    const { path } = params
    router.replace({ path: '/' + path, query })
  },
  render() {
    return null
  }
}
</script>
