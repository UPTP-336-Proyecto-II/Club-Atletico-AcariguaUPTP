<template>
  <div class="placeholder-container">
    <div class="placeholder-card">
      <div class="icon-wrapper">
        <i :class="iconClass" />
      </div>
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-description">Estás en {{ title }}</p>
      <div class="info-box">
        <i class="el-icon-info" />
        <span>Esta sección está en desarrollo</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlaceholderView',
  props: {
    title: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: 'el-icon-document'
    }
  },
  computed: {
    iconClass() {
      return this.icon
    }
  }
}
</script>

<style lang="scss" scoped>
.placeholder-container {
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--color-shadow);
  padding: 60px 80px;
  text-align: center;
  max-width: 600px;
  width: 100%;
  border-top: 4px solid var(--color-primary);

  .icon-wrapper {
    margin-bottom: 24px;

    i {
      font-size: 64px;
      color: var(--color-primary);
      opacity: 0.8;
    }
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-main);
    margin: 0 0 16px 0;
    font-family: 'Figtree', 'Segoe UI', sans-serif;
  }

  .page-description {
    font-size: 16px;
    color: var(--color-text-muted);
    margin: 0 0 32px 0;
  }

  .info-box {
    background: rgba(229, 29, 34, 0.05);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px 24px;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: var(--color-primary);
    font-size: 14px;
    font-weight: 500;

    i {
      font-size: 20px;
    }
  }
}

@media (max-width: 768px) {
  .placeholder-container {
    padding: 20px;
  }

  .placeholder-card {
    padding: 40px 30px;

    .icon-wrapper i {
      font-size: 48px;
    }

    .page-title {
      font-size: 22px;
    }

    .page-description {
      font-size: 14px;
    }
  }
}
</style>
