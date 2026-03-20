<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const hash = window.location.search.slice(1)
  if (window.localStorage) {
    window.localStorage.setItem('x-admin-oauth-code', hash)
    window.close()
  }
})
</script>

<template>
  <div />
</template>
