import { WorkspaceEntity, type WorkspaceEntityProps } from '@lifeos/domain-core';

export interface EventEntityProps extends WorkspaceEntityProps {
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  status: 'tentative' | 'confirmed' | 'cancelled';
  calendarRef: string | null;
  externalId: string | null;
}

export class EventEntity extends WorkspaceEntity {
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  status: 'tentative' | 'confirmed' | 'cancelled';
  calendarRef: string | null;
  externalId: string | null;

  constructor(props: EventEntityProps) {
    super(props);
    this.title = props.title;
    this.description = props.description;
    this.location = props.location;
    this.startAt = props.startAt;
    this.endAt = props.endAt;
    this.isAllDay = props.isAllDay;
    this.status = props.status;
    this.calendarRef = props.calendarRef;
    this.externalId = props.externalId;
  }

  cancel(): void {
    this.status = 'cancelled';
    this.touch();
  }

  reschedule(startAt: Date, endAt: Date): void {
    this.startAt = startAt;
    this.endAt = endAt;
    this.touch();
  }
}
