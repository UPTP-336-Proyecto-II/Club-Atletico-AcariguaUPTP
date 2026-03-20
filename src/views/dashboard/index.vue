<template>
  <div class="inicio-container">
    <div class="welcome-card">
      <div class="welcome-content">
        <h1 class="welcome-title">Bienvenido al Sistema</h1>
        <div class="user-info">
          <img :src="avatar+'?imageView2/1/w/120/h/120'" class="user-avatar">
          <h2 class="user-name">{{ name }}</h2>
          <p class="user-role">{{ roles.join(', ') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const name = computed(() => store.getters.name)
const avatar = computed(() => store.getters.avatar)
const roles = computed(() => store.getters.roles)
</script>

<style lang="scss" scoped>
.inicio-container {
  padding: 40px;
  min-height: calc(100vh - 84px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(30, 41, 59, 0.1);
  padding: 60px 80px;
  text-align: center;
  max-width: 600px;
  width: 100%;
  border-top: 4px solid var(--color-primary);
}

.welcome-content {
  .welcome-title {
    font-size: 32px;
    font-weight: 700;
    color: #333;
    margin: 0 0 40px 0;
    font-family: 'Figtree', 'Segoe UI', sans-serif;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .user-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid var(--color-primary);
      box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .user-name {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-primary);
      margin: 0;
      font-family: 'Figtree', 'Segoe UI', sans-serif;
    }

    .user-role {
      font-size: 16px;
      color: #666;
      margin: 0;
      text-transform: capitalize;
      font-weight: 400;
    }
  }
}

@media (max-width: 768px) {
  .inicio-container {
    padding: 20px;
  }

  .welcome-card {
    padding: 40px 30px;
  }

  .welcome-content {
    .welcome-title {
      font-size: 24px;
      margin-bottom: 30px;
    }

    .user-info {
      .user-avatar {
        width: 80px;
        height: 80px;
      }

      .user-name {
        font-size: 20px;
      }

      .user-role {
        font-size: 14px;
      }
    }
  }
}
</style>
