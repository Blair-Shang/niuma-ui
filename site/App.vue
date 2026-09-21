<script setup lang="ts">
import { RsConfigProvider, RsLoadingBar, RsToaster, RsTooltipProvider } from 'niuma-ui'
import { readInitialSiteLocale } from './i18n'
import SiteShell from './layouts/SiteShell.vue'

const locale = readInitialSiteLocale()
</script>

<template>
  <RsConfigProvider :locale="locale">
    <RsToaster position="top-right" :close-button="true" />
    <RsTooltipProvider>
      <RsLoadingBar>
        <SiteShell />
      </RsLoadingBar>
    </RsTooltipProvider>
  </RsConfigProvider>
</template>
