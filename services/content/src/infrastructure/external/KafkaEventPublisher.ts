import { EventPublisher, DomainEvent } from '@application/interfaces/EventPublisher.js';

export class KafkaEventPublisher implements EventPublisher {
  private kafkaProducer: any; // In real implementation, would use Kafka client

  constructor(config: { brokers: string[]; clientId: string }) {
    // Initialize Kafka producer
    console.log('Initializing Kafka producer...', config);
    // this.kafkaProducer = new Kafka(config).producer();
  }

  async publish(event: DomainEvent): Promise<void> {
    console.log(`Publishing event: ${event.eventType}`, {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      timestamp: event.timestamp,
      payload: event.payload
    });

    // In real implementation:
    // await this.kafkaProducer.send({
    //   topic: this.getTopicForEvent(event.eventType),
    //   messages: [{
    //     key: event.aggregateId,
    //     value: JSON.stringify(event),
    //     headers: {
    //       'event-type': event.eventType,
    //       'event-id': event.eventId,
    //       'timestamp': event.timestamp.toISOString()
    //     }
    //   }]
    // });
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    console.log(`Publishing ${events.length} events in batch`);
    
    // In real implementation, would send all events in a single Kafka transaction
    for (const event of events) {
      await this.publish(event);
    }
  }

  private getTopicForEvent(eventType: string): string {
    // Map event types to Kafka topics
    const topicMap: Record<string, string> = {
      'content.created': 'content-events',
      'content.published': 'content-events',
      'content.archived': 'content-events',
      'content.deleted': 'content-events'
    };

    return topicMap[eventType] || 'domain-events';
  }
}