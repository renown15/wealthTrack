<template>
  <div class="border border-border rounded">
    <div class="flex flex-wrap gap-1 p-2 border-b border-border bg-gray-50">
      <button type="button" :class="btn" class="font-bold" title="Bold" @mousedown.prevent="exec('bold')">B</button>
      <button type="button" :class="btn" class="italic" title="Italic" @mousedown.prevent="exec('italic')">I</button>
      <button type="button" :class="btn" class="underline" title="Underline" @mousedown.prevent="exec('underline')">U</button>
      <button type="button" :class="btn" class="font-bold" title="Heading" @mousedown.prevent="heading()">H</button>
      <button type="button" :class="btn" title="Bulleted list" @mousedown.prevent="exec('insertUnorderedList')">&bull; List</button>
      <button type="button" :class="btn" title="Numbered list" @mousedown.prevent="exec('insertOrderedList')">1. List</button>
      <button type="button" :class="btn" title="Link" @mousedown.prevent="addLink()">Link</button>
    </div>
    <div
      ref="editor"
      class="p-3 min-h-40 max-h-100 overflow-y-auto outline-none text-sm leading-relaxed"
      contenteditable="true"
      @input="onInput"
      @blur="onInput"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const btn = 'px-2 py-0.5 text-sm border border-border rounded bg-white hover:bg-gray-100 cursor-pointer';
const editor = ref<HTMLDivElement | null>(null);

function sync(): void {
  const el = editor.value;
  if (el && el.innerHTML !== (props.modelValue || '')) el.innerHTML = props.modelValue || '';
}

onMounted(sync);
watch(() => props.modelValue, () => {
  if (editor.value && document.activeElement !== editor.value) sync();
});

function onInput(): void {
  if (editor.value) emit('update:modelValue', editor.value.innerHTML);
}

function exec(command: string): void {
  document.execCommand(command);
  onInput();
}

function heading(): void {
  document.execCommand('formatBlock', false, 'H2');
  onInput();
}

function addLink(): void {
  const url = window.prompt('Link URL');
  if (url) document.execCommand('createLink', false, url);
  onInput();
}
</script>
