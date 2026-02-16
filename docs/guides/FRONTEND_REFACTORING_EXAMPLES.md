# Frontend Refactoring Examples

## Example 1: useBasicAuthForm Decomposition

### Current Problem (God Composable)
```typescript
// 162 lines doing everything
export function useBasicAuthForm() {
  const isSubmitting = ref(false);
  const form = reactive({ firstName, lastName, email, password });
  const errors = reactive({ field errors });
  const message = reactive({ text, type });
  
  // Message management
  const clearMessage = () => { message.text = ''; };
  const showError = (text) => { message.text = text; setTimeout(clearMessage, 5000); };
  
  // Form validation + errors
  const setErrors = (fieldErrors) => { /* update errors */ };
  const clearErrors = () => { /* reset */ };
  
  // API Calls + Auth Integration
  const handleLogin = async () => {
    const validation = ValidationService.validateLoginForm(form);
    const authToken = await apiService.loginUser(/* ... */);
    authModule.setToken(authToken.accessToken);
    const user = await apiService.getCurrentUser();
    authModule.setUser(user);
    return { success: true, user };
  };
  
  const handleRegister = async () => { /* similar */ };
  
  return { isSubmitting, form, errors, message, ... };
}
```

**Why Hard to Test**:
- Can't test form state without mocking API
- Can't test message logic without fake timers
- Can't test API without mocking validation + auth module
- Integration test only - slow and fragile

---

### Refactored Solution

#### Composable 1: useAuthFormState
```typescript
// Pure state management - zero dependencies
export function useAuthFormState() {
  const form = reactive({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const errors = reactive({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const clearErrors = () => {
    Object.keys(errors).forEach(key => { errors[key] = ''; });
  };

  const setErrors = (fieldErrors: Record<string, string>) => {
    clearErrors();
    Object.entries(fieldErrors).forEach(([key, value]) => {
      if (key in errors) errors[key] = value;
    });
  };

  const resetForm = () => {
    form.firstName = '';
    form.lastName = '';
    form.email = '';
    form.password = '';
  };

  return { form, errors, clearErrors, setErrors, resetForm };
}
```

**Test (super simple)**:
```typescript
describe('useAuthFormState', () => {
  it('initializes with empty form', () => {
    const { form } = useAuthFormState();
    expect(form.email).toBe('');
  });

  it('updates form fields reactively', () => {
    const { form } = useAuthFormState();
    form.email = 'test@example.com';
    expect(form.email).toBe('test@example.com');
  });

  it('setErrors populates error object', () => {
    const { errors, setErrors } = useAuthFormState();
    setErrors({ email: 'Invalid email' });
    expect(errors.email).toBe('Invalid email');
  });

  it('clearErrors resets all errors', () => {
    const { errors, setErrors, clearErrors } = useAuthFormState();
    setErrors({ email: 'Error' });
    clearErrors();
    expect(errors.email).toBe('');
  });
});
```

---

#### Composable 2: useAuthMessages
```typescript
// Message display logic - zero API dependencies
export function useAuthMessages() {
  const message = reactive({ text: '', type: 'error' as const });

  const clearMessage = () => { message.text = ''; };

  const showError = (text: string) => {
    message.text = text;
    message.type = 'error';
    // Use provided timer for testability
    setTimeout(clearMessage, 5000);
  };

  const showSuccess = (text: string) => {
    message.text = text;
    message.type = 'success';
    setTimeout(clearMessage, 5000);
  };

  return { message, clearMessage, showError, showSuccess };
}
```

**Test with fake timers**:
```typescript
describe('useAuthMessages', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('shows error message with correct type', () => {
    const { message, showError } = useAuthMessages();
    showError('Email is invalid');
    expect(message.text).toBe('Email is invalid');
    expect(message.type).toBe('error');
  });

  it('auto-clears message after 5 seconds', () => {
    const { message, showError } = useAuthMessages();
    showError('Test error');
    expect(message.text).toBe('Test error');
    
    vi.advanceTimersByTime(5000);
    expect(message.text).toBe('');
  });

  it('shows success message', () => {
    const { message, showSuccess } = useAuthMessages();
    showSuccess('Logged in!');
    expect(message.type).toBe('success');
  });
});
```

---

#### Composable 3: useAuthService
```typescript
// API operations - depends on services but pure logic
export function useAuthService() {
  const isSubmitting = ref(false);

  const handleLogin = async (
    form: { email: string; password: string }
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      isSubmitting.value = true;

      const validation = ValidationService.validateLoginForm(form);
      if (!validation.isValid) {
        return { success: false, error: 'Invalid form' };
      }

      const authToken = await apiService.loginUser({
        email: form.email,
        password: form.password,
      });

      if (!authToken.accessToken) {
        return { success: false, error: 'No token received' };
      }

      authModule.setToken(authToken.accessToken);
      const user = await apiService.getCurrentUser();
      authModule.setUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    } finally {
      isSubmitting.value = false;
    }
  };

  return { isSubmitting, handleLogin };
}
```

