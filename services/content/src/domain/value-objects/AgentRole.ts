/**
 * Agent Role Value Object
 * Domain Layer - Following DDD principles
 */

export class AgentRole {
  private static readonly VALID_ROLES = [
    'research',
    'planning',
    'creation',
    'review',
    'orchestrator'
  ] as const;

  private constructor(private readonly value: string) {}

  static create(role: string): AgentRole {
    if (!this.VALID_ROLES.includes(role as any)) {
      throw new Error(`Invalid agent role: ${role}`);
    }
    return new AgentRole(role);
  }

  static research(): AgentRole {
    return new AgentRole('research');
  }

  static planning(): AgentRole {
    return new AgentRole('planning');
  }

  static creation(): AgentRole {
    return new AgentRole('creation');
  }

  static review(): AgentRole {
    return new AgentRole('review');
  }

  static orchestrator(): AgentRole {
    return new AgentRole('orchestrator');
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AgentRole): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}