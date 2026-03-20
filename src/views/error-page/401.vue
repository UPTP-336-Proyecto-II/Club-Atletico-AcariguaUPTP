<template>
  <div class="errPage-container">
    <el-button class="pan-back-btn" @click="back">
      Volver
    </el-button>
    <el-row>
      <el-col :span="12">
        <h1 class="text-jumbo text-ginormous">
          Oops!
        </h1>
        <h2>No tienes permisos para acceder a esta página</h2>
        <h6>Contacta con el administrador si crees que es un error</h6>
        <ul class="list-unstyled">
          <li>Puedes ir a:</li>
          <li class="link-type">
            <router-link to="/dashboard">
              Página de inicio
            </router-link>
          </li>
        </ul>
      </el-col>
      <el-col :span="12">
        <img :src="errGif" width="313" height="428" alt="Error 401">
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
    width: 800px;
    max-width: 100%;
    margin: 100px auto;
    .pan-back-btn {
      background: #008489;
      color: #fff;
      border: none!important;
    }
    .pan-img {
      display: block;
      margin: 0 auto;
      width: 100%;
    }
    .text-jumbo {
      font-size: 60px;
      font-weight: 700;
      color: #484848;
    }
    .list-unstyled {
      font-size: 14px;
      li {
        padding-bottom: 5px;
      }
      a {
        color: #008489;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
</style>