**Test with mocks**:
```typescript
describe('useAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when validation fails', async () => {
    vi.mocked(ValidationService.validateLoginForm).mockReturnValue({
      isValid: false,
      errors: { email: 'Invalid' },
    });

    const { handleLogin } = useAuthService();
    const result = await handleLogin({ email: 'bad', password: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('sets token and user on success', async () => {
    vi.mocked(apiService.loginUser).mockResolvedValue({
      accessToken: 'mock-token',
    });
    vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockUser);

    const { handleLogin } = useAuthService();
    const result = await handleLogin(validForm);

    expect(result.success).toBe(true);
    expect(authModule.setToken).toHaveBeenCalledWith('mock-token');
    expect(authModule.setUser).toHaveBeenCalledWith(mockUser);
  });
});
```

---

#### Updated Auth.vue Component
```vue
<template>
  <div class="auth-container">
    <AuthMessage :message="message" />
    <AuthTabs v-model:mode="mode" />
    
    <AuthForm
      :mode="mode"
      :form="form"
      :errors="errors"
      :is-submitting="isSubmitting"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthFormState } from '@/composables/useAuthFormState';
import { useAuthMessages } from '@/composables/useAuthMessages';
import { useAuthService } from '@/composables/useAuthService';

const mode = ref<'login' | 'register'>('login');
const router = useRouter();

const { form, errors, setErrors, clearErrors } = useAuthFormState();
const { message, clearMessage, showError, showSuccess } = useAuthMessages();
const { isSubmitting, handleLogin, handleRegister } = useAuthService();

const handleSubmit = async () => {
  clearMessage();
  clearErrors();

  if (mode.value === 'login') {
    const result = await handleLogin(form);
    if (result.success) {
      await router.push({ name: 'dashboard' });
    } else {
      showError(result.error || 'Login failed');
    }
  } else {
    const result = await handleRegister(form);
    if (result.success) {
      showSuccess('Registration successful!');
      await router.push({ name: 'login' });
    } else {
      showError(result.error || 'Registration failed');
    }
  }
};
</script>
```

**Key Benefits**:
- Each composable is independently testable
- Easy to test each piece in isolation
- Component is thin and readable
- Logic easily reusable in other auth flows
- Better error handling with explicit return types

---

## Example 2: ReferenceDataAdmin Extraction

### Current Problem (Heavy Component)
```vue
<script setup>
// 191 lines mixing UI, state, API calls, error handling, modal management

const loading = ref(true);
const error = ref('');
const formError = ref('');
const referenceData = ref([]);
const addFormOpen = ref(false);
const deleteConfirmOpen = ref(false);
const isSubmittingNew = ref(false);
const isDeleting = ref(false);

// Multiple methods with repeated error handling
async function loadData() {
  try {
    loading.value = true;
    error.value = '';
    referenceData.value = await referenceDataService.listAll();
  } catch (err) {
    error.value = extractError(err);
  } finally {
    loading.value = false;
  }
}

async function submitNewForm(form) {
  if (!form.classKey.trim()) {
    formError.value = 'Required';
    return;
  }
  try {
    isSubmittingNew.value = true;
    await referenceDataService.create(form);
    await loadData();
    closeAddForm();
  } catch (err) {
    formError.value = extractError(err);
  } finally {
    isSubmittingNew.value = false;
  }
}

async function handleEdit(id, data) {
  try {
    error.value = '';
    const item = referenceData.value.find(x => x.id === id);
    await referenceDataService.update(id, { ...item, ...data });
    await loadData();
  } catch (err) {
    error.value = extractError(err);
  }
}

async function confirmDelete() {
  if (!deleteConfirmItem.value) return;
  try {
    isDeleting.value = true;
    await referenceDataService.delete(deleteConfirmItem.value.id);
    await loadData();
    cancelDelete();
  } catch (err) {
    error.value = extractError(err);
    cancelDelete();
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => loadData());
</script>
```

**Problems**:
- Duplicated error handling
- State scattered across multiple refs
- Hard to test CRUD logic
- Modal state intertwined with data logic

---

### Refactored Solution

#### Composable: useReferenceDataCrud
```typescript
export function useReferenceDataCrud(service: typeof referenceDataService) {
  const loading = ref(false);
  const error = ref('');
  const data = ref<ReferenceDataItem[]>([]);

  const loadData = async () => {
    try {
      loading.value = true;
      error.value = '';
      data.value = await service.listAll();
    } catch (err) {
      error.value = extractError(err);
    } finally {
      loading.value = false;
    }
  };

  const createItem = async (payload: ReferenceDataPayload) => {
    try {
      await service.create(payload);
      await loadData();
      return { success: true };
    } catch (err) {
      const errorMsg = extractError(err);
      return { success: false, error: errorMsg };
    }
  };

  const updateItem = async (id: number, payload: ReferenceDataPayload) => {
    try {
      await service.update(id, payload);
      await loadData();
      return { success: true };
    } catch (err) {
      return { success: false, error: extractError(err) };
    }
  };

  const deleteItem = async (id: number) => {
    try {
      await service.delete(id);
      await loadData();
      return { success: true };
    } catch (err) {
      return { success: false, error: extractError(err) };
    }
  };

  return {
    loading,
    error,
    data,
    loadData,
    createItem,
    updateItem,
    deleteItem,
  };
}
```

