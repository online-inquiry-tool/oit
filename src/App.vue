<!-- SPDX-License-Identifier: BSD-2-Clause
     Copyright (c) 2022, Jari Hämäläinen, Carita Kiili and Julie Coiro -->
<template lang="pug">
.container.mt-1
  //- TODO: For some reason .mb-3 in TopBar is not showing in generated code, bug in Vite?
  TopBar.mb-3(
    @show-languages='showLanguages'
    @show-about='showAbout'
  )
  MainView
  ModalLanguages(
    :languages='languages'
    @set-language='onSetLanguage'
    ref='mdlLanguages'
  )
  ModalAbout(
    ref='mdlAbout'
  )
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';
import type {OitLanguage} from '@/composition/ModalLanguages';
import useModalLanguages from '@/composition/ModalLanguages';
import TopBar from '@/components/TopBar.vue';
import ModalAbout from '@/components/ModalAbout.vue';
import ModalLanguages from '@/components/ModalLanguages.vue';
import MainView from '@/views/MainView.vue';

const {availableLocales, locale, t} = useI18n();
const {languages} = useModalLanguages(
  availableLocales
    .slice(0) // slice makes a copy preventing "sort in place" side effect
    .sort()
    .map((locale) => ({
      locale,
      name: t(`language.${locale}`, {locale: 'en'}),
    })),
);

const mdlLanguages = ref<InstanceType<typeof ModalLanguages>>();
const mdlAbout = ref<InstanceType<typeof ModalAbout>>();

const setPageTitle = () => {
  document.title = t('page.title');
};

const onSetLanguage = (l: OitLanguage) => {
  console.log('set', l);
  locale.value = l.locale;
  mdlLanguages.value?.hide();
  setPageTitle();
};
const showLanguages = () => {
  mdlLanguages.value?.show();
};
const showAbout = () => {
  mdlAbout.value?.show();
};
</script>

<style lang="scss">
@use '../node_modules/bootstrap' as bs;
@use '../node_modules/bootstrap-icons' as bsi;

.me-2-last-0 {
  @extend .me-2;
  &:last-child {
    @extend .me-0;
  }
}

.drag-handle {
  cursor: grab;
}
</style>