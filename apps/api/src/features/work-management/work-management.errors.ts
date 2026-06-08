export class WorkManagementError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'WorkManagementError';
  }
}

export class NotFoundError extends WorkManagementError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends WorkManagementError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends WorkManagementError {
  constructor(message: string) {
    super(message, 422);
    this.name = 'ValidationError';
  }
}
