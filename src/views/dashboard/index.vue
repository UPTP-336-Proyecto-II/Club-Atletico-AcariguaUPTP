<template>
  <div class="inicio-container">
    <div class="welcome-card glass-card">
      <div class="welcome-header">
        <div class="user-avatar-wrapper">
          <img :src="avatar+'?imageView2/1/w/120/h/120'" class="user-avatar">
          <div class="status-indicator"></div>
        </div>
        <div class="welcome-text">
          <h1 class="welcome-title">Bienvenido, {{ name }}</h1>
          <p class="user-role">{{ roles.join(' • ') }}</p>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="quick-action-card" @click="$router.push('/atletas/index')">
          <div class="icon-box blue"><el-icon><User /></el-icon></div>
          <h3>Atletas</h3>
          <p>Gestión de equipo</p>
        </div>
        <div class="quick-action-card" @click="$router.push('/asistencia/registro')">
          <div class="icon-box red"><el-icon><Calendar /></el-icon></div>
          <h3>Asistencia</h3>
          <p>Pase de lista</p>
        </div>
        <div class="quick-action-card" @click="$router.push('/reportes/rendimiento')">
          <div class="icon-box green"><el-icon><DataLine /></el-icon></div>
          <h3>Reportes</h3>
          <p>Estadísticas</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { User, Calendar, DataLine } from '@element-plus/icons-vue'

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
  background-image: radial-gradient(circle at 10% 20%, rgba(255, 59, 48, 0.05) 0%, transparent 40%),
                    radial-gradient(circle at 90% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 40%);
}

.glass-card {
  background: var(--color-bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 48px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;
  text-align: left;
}

.user-avatar-wrapper {
  position: relative;
}

.user-avatar {
  width: 90px;
  height: 90px;
  border-radius: 24px;
  border: 3px solid #fff;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: #22c55e;
  border: 4px solid var(--color-bg-card);
  border-radius: 50%;
}

.welcome-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--color-text-main);
  margin: 0 0 4px 0;
  letter-spacing: -0.025em;
}

.user-role {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: capitalize;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.quick-action-card {
  background: var(--color-bg-body);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;

  &:hover {
    transform: translateY(-8px);
    border-color: var(--color-primary);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    background: var(--color-bg-hover);
  }
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 16px;

  &.blue { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
  &.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
  &.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
}

.quick-action-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--color-text-main);
}

.quick-action-card p {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0;
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
