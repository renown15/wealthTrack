<template>
  <section>
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('institution')">
              Institution
              <span v-if="sortBy === 'institution'" class="ml-1">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('accountName')">
              Account Name
              <span v-if="sortBy === 'accountName'" class="ml-1">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('accountType')">
              Account Type
              <span v-if="sortBy === 'accountType'" class="ml-1">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('balance')">
              Latest Balance
              <span v-if="sortBy === 'balance'" class="ml-1">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('balanceUpdated')">
              Balance Updated
              <span v-if="sortBy === 'balanceUpdated'" class="ml-1">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('interestRate')">
              Interest Rate
              <span v-if="sortBy === 'interestRate'" class="ml-1">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="table-cell table-header text-left cursor-pointer hover:bg-gray-200" @click="setSortBy('fixedRateEnd')">
              Fixed Rate End
              <span v-if="sortBy === 'fixedRateEnd'" class="ml-1">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="table-cell table-header text-left">Events</th>
            <th class="table-cell table-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sortedItems" :key="item.account.id" class="table-row-hover">
            <td class="table-cell">{{ item.institution?.name || 'Unassigned' }}</td>
            <td class="table-cell font-semibold">{{ item.account.name }}</td>
            <td class="table-cell">{{ item.accountType || 'Unknown' }}</td>
            <td class="table-cell">
              <div v-if="editingBalanceId === item.account.id && !isDeferredShares(item) && !isRSU(item)" class="balance-edit">
                <input
                  v-model="editingBalanceValue"
                  type="text"
                  inputmode="decimal"
                  class="balance-input form-input py-1 px-2 w-28 text-sm"
                  @keydown.enter.prevent="saveBalance(item.account.id)"
                  @keydown.escape="cancelEdit"
                />
              </div>
              <button
                v-if="!isDeferredShares(item) && !isRSU(item)"
                type="button"
                class="flex items-center gap-1 text-left bg-transparent border-none cursor-pointer group"
                :title="isDeferredCash(item) ? getDeferredTooltip(item) : undefined"
                @click.stop="startEdit(item.account.id, getEditValue(item))"
              >
                <span class="font-semibold text-green-600">{{ formatCurrency(getDisplayBalance(item)) }}</span>
                <span v-if="isDeferredCash(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(item)">{{ Icons.info }}</span>
                <span class="text-muted opacity-0 group-hover:opacity-100 transition-opacity">{{ Icons.edit }}</span>
              </button>
              <div
                v-else
                class="flex items-center gap-1"
              >
                <div
                  :title="getDeferredTooltip(item)"
                  class="font-semibold text-green-600"
                >
                  {{ formatCurrency(getDisplayBalance(item)) }}
                </div>
                <span v-if="getDeferredTooltip(item)" class="text-blue-500 opacity-70 hover:opacity-100" :title="getDeferredTooltip(item)">{{ Icons.info }}</span>
              </div>
            </td>
            <td class="table-cell text-gray-600">
              {{ formatDate(item.latestBalance?.createdAt) }}
            </td>
            <td class="table-cell">
              {{ formatInterestRate(item.account.fixedBonusRate, item.account.interestRate) }}
            </td>
            <td class="table-cell">
              {{ formatDate(getFixedRateEndDate(item)) }}
            </td>
            <td class="table-cell">
              <button
                class="btn-events inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                type="button"
                @click="emitShowEvents(item.account.id, item.account.name, item.eventCount ?? 0)"
              >
                {{ item.eventCount ?? 0 }}
              </button>
            </td>
            <td class="table-cell">
              <div class="actions-col">
                <button
                  class="btn-icon edit inline-flex items-center justify-center w-9 h-9 text-lg rounded-lg border-none cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-200"
                  type="button"
                  @click="emitEdit(item.account)"
                  title="Edit account"
                >{{ Icons.edit }}</button>
                <button
                  class="btn-icon delete inline-flex items-center justify-center w-9 h-9 text-lg rounded-lg border-none cursor-pointer bg-red-100 text-red-600 hover:bg-red-200"
                  type="button"
                  @click="emitDelete('account', item.account.id, item.account.name)"
                  title="Delete account"
                >{{ Icons.delete }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue';
import type { Account, PortfolioItem } from '@/models/WealthTrackDataModels';
import { Icons } from '@/constants/icons';
import { 
  calculateDeferredSharesBalanceSafe, 
  calculateDeferredSharesBalanceDetailedSafe,
  calculateDeferredCashBalanceSafe,
  calculateDeferredCashBalanceDetailedSafe,
  calculateRSUBalanceSafe,
  calculateRSUBalanceDetailedSafe,
} from '@/utils/deferredSharesCalculator';

const props = defineProps<{
  items: PortfolioItem[];
}>();

const emit = defineEmits<{
  editAccount: [account: Account];
  deleteItem: [type: 'account' | 'institution', id: number, name: string];
  showEvents: [accountId: number, accountName: string, eventCount: number];
  updateBalance: [accountId: number, value: string];
}>();

const editingBalanceId = ref<number | null>(null);
const editingBalanceValue = ref('');
const sortBy = ref<string>('institution');
const sortDirection = ref<'asc' | 'desc'>('asc');

const setSortBy = (column: string): void => {
  if (sortBy.value === column) {
    // Toggle direction if clicking same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new column with asc direction
    sortBy.value = column;
    sortDirection.value = 'asc';
  }
};

const sortedItems = computed(() => {
  const items = [...props.items];
  
  items.sort((a, b) => {
    let aVal: any;
    let bVal: any;
    
    switch (sortBy.value) {
      case 'institution':
        aVal = a.institution?.name?.toLowerCase() || 'zzz';
        bVal = b.institution?.name?.toLowerCase() || 'zzz';
        break;
      case 'accountName':
        aVal = a.account.name?.toLowerCase() || '';
        bVal = b.account.name?.toLowerCase() || '';
        break;
      case 'accountType':
        aVal = a.accountType?.toLowerCase() || '';
        bVal = b.accountType?.toLowerCase() || '';
        break;
      case 'balance':
        aVal = getDisplayBalance(a);
        bVal = getDisplayBalance(b);
        const aNum = aVal ? parseFloat(aVal.toString()) : 0;
        const bNum = bVal ? parseFloat(bVal.toString()) : 0;
        if (aNum < bNum) return sortDirection.value === 'asc' ? -1 : 1;
        if (aNum > bNum) return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
      case 'balanceUpdated':
        aVal = a.latestBalance?.createdAt ? new Date(a.latestBalance.createdAt).getTime() : 0;
        bVal = b.latestBalance?.createdAt ? new Date(b.latestBalance.createdAt).getTime() : 0;
        break;
      case 'interestRate':
        aVal = a.account.interestRate ? parseFloat(a.account.interestRate) : 0;
        bVal = b.account.interestRate ? parseFloat(b.account.interestRate) : 0;
        break;
      case 'fixedRateEnd':
        aVal = a.account.fixedBonusRateEndDate ? new Date(a.account.fixedBonusRateEndDate).getTime() : 0;
        bVal = b.account.fixedBonusRateEndDate ? new Date(b.account.fixedBonusRateEndDate).getTime() : 0;
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
  
  return items;
});

const formatCurrency = (value?: string | number | null): string => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(numeric);
};

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const startEdit = (accountId: number, currentValue?: string | number | null): void => {
  editingBalanceId.value = accountId;
  const numeric = currentValue
    ? typeof currentValue === 'string'
      ? parseFloat(currentValue)
      : currentValue
    : 0;
  if (Number.isNaN(numeric)) {
    editingBalanceValue.value = '0';
  } else {
    // Format with commas for display
    editingBalanceValue.value = new Intl.NumberFormat('en-GB').format(numeric);
  }
  nextTick(() => {
    const input = document.querySelector('.balance-input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const cancelEdit = (): void => {
  editingBalanceId.value = null;
  editingBalanceValue.value = '';
};

const formatInterestRate = (fixedBonusRate?: string | null, interestRate?: string | null): string => {
  if (fixedBonusRate && interestRate) {
    return `${fixedBonusRate} (${interestRate})`;
  }
  if (fixedBonusRate) {
    return fixedBonusRate;
  }
  if (interestRate) {
    return interestRate;
  }
  return '—';
};

const handleClickOutside = (event: MouseEvent): void => {
  if (editingBalanceId.value === null) return;
  const target = event.target as HTMLElement;
  if (!target.closest('.balance-edit')) {
    cancelEdit();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const saveBalance = (accountId: number): void => {
  console.log('saveBalance called', { accountId, editingBalanceId: editingBalanceId.value, value: editingBalanceValue.value });
  if (editingBalanceId.value !== accountId) return;
  const value = editingBalanceValue.value.trim().replace(/,/g, '');
  if (value && !Number.isNaN(parseFloat(value))) {
    console.log('emitting updateBalance', { accountId, value });
    emit('updateBalance', accountId, value);
  }
  cancelEdit();
};

const emitEdit = (account: Account): void => {
  emit('editAccount', account);
};

const emitDelete = (type: 'account' | 'institution', id: number, name: string): void => {
  emit('deleteItem', type, id, name);
};

const emitShowEvents = (accountId: number, accountName: string, eventCount: number): void => {
  emit('showEvents', accountId, accountName, eventCount);
};

const isDeferredShares = (item: PortfolioItem): boolean => {
  return item.accountType === 'Deferred Shares';
};

const isDeferredCash = (item: PortfolioItem): boolean => {
  return item.accountType === 'Deferred Cash';
};

const isRSU = (item: PortfolioItem): boolean => {
  return item.accountType === 'RSU';
};

const getFixedRateEndDate = (item: PortfolioItem): string | null | undefined => {
  // For deferred account types, show release date if available
  if ((isDeferredShares(item) || isRSU(item) || isDeferredCash(item)) && item.account.releaseDate) {
    return item.account.releaseDate;
  }
  // Otherwise show fixed bonus rate end date
  return item.account.fixedBonusRateEndDate;
};

const getEditValue = (item: PortfolioItem): string | number | null | undefined => {
  // For Deferred Cash, return the gross (undiscounted) balance for editing
  if (isDeferredCash(item)) {
    return item.latestBalance?.value;
  }
  // For other accounts, return the display balance
  return getDisplayBalance(item);
};

const getDeferredTooltip = (item: PortfolioItem): string | undefined => {
  // Get detailed calculation for tooltip
  if (isDeferredShares(item)) {
    if (item.account.numberOfShares && item.account.price && item.account.purchasePrice) {
      const calculation = calculateDeferredSharesBalanceDetailedSafe(
        item.account.numberOfShares,
        item.account.price,
        item.account.purchasePrice
      );
      if (calculation) {
        const formatCurrencyForTooltip = (value: number): string => {
          return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(value);
        };
        const formatNumberForTooltip = (value: string | number): string => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          return new Intl.NumberFormat('en-GB').format(num);
        };
        const priceInPounds = (typeof item.account.price === 'string' ? parseFloat(item.account.price) : item.account.price) / 100;
        return `Shares: ${formatNumberForTooltip(item.account.numberOfShares)}\nPrice: ${formatCurrencyForTooltip(priceInPounds)}\nGross Amount: ${formatCurrencyForTooltip(calculation.grossAmount)}\nCapital Gains Tax (20%): ${formatCurrencyForTooltip(calculation.capitalGainsTax)}`;
      }
    }
  } else if (isDeferredCash(item)) {
    if (item.latestBalance?.value) {
      const valueInPounds = typeof item.latestBalance.value === 'string' 
        ? parseFloat(item.latestBalance.value) 
        : item.latestBalance.value;
      const balanceInPenceStr = String(Math.round(valueInPounds * 100));
      const calculation = calculateDeferredCashBalanceDetailedSafe(balanceInPenceStr);
      if (calculation) {
        const formatCurrencyForTooltip = (value: number): string => {
          return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(value);
        };
        return `Gross Amount: ${formatCurrencyForTooltip(calculation.grossAmount)}\nDiscount/Tax (47%): ${formatCurrencyForTooltip(calculation.taxDiscount)}`;
      }
    }
  } else if (isRSU(item)) {
    if (item.account.numberOfShares && item.account.price) {
      const calculation = calculateRSUBalanceDetailedSafe(
        item.account.numberOfShares,
        item.account.price
      );
      if (calculation) {
        const formatCurrencyForTooltip = (value: number): string => {
          return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
          }).format(value);
        };
        const formatNumberForTooltip = (value: string | number): string => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          return new Intl.NumberFormat('en-GB').format(num);
        };
        const priceInPounds = (typeof item.account.price === 'string' ? parseFloat(item.account.price) : item.account.price) / 100;
        return `Shares: ${formatNumberForTooltip(item.account.numberOfShares)}\nPrice: ${formatCurrencyForTooltip(priceInPounds)}\nGross Amount: ${formatCurrencyForTooltip(calculation.grossAmount)}\nTax Taken (47%): ${formatCurrencyForTooltip(calculation.taxTaken)}`;
      }
    }
  }
  return undefined;
};

const getDisplayBalance = (item: PortfolioItem): string | number | null | undefined => {
  // For Deferred Shares: apply deferred shares valuation formula
  // Balance = (shares × currentPrice) - (((shares × currentPrice) - (shares × purchasePrice)) × 0.2)
  // Simplified: shares × (0.8 × currentPrice + 0.2 × purchasePrice) / 100
  if (isDeferredShares(item)) {
    if (item.account.numberOfShares && item.account.price && item.account.purchasePrice) {
      const balance = calculateDeferredSharesBalanceSafe(
        item.account.numberOfShares,
        item.account.price,
        item.account.purchasePrice
      );
      console.log('[AccountHubTable] Deferred Shares calculation', {
        accountName: item.account.name,
        numberOfShares: item.account.numberOfShares,
        price: item.account.price,
        purchasePrice: item.account.purchasePrice,
        calculatedBalance: balance,
      });
      if (balance !== null) {
        return balance;
      }
    } else {
      console.warn('[AccountHubTable] Deferred Shares missing required fields', {
        accountName: item.account.name,
        hasShares: !!item.account.numberOfShares,
        hasPrice: !!item.account.price,
        hasPurchasePrice: !!item.account.purchasePrice,
      });
    }
  }
  
  // For Deferred Cash: apply 47% discount
  if (isDeferredCash(item)) {
    if (item.latestBalance?.value) {
      const valueInPounds = typeof item.latestBalance.value === 'string' 
        ? parseFloat(item.latestBalance.value) 
        : item.latestBalance.value;
      const balanceInPenceStr = String(Math.round(valueInPounds * 100));
      const balance = calculateDeferredCashBalanceSafe(balanceInPenceStr);
      console.log('[AccountHubTable] Deferred Cash calculation', {
        accountName: item.account.name,
        grossBalance: item.latestBalance.value,
        discountedBalance: balance,
      });
      if (balance !== null) {
        return balance;
      }
    } else {
      console.warn('[AccountHubTable] Deferred Cash missing balance', {
        accountName: item.account.name,
        hasBalance: !!item.latestBalance?.value,
      });
    }
  }
  
  // For RSU: apply 47% tax on (shares × price)
  if (isRSU(item)) {
    if (item.account.numberOfShares && item.account.price) {
      const balance = calculateRSUBalanceSafe(
        item.account.numberOfShares,
        item.account.price
      );
      console.log('[AccountHubTable] RSU calculation', {
        accountName: item.account.name,
        numberOfShares: item.account.numberOfShares,
        price: item.account.price,
        calculatedBalance: balance,
      });
      if (balance !== null) {
        return balance;
      }
    } else {
      console.warn('[AccountHubTable] RSU missing required fields', {
        accountName: item.account.name,
        hasShares: !!item.account.numberOfShares,
        hasPrice: !!item.account.price,
      });
    }
  }
  
  // Otherwise return stored balance
  const displayValue = item.latestBalance?.value;
  console.log('[AccountHubTable] Using latestBalance for', {
    accountName: item.account.name,
    accountType: item.accountType,
    balanceValue: displayValue,
  });
  return displayValue;
};
</script>

<!-- Uses UnoCSS utilities via shortcuts -->
