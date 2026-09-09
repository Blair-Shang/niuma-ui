<script setup lang="ts">
import { RsConfigProvider, RsLoadingBar, RsToaster, RsTooltipProvider } from 'niuma-ui'
import PlaygroundLayout from './layouts/PlaygroundLayout.vue'
import {
  playgroundToasterCloseButton,
  playgroundToasterPosition,
  playgroundToasterRichColors,
} from './composables/playground-toaster'
</script>

<template>
  <RsConfigProvider>
    <RsToaster
      :position="playgroundToasterPosition"
      :close-button="playgroundToasterCloseButton"
      :rich-colors="playgroundToasterRichColors"
    />
    <!-- 页面树须包在插槽内，useRsLoadingBar() 才能拿到真实 API -->
    <RsTooltipProvider>
      <RsLoadingBar>
        <PlaygroundLayout />
      </RsLoadingBar>
    </RsTooltipProvider>
  </RsConfigProvider>
</template>
