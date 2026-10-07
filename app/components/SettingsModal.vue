<script setup lang="ts">
	import type { Language } from "~/composables/useSettings";

	const settings = useSettings();

	const { locale, locales, setLocale } = useI18n();

	const languages = computed(() =>
		locales.value.map((item) => ({ label: item.name, value: item.code })),
	);

	const changeLanguage = (language: Language) => {
		settings.value.language = language;
		setLocale(language);
	};
</script>

<template>
	<UModal :title="$t('settings.title')">
		<button
			type="button"
			:aria-label="$t('settings.title')"
			class="flex rounded-md p-1.5 transition hover:cursor-pointer hover:bg-neutral-700"
		>
			<UIcon name="i-lucide-settings" class="size-5" />
		</button>

		<template #body>
			<div class="flex flex-col gap-4">
				<UFormField :label="$t('language')">
					<USelect
						:model-value="locale"
						:items="languages"
						icon="i-lucide-languages"
						class="w-48"
						@update:model-value="changeLanguage"
					/>
				</UFormField>

				<USwitch
					v-model="settings.colorfulToday"
					:label="$t('settings.colorfulToday')"
				/>
			</div>
		</template>
	</UModal>
</template>
