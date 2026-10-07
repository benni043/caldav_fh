<script setup lang="ts">
	const { t, localeProperties } = useI18n();

	useHead(() => ({
		title: t("title"),
		htmlAttrs: { lang: localeProperties.value.language },
	}));
</script>

<template>
	<UApp>
		<NuxtPage />
	</UApp>
</template>