**Test**:
```typescript
describe('useReferenceDataCrud', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      listAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('loads data on loadData call', async () => {
    mockService.listAll.mockResolvedValue([
      { id: 1, classKey: 'TYPE', referenceValue: 'Savings' },
    ]);

    const { loadData, data } = useReferenceDataCrud(mockService);
    await loadData();

    expect(data.value).toHaveLength(1);
    expect(data.value[0].classKey).toBe('TYPE');
  });

  it('sets error when load fails', async () => {
    mockService.listAll.mockRejectedValue(new Error('Network error'));

    const { loadData, error } = useReferenceDataCrud(mockService);
    await loadData();

    expect(error.value).toContain('Network error');
  });

  it('createItem reloads data on success', async () => {
    mockService.create.mockResolvedValue(undefined);
    mockService.listAll.mockResolvedValue([newItem]);

    const { createItem, data } = useReferenceDataCrud(mockService);
    const result = await createItem({ classKey: 'TYPE', referenceValue: 'New' });

    expect(result.success).toBe(true);
    expect(mockService.listAll).toHaveBeenCalled();
  });
});
```

---

#### Simplified Component
```vue
<template>
  <div class="page-view">
    <div class="hub-header-card">
      <h1>Reference Data Management</h1>
      <button @click="onAddClick">+ Add Reference Data</button>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="data.length === 0" class="empty">No data</div>

    <ReferenceDataTable
      v-else
      :data="data"
      @edit="onEdit"
      @delete="onDelete"
    />

    <AddReferenceDataModal
      :open="addFormOpen"
      @close="addFormOpen = false"
      @submit="onSubmitForm"
    />

    <DeleteConfirmModal
      :open="deleteConfirmOpen"
      @confirm="onConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useReferenceDataCrud } from '@/composables/useReferenceDataCrud';
import { referenceDataService } from '@/services/ReferenceDataService';

const { data, loading, error: crudError, createItem, updateItem, deleteItem, loadData } = useReferenceDataCrud(referenceDataService);

const addFormOpen = ref(false);
const deleteConfirmOpen = ref(false);
const deleteConfirmItem = ref(null);

const onAddClick = () => { addFormOpen.value = true; };

const onSubmitForm = async (form: any) => {
  const result = await createItem(form);
  if (result.success) {
    addFormOpen.value = false;
  } else {
    // Show error in form modal
  }
};

const onEdit = async (id: number, data: any) => {
  await updateItem(id, data);
};

const onDelete = (item: any) => {
  deleteConfirmItem.value = item;
  deleteConfirmOpen.value = true;
};

const onConfirmDelete = async () => {
  if (!deleteConfirmItem.value) return;
  await deleteItem(deleteConfirmItem.value.id);
  deleteConfirmOpen.value = false;
};

onMounted(() => loadData());
</script>
```

**Key Improvements**:
- Component reduced from 191 to ~80 lines
- Composable has reusable CRUD logic
- Each function has single responsibility
- Easy to test CRUD operations
- Predictable error handling
- Better separation of concerns

---

## Example 3: AppHeader Component Tests

### Adding Basic Tests (20 min)
```typescript
describe('AppHeader.vue', () => {
  let router: Router;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', name: 'dashboard', component: { template: '<div/>' } },
        { path: '/reference-data', name: 'reference-data', component: { template: '<div/>' } },
        { path: '/login', name: 'login', component: { template: '<div/>' } },
      ],
    });
    vi.clearAllMocks();
  });

  it('hides navigation when not authenticated', () => {
    authState.isAuthenticated = false;
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    expect(wrapper.find('nav').exists()).toBe(false);
  });

  it('shows navigation when authenticated', () => {
    authState.isAuthenticated = true;
    authState.token = 'test-token';
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    expect(wrapper.find('nav').exists()).toBe(true);
  });

  it('displays user name correctly', () => {
    authState.isAuthenticated = true;
    authState.user = { firstName: 'John', lastName: 'Doe' };
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    expect(wrapper.text()).toContain('John Doe');
  });

  it('highlights active dashboard route', () => {
    router.push({ name: 'dashboard' });
    authState.isAuthenticated = true;
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    const dashboardLink = wrapper.find('a[href*="dashboard"]');
    expect(dashboardLink.classes()).toContain('active');
  });

  it('logs out and redirects to login', async () => {
    authState.isAuthenticated = true;
    const wrapper = mount(AppHeader, { global: { plugins: [router] } });
    
    const logoutBtn = wrapper.find('button:has-text("Logout")');
    await logoutBtn.trigger('click');

    expect(authModule.clearToken).toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe('login');
  });
});
```

---

## Summary

These refactorings show:
1. **Before**: God composables/components doing too much
2. **After**: Focused composables with single responsibilities
3. **Benefit**: Easier to test, maintain, reuse, and understand
4. **ROI**: Small refactoring effort → significant coverage & maintainability gains

The pattern is consistent:
- Extract state management
- Extract business logic
- Extract API/service calls
- Component becomes thin view layer
