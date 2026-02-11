/**
 * Combined authentication view with login/register tabs.
 */
import { BaseView } from '@views/BaseView';

export type AuthMode = 'login' | 'register';

export class AuthView extends BaseView {
  private mode: AuthMode = 'login';
  private onLoginCallback?: (data: Record<string, string>) => Promise<void>;
  private onRegisterCallback?: (data: Record<string, string>) => Promise<void>;
  private submitButton?: HTMLButtonElement;

  constructor(containerId: string) {
    super(containerId);
  }

  onLogin(callback: (data: Record<string, string>) => Promise<void>): void { this.onLoginCallback = callback; }
  onRegister(callback: (data: Record<string, string>) => Promise<void>): void { this.onRegisterCallback = callback; }

  setMode(mode: AuthMode): void { this.mode = mode; this.render(); }

  disableSubmit(disabled: boolean): void {
    if (this.submitButton) {
      this.submitButton.disabled = disabled;
      const label = disabled ? (this.mode === 'login' ? 'Logging in...' : 'Registering...') : (this.mode === 'login' ? 'Login' : 'Register');
      this.submitButton.textContent = label;
    }
  }

  render(): void {
    this.clear();
    const wrapper = document.createElement('div');
    wrapper.className = 'min-h-[calc(100vh-120px)] flex items-center justify-center py-12 px-4';
    const card = document.createElement('div');
    card.className = 'w-full max-w-md bg-card rounded-2xl shadow-card overflow-hidden';

    card.appendChild(this.createHeader());
    card.appendChild(this.createTabs());
    card.appendChild(this.createFormSection());

    wrapper.appendChild(card);
    this.container.appendChild(wrapper);
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'bg-gradient-to-br from-primary to-primary-dark p-8 text-center';
    const logo = document.createElement('h1');
    logo.className = 'text-white text-2xl font-bold m-0 mb-2';
    logo.textContent = 'WealthTrack';
    const tagline = document.createElement('p');
    tagline.className = 'text-white/70 text-sm m-0';
    tagline.textContent = this.mode === 'login' ? 'Welcome back' : 'Create your account';
    header.appendChild(logo);
    header.appendChild(tagline);
    return header;
  }

  private createTabs(): HTMLDivElement {
    const tabs = document.createElement('div');
    tabs.className = 'flex border-b border-border';
    tabs.appendChild(this.createTab('Login', 'login'));
    tabs.appendChild(this.createTab('Register', 'register'));
    return tabs;
  }

  private createTab(label: string, tabMode: AuthMode): HTMLButtonElement {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.textContent = label;
    const isActive = this.mode === tabMode;
    const active = 'bg-card text-primary border-b-2 border-b-primary';
    const inactive = 'bg-gray-50 text-muted hover:text-text-dark';
    tab.className = `flex-1 py-4 text-sm font-semibold border-none cursor-pointer transition-colors ${isActive ? active : inactive}`;
    tab.addEventListener('click', () => this.mode !== tabMode && this.setMode(tabMode));
    return tab;
  }

  private createFormSection(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'p-8';
    const form = document.createElement('form');
    form.className = 'flex flex-col gap-4';
    form.id = 'auth-form';

    if (this.mode === 'register') {
      const nameRow = document.createElement('div');
      nameRow.className = 'grid grid-cols-2 gap-4';
      nameRow.appendChild(this.createFormField('text', 'firstName', 'First Name', 'John'));
      nameRow.appendChild(this.createFormField('text', 'lastName', 'Last Name', 'Doe'));
      form.appendChild(nameRow);
    }

    form.appendChild(this.createFormField('email', 'email', 'Email', 'you@example.com'));
    const pwPlaceholder = this.mode === 'register' ? 'Min 8 chars (Upper, Lower, Digit)' : 'Your password';
    form.appendChild(this.createFormField('password', 'password', 'Password', pwPlaceholder));

    this.submitButton = document.createElement('button');
    this.submitButton.type = 'submit';
    this.submitButton.textContent = this.mode === 'login' ? 'Login' : 'Register';
    this.submitButton.className = 'w-full mt-4 py-3 px-6 bg-primary text-white font-semibold rounded-lg border-none cursor-pointer hover:bg-primary-dark transition-colors';
    form.appendChild(this.submitButton);

    form.addEventListener('submit', (e) => void this.handleSubmit(e));
    container.appendChild(form);
    container.appendChild(this.createSwitchLink());
    return container;
  }

  private createSwitchLink(): HTMLParagraphElement {
    const switchLink = document.createElement('p');
    switchLink.className = 'text-center text-muted text-sm mt-6 m-0';
    const [id, text, linkText] = this.mode === 'login' 
      ? ['switch-to-register', "Don't have an account? ", 'Register']
      : ['switch-to-login', 'Already have an account? ', 'Login'];
    switchLink.innerHTML = `${text}<a href="#" class="text-primary font-semibold no-underline hover:underline" id="${id}">${linkText}</a>`;
    const link = switchLink.querySelector(`#${id}`);
    link?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setMode(this.mode === 'login' ? 'register' : 'login');
    });
    return switchLink;
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.clearFieldErrors();
    const form = event.target as HTMLFormElement;
    const data: Record<string, string> = {};
    new FormData(form).forEach((value, key) => {
      data[key] = String(value);
    });
    const callback = this.mode === 'login' ? this.onLoginCallback : this.onRegisterCallback;
    if (callback) await callback(data);
  }

  displayErrors(errors: Record<string, string>): void {
    Object.entries(errors).forEach(([field, error]) => this.displayFieldError(field, error));
  }

  protected override createFormField(type: string, name: string, label: string, placeholder?: string): HTMLDivElement {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'flex flex-col gap-1.5';
    const labelElement = document.createElement('label');
    labelElement.htmlFor = name;
    labelElement.textContent = label;
    labelElement.className = 'text-sm font-medium text-text-dark';
    const input = document.createElement('input');
    input.type = type;
    input.id = name;
    input.name = name;
    input.placeholder = placeholder || '';
    input.className = 'w-full p-3 border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
    const errorSpan = document.createElement('span');
    errorSpan.className = 'text-red-500 text-xs hidden';
    errorSpan.id = `${name}-error`;
    fieldDiv.appendChild(labelElement);
    fieldDiv.appendChild(input);
    fieldDiv.appendChild(errorSpan);
    return fieldDiv;
  }

  protected override displayFieldError(fieldName: string, error: string): void {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) errorElement.textContent = error, errorElement.classList.remove('hidden');
  }

  protected override clearFieldErrors(): void {
    this.container.querySelectorAll('[id$="-error"]').forEach((e) => {
      (e as HTMLElement).textContent = '';
      (e as HTMLElement).classList.add('hidden');
    });
  }

  override showError(message: string): void { this.showMessage(message, 'error'); }
  override showSuccess(message: string): void { this.showMessage(message, 'success'); }

  private showMessage(message: string, type: 'error' | 'success'): void {
    const existing = this.container.querySelector('.auth-message');
    if (existing) existing.remove();

    const form = this.container.querySelector('#auth-form');
    if (!form) return;

    const msgDiv = document.createElement('div');
    const classes = type === 'error'
      ? 'bg-red-100 text-red-700 border border-red-200'
      : 'bg-green-100 text-green-700 border border-green-200';
    msgDiv.className = `auth-message p-4 rounded-lg mb-4 text-sm ${classes}`;
    msgDiv.textContent = message;

    form.insertBefore(msgDiv, form.firstChild);
    setTimeout(() => msgDiv.remove(), 5000);
  }
}
