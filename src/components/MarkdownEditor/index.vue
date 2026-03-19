<template>
  <div :id="id" :style="{ height: height }">
    <div style="padding: 20px; border: 1px dashed #ccc; background-color: #f9f9f9; text-align: center; color: #666;">
      <h3>Markdown Editor (Deshabilitado)</h3>
      <p>El componente tui-editor ha sido removido temporalmente para solucionar errores en la instalación de las dependencias (`npm install`).</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MarkdownEditor',
  props: {
    value: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      required: false,
      default() {
        return 'markdown-editor-' + +new Date() + ((Math.random() * 1000).toFixed(0) + '')
      }
    },
    options: {
      type: Object,
      default() {
        return {}
      }
    },
    mode: {
      type: String,
      default: 'markdown'
    },
    height: {
      type: String,
      required: false,
      default: '300px'
    },
    language: {
      type: String,
      required: false,
      default: 'en_US'
    }
  },
  methods: {
    setValue(value) {
      this.$emit('input', value)
    },
    getValue() {
      return this.value
    },
    setHtml(value) {
      this.$emit('input', value)
    },
    getHtml() {
      return this.value
    }
  }
}
</script>
