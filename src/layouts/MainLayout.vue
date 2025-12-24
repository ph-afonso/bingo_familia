<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-deep-purple-8">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-icon name="casino" size="sm" class="q-mr-sm"/>
          Bingo Realtime
        </q-toolbar-title>

        <div class="text-caption">v1.0</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Menu do Jogo </q-item-label>

        <q-item clickable to="/" exact>
          <q-item-section avatar><q-icon name="person" /></q-item-section>
          <q-item-section>
            <q-item-label>Área do Jogador</q-item-label>
            <q-item-label caption>Sua cartela</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>