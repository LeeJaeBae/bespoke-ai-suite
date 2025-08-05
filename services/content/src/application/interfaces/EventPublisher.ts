export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  payload: any;
}

export class ContentCreatedEvent implements DomainEvent {
  eventId: string;
  eventType = 'content.created';
  aggregateId: string;
  timestamp: Date;
  payload: {
    contentId: string;
    userId: string;
    type: string;
    title: string;
  };

  constructor(contentId: string, userId: string, type: string, title: string) {
    this.eventId = generateEventId();
    this.aggregateId = contentId;
    this.timestamp = new Date();
    this.payload = { contentId, userId, type, title };
  }
}

export class ContentPublishedEvent implements DomainEvent {
  eventId: string;
  eventType = 'content.published';
  aggregateId: string;
  timestamp: Date;
  payload: {
    contentId: string;
    userId: string;
    publishedAt: Date;
  };

  constructor(contentId: string, userId: string) {
    this.eventId = generateEventId();
    this.aggregateId = contentId;
    this.timestamp = new Date();
    this.payload = { 
      contentId, 
      userId, 
      publishedAt: new Date() 
    };
  }
}

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}