<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="app-wrapper">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
.app-wrapper {
  height: 100dvh;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  box-shadow: 0 0 40px rgba(0,0,0,0.05);
  background: white;
}

@media (min-width: 500px) {
  body {
    background: #f0f2f5;
  }
}
</style>
