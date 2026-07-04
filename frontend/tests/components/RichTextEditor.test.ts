import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RichTextEditor from '@/components/RichTextEditor.vue';

beforeEach(() => {
  document.execCommand = vi.fn();
  vi.stubGlobal('prompt', vi.fn(() => 'https://example.com'));
});

const byTitle = (w: ReturnType<typeof mount>, title: string) =>
  w.findAll('button').find((b) => b.attributes('title') === title)!;

describe('RichTextEditor', () => {
  it('renders the toolbar and the initial content', () => {
    const w = mount(RichTextEditor, { props: { modelValue: '<p>hello</p>' } });
    expect((w.find('[contenteditable]').element as HTMLElement).innerHTML).toContain('hello');
    expect(w.text()).toContain('List');
  });

  it('applies inline formatting via execCommand', async () => {
    const w = mount(RichTextEditor, { props: { modelValue: '' } });
    await byTitle(w, 'Bold').trigger('mousedown');
    expect(document.execCommand).toHaveBeenCalledWith('bold');
    await byTitle(w, 'Bulleted list').trigger('mousedown');
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList');
  });

  it('formats a heading and inserts a link from the prompt', async () => {
    const w = mount(RichTextEditor, { props: { modelValue: '' } });
    await byTitle(w, 'Heading').trigger('mousedown');
    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, 'H2');
    await byTitle(w, 'Link').trigger('mousedown');
    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
  });

  it('emits update:modelValue with the editor HTML on input', async () => {
    const w = mount(RichTextEditor, { props: { modelValue: '' } });
    const editor = w.find('[contenteditable]');
    (editor.element as HTMLElement).innerHTML = '<p>typed</p>';
    await editor.trigger('input');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['<p>typed</p>']);
  });
});
