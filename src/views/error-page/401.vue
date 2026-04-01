<template>
  <div class="errPage-container">
    <el-button class="pan-back-btn" @click="back">
      Volver
    </el-button>
    <el-row>
      <el-col :span="12">
     <div class="err-content">
       <h1 class="text-jumbo">Oops!</h1>
       <h2 class="err-title">No tienes permisos para acceder a esta página</h2>
       <p class="err-subtitle">Contacta con el administrador si crees que es un error</p>
       <div class="link-section">
         <p>Puedes ir a:</p>
         <router-link to="/dashboard" class="premium-link">
           <i class="el-icon-s-home" /> Página de inicio
         </router-link>
       </div>
     </div>
   </el-col>
   <el-col :span="12" class="img-col">
     <div class="pic-401">
       <img :src="errGif" width="313" height="428" alt="Error 401">
     </div>
   </el-col>
 </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import errGifImg from '@/assets/401_images/401.gif'

defineOptions({
  name: 'Page401'
})

const route = useRoute()
const router = useRouter()
const errGif = ref(errGifImg + '?' + +new Date())

function back() {
  if (route.query.noGoBack) {
    router.push({ path: '/dashboard' })
  } else {
    router.go(-1)
  }
}
</script>

<style lang="scss" scoped>
  .errPage-container {
    width: 900px;
    max-width: 100%;
    margin: 100px auto;
    padding: 0 20px;

    .pan-back-btn {
      background: var(--color-primary);
      color: #fff;
      border: none !important;
      border-radius: 12px;
      padding: 10px 24px;
      font-weight: 700;
      transition: all 0.2s ease;
      margin-bottom: 40px;

      &:hover {
        background: var(--color-primary-hover);
        transform: translateX(-4px);
      }
    }

    .err-content {
      padding-top: 20px;
    }

    .text-jumbo {
      font-size: 80px;
      font-weight: 800;
      color: var(--color-primary);
      margin: 0 0 16px 0;
      letter-spacing: -0.05em;
    }

    .err-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 0 0 12px 0;
    }

    .err-subtitle {
      font-size: 16px;
      color: var(--color-text-muted);
      margin-bottom: 30px;
    }

    .link-section {
      p {
        font-size: 14px;
        color: var(--color-text-muted);
        margin-bottom: 12px;
      }
      .premium-link {
        color: var(--color-primary);
        font-weight: 700;
        font-size: 1.1rem;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: color 0.2s;

        &:hover {
          color: var(--color-primary-hover);
          text-decoration: underline;
        }
      }
    }

    .img-col {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .pic-401 {
      overflow: hidden;
      border-radius: 24px;
      box-shadow: 0 10px 30px -10px var(--color-shadow);
    }
  }
</style>
