<script setup lang="ts">
import { RsConfigProvider, RsLoadingBar, RsToaster, RsTooltipProvider } from 'niuma-ui'
import SiteShell from './layouts/SiteShell.vue'
</script>

<template>
  <RsConfigProvider>
    <RsToaster position="top-right" :close-button="true" />
    <RsTooltipProvider>
      <RsLoadingBar>
        <SiteShell />
      </RsLoadingBar>
    </RsTooltipProvider>
  </RsConfigProvider>
</template>
