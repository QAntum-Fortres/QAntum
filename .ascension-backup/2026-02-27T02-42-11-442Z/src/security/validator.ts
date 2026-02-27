export type ValidatorFn = (value: any) => boolean;

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  email?: boolean;
  alphanumeric?: boolean;
}

export type SchemaDefinition = Record<string, FieldSchema>;

export class Schema {
  private definition: SchemaDefinition = {};
  private currentField: string | null = null;

  static create(): Schema {
    return new Schema();
  }

  string(field: string): Schema {
    this.currentField = field;
    this.definition[field] = { type: 'string' };
    return this;
  }

  required(): Schema {
    if (this.currentField) this.definition[this.currentField].required = true;
    return this;
  }

  minLength(len: number): Schema {
    if (this.currentField) this.definition[this.currentField].minLength = len;
    return this;
  }

  maxLength(len: number): Schema {
    if (this.currentField) this.definition[this.currentField].maxLength = len;
    return this;
  }

  email(): Schema {
    if (this.currentField) this.definition[this.currentField].email = true;
    return this;
  }

  alphanumeric(): Schema {
    if (this.currentField) this.definition[this.currentField].alphanumeric = true;
    return this;
  }

  getDefinition(): SchemaDefinition {
    return this.definition;
  }
}

export class InputValidator {
  private schemas: Map<string, Schema> = new Map();

  register(name: string, schema: Schema): void {
    this.schemas.set(name, schema);
  }

  validate(schemaName: string, data: any): ValidationResult {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
        return { valid: false, errors: [{ field: 'schema', message: `Schema ${schemaName} not found` }] };
    }

    const definition = schema.getDefinition();
    const errors: ValidationError[] = [];

    for (const [field, rules] of Object.entries(definition)) {
        const value = data[field];

        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push({ field, message: 'Required field missing' });
            continue;
        }

        if (value !== undefined && value !== null) {
             if (rules.type === 'string' && typeof value !== 'string') {
                 errors.push({ field, message: 'Must be a string' });
             }
             if (typeof value === 'string') {
                 if (rules.minLength && value.length < rules.minLength) {
                     errors.push({ field, message: `Must be at least ${rules.minLength} chars` });
                 }
                 if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                     errors.push({ field, message: 'Invalid email format' });
                 }
             }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
  }
}

export const validators = {};
export const sanitizers = {};
export function ValidateInput() { return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {}; }
