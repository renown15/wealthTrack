/** API client for risk scenario endpoints */
import type { ScenarioDetail, ScenarioGroup, ScenarioListItem } from '@models/scenario';
import { BaseApiClient } from '@services/BaseApiClient';

class ScenarioService extends BaseApiClient {
  async listScenarios(): Promise<ScenarioListItem[]> {
    try {
      const r = await this.retryRequest(() => this.client.get<ScenarioListItem[]>('/api/v1/scenarios'));
      return r.data;
    } catch (e) { throw this.handleError(e, 'Failed to fetch scenarios'); }
  }

  async createScenario(name: string): Promise<ScenarioListItem> {
    try {
      const r = await this.retryRequest(() => this.client.post<ScenarioListItem>('/api/v1/scenarios', { name }));
      return r.data;
    } catch (e) { throw this.handleError(e, 'Failed to create scenario'); }
  }

  async getScenario(scenarioId: number): Promise<ScenarioDetail> {
    try {
      const r = await this.retryRequest(() => this.client.get<ScenarioDetail>(`/api/v1/scenarios/${scenarioId}`));
      return r.data;
    } catch (e) { throw this.handleError(e, 'Failed to fetch scenario'); }
  }

  async renameScenario(scenarioId: number, name: string): Promise<ScenarioListItem> {
    try {
      const r = await this.retryRequest(() => this.client.put<ScenarioListItem>(`/api/v1/scenarios/${scenarioId}`, { name }));
      return r.data;
    } catch (e) { throw this.handleError(e, 'Failed to rename scenario'); }
  }

  async deleteScenario(scenarioId: number): Promise<void> {
    try {
      await this.retryRequest(() => this.client.delete(`/api/v1/scenarios/${scenarioId}`));
    } catch (e) { throw this.handleError(e, 'Failed to delete scenario'); }
  }

  async addGroup(scenarioId: number, name: string): Promise<ScenarioGroup> {
    try {
      const r = await this.retryRequest(() => this.client.post<ScenarioGroup>(`/api/v1/scenarios/${scenarioId}/groups`, { name }));
      return r.data;
    } catch (e) { throw this.handleError(e, 'Failed to add group'); }
  }

  async renameGroup(scenarioId: number, linkId: number, name: string): Promise<ScenarioGroup> {
    try {
      const r = await this.retryRequest(() =>
        this.client.put<ScenarioGroup>(`/api/v1/scenarios/${scenarioId}/groups/${linkId}`, { name }),
      );
      return r.data;
    } catch (e) { throw this.handleError(e, 'Failed to rename group'); }
  }

  async deleteGroup(scenarioId: number, linkId: number): Promise<void> {
    try {
      await this.retryRequest(() => this.client.delete(`/api/v1/scenarios/${scenarioId}/groups/${linkId}`));
    } catch (e) { throw this.handleError(e, 'Failed to delete group'); }
  }

  async assignAccount(scenarioId: number, accountId: number, groupId: number | null): Promise<void> {
    try {
      await this.retryRequest(() =>
        this.client.post(`/api/v1/scenarios/${scenarioId}/assignments`, { accountId, groupId }),
      );
    } catch (e) { throw this.handleError(e, 'Failed to assign account'); }
  }
}

export const scenarioService = new ScenarioService();
