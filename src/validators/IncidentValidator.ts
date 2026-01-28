import { IncidentStatus, SeverityLevel } from '../models/incident';

export class ValidationError extends Error {
  constructor(public field: string, public message: string) {
    super(`${field}: ${message}`);
    this.name = 'ValidationError';
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class IncidentValidator {
  static validateTitle(title: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!title || title.trim().length === 0) {
      errors.push(new ValidationError('title', 'Title is required'));
    }

    if (title.length < 5) {
      errors.push(new ValidationError('title', 'Title must be at least 5 characters'));
    }

    if (title.length > 500) {
      errors.push(new ValidationError('title', 'Title must not exceed 500 characters'));
    }

    return errors;
  }

  static validateDescription(description: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!description || description.trim().length === 0) {
      errors.push(new ValidationError('description', 'Description is required'));
    }

    if (description.length < 10) {
      errors.push(new ValidationError('description', 'Description must be at least 10 characters'));
    }

    if (description.length > 5000) {
      errors.push(new ValidationError('description', 'Description must not exceed 5000 characters'));
    }

    return errors;
  }

  static validateSeverity(severity: string): ValidationError[] {
    const validSeverities: SeverityLevel[] = ['critical', 'high', 'medium', 'low'];
    const errors: ValidationError[] = [];

    if (!validSeverities.includes(severity as any)) {
      errors.push(
        new ValidationError('severity', `Severity must be one of: ${validSeverities.join(', ')}`)
      );
    }

    return errors;
  }

  static validateStatus(status: string): ValidationError[] {
    const validStatuses: IncidentStatus[] = ['reported', 'confirmed', 'ongoing', 'mitigated', 'resolved', 'disputed'];
    const errors: ValidationError[] = [];

    if (!validStatuses.includes(status as any)) {
      errors.push(
        new ValidationError('status', `Status must be one of: ${validStatuses.join(', ')}`)
      );
    }

    return errors;
  }

  static validateDate(date: any): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        errors.push(new ValidationError('date', 'Invalid date format'));
      }
    } catch {
      errors.push(new ValidationError('date', 'Invalid date format'));
    }

    return errors;
  }

  static validateIncidentCreation(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    errors.push(...this.validateTitle(data.title || ''));
    errors.push(...this.validateDescription(data.description || ''));
    errors.push(...this.validateSeverity(data.severity || 'medium'));

    if (data.discovery_date) {
      errors.push(...this.validateDate(data.discovery_date));
    }

    return errors;
  }

  static validateStatusUpdate(currentStatus: IncidentStatus, newStatus: string): ValidationError[] {
    const errors: ValidationError[] = [];

    errors.push(...this.validateStatus(newStatus));

    const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
      'reported': ['confirmed', 'disputed'],
      'confirmed': ['ongoing', 'disputed'],
      'ongoing': ['mitigated', 'disputed'],
      'mitigated': ['resolved', 'disputed'],
      'resolved': ['disputed'],
      'disputed': ['reported', 'confirmed']
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus as IncidentStatus)) {
      errors.push(
        new ValidationError('status', `Cannot transition from ${currentStatus} to ${newStatus}`)
      );
    }

    return errors;
  }
}

export class SourceValidator {
  static validateSourceType(type: string): ValidationError[] {
    const validTypes = ['rss', 'json_api', 'email'];
    const errors: ValidationError[] = [];

    if (!validTypes.includes(type)) {
      errors.push(
        new ValidationError('type', `Type must be one of: ${validTypes.join(', ')}`)
      );
    }

    return errors;
  }

  static validateUrl(url: string): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      new URL(url);
    } catch {
      errors.push(new ValidationError('url', 'Invalid URL format'));
    }

    return errors;
  }

  static validateSourceCreation(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push(new ValidationError('name', 'Source name is required'));
    }

    errors.push(...this.validateSourceType(data.type || ''));
    errors.push(...this.validateUrl(data.url || ''));

    return errors;
  }
}
