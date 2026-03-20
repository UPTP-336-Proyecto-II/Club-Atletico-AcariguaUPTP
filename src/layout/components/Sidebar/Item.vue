<template>
  <span>
    <template v-if="icon">
      <i v-if="icon.includes('el-icon')" :class="[icon, 'sub-el-icon']" />
      <svg-icon v-else :icon-class="icon" />
    </template>
    <span v-if="title" class="menu-item-text">{{ title }}</span>
  </span>
</template>

<script>
export default {
  name: 'MenuItem',
  props: {
    icon: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.sub-el-icon {
  color: currentColor;
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
}

// Estilos para el texto del menú
.menu-item-text {
  font-family: 'Figtree', 'Segoe UI', sans-serif;
  letter-spacing: 0.3px;
}
</style>
