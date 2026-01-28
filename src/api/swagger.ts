/**
 * OpenAPI/Swagger specification for CyberAttacksNews API
 */

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CyberAttacksNews Incident Tracker API',
    description: 'Track cybersecurity incidents with severity, status progression, and timelines',
    version: '1.0.0',
    contact: {
      name: 'Support'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.cyberattacksnews.com/api',
      description: 'Production server'
    }
  ],
  paths: {
    '/incidents': {
      get: {
        summary: 'List all incidents',
        tags: ['Incidents'],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['reported', 'confirmed', 'ongoing', 'mitigated', 'resolved', 'disputed']
            },
            description: 'Filter by incident status'
          },
          {
            name: 'severity',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low']
            },
            description: 'Filter by severity'
          }
        ],
        responses: {
          200: {
            description: 'List of incidents',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Incident' }
                    },
                    count: {
                      type: 'integer'
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create new incident',
        tags: ['Incidents'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description'],
                properties: {
                  title: {
                    type: 'string',
                    minLength: 5,
                    maxLength: 500,
                    description: 'Incident title'
                  },
                  description: {
                    type: 'string',
                    minLength: 10,
                    maxLength: 5000,
                    description: 'Detailed incident description'
                  },
                  severity: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                    default: 'medium'
                  },
                  discovery_date: {
                    type: 'string',
                    format: 'date-time'
                  },
                  source_ids: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  classifications: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Incident created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Incident' }
              }
            }
          },
          400: {
            description: 'Validation error'
          }
        }
      }
    },
    '/incidents/{id}': {
      get: {
        summary: 'Get incident by ID',
        tags: ['Incidents'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Incident details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Incident' }
              }
            }
          },
          404: {
            description: 'Incident not found'
          }
        }
      },
      delete: {
        summary: 'Delete incident',
        tags: ['Incidents'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          204: {
            description: 'Incident deleted'
          },
          404: {
            description: 'Incident not found'
          }
        }
      }
    },
    '/incidents/{id}/status': {
      patch: {
        summary: 'Update incident status',
        tags: ['Incidents'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['reported', 'confirmed', 'ongoing', 'mitigated', 'resolved', 'disputed']
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Status updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Incident' }
              }
            }
          },
          400: {
            description: 'Invalid status transition'
          },
          404: {
            description: 'Incident not found'
          }
        }
      }
    },
    '/incidents/{id}/timeline': {
      get: {
        summary: 'Get incident timeline',
        tags: ['Timeline'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Timeline events',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TimelineEvent' }
                    },
                    count: {
                      type: 'integer'
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Add timeline event',
        tags: ['Timeline'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['event', 'details'],
                properties: {
                  event: {
                    type: 'string',
                    description: 'Event type'
                  },
                  details: {
                    type: 'object',
                    description: 'Event details'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Event added',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TimelineEvent' }
              }
            }
          }
        }
      }
    },
    '/incidents/check-duplicate': {
      post: {
        summary: 'Check for duplicate incidents',
        tags: ['Incidents'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'source'],
                properties: {
                  title: {
                    type: 'string'
                  },
                  source: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Duplicate check result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isDuplicate: { type: 'boolean' },
                    matchedIncidentId: { type: 'string' },
                    similarity: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Incident: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          title: {
            type: 'string'
          },
          description: {
            type: 'string'
          },
          severity: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low']
          },
          status: {
            type: 'string',
            enum: ['reported', 'confirmed', 'ongoing', 'mitigated', 'resolved', 'disputed']
          },
          discovery_date: {
            type: 'string',
            format: 'date-time'
          },
          last_updated: {
            type: 'string',
            format: 'date-time'
          },
          source_ids: {
            type: 'array',
            items: { type: 'string' }
          },
          classifications: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      TimelineEvent: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          incident_id: {
            type: 'string',
            format: 'uuid'
          },
          event: {
            type: 'string'
          },
          details: {
            type: 'object'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      }
    }
  }
};
