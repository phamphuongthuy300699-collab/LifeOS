/**
 * Base entity abstractions for all domain entities.
 */

export interface BaseEntityProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceEntityProps extends BaseEntityProps {
  workspaceId: string;
  userId: string;
}

/**
 * Base entity — all domain entities extend this.
 */
export abstract class BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: BaseEntityProps) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  protected touch(): void {
    this.updatedAt = new Date();
  }
}

/**
 * Workspace-scoped entity — has workspaceId and userId.
 */
export abstract class WorkspaceEntity extends BaseEntity {
  readonly workspaceId: string;
  readonly userId: string;

  constructor(props: WorkspaceEntityProps) {
    super(props);
    this.workspaceId = props.workspaceId;
    this.userId = props.userId;
  }
}
