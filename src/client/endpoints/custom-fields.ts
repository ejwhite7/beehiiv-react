/**
 * Custom fields endpoint for the beehiiv API client.
 * Manages custom field definitions on a publication.
 * @module client/endpoints/custom-fields
 */

import type { BeehiivApiConfig } from '../../types/common.js';
import type {
  CustomFieldInfo,
  CustomFieldIndexResponse,
  CustomFieldResponse,
  CreateCustomFieldRequest,
  UpdateCustomFieldRequest,
} from '../../types/custom-field.js';

/**
 * Client for the /publications/:pubId/custom_fields endpoints.
 * Handles creating, reading, updating, and deleting custom field definitions.
 */
export class CustomFieldsEndpoint {
  private readonly _config: BeehiivApiConfig;

  constructor(config: BeehiivApiConfig) {
    this._config = config;
  }

  /** List all custom fields for the publication */
  async list(): Promise<CustomFieldIndexResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Get a single custom field by ID */
  async get(_id: string): Promise<CustomFieldResponse> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Create a new custom field */
  async create(_data: CreateCustomFieldRequest): Promise<CustomFieldInfo> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Update an existing custom field */
  async update(_id: string, _data: UpdateCustomFieldRequest): Promise<CustomFieldInfo> {
    void this._config;
    throw new Error('Not yet implemented');
  }

  /** Delete a custom field by ID */
  async delete(_id: string): Promise<void> {
    void this._config;
    throw new Error('Not yet implemented');
  }
}
