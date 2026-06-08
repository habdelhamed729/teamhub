import {
  BoardDTO,
  BoardColumnDTO,
  TaskDTO,
  TaskAssigneeDTO,
  TaskCommentDTO,
  BoardDetailDTO,
  UserStatus,
  TaskPriority
} from '@teamhub/shared';
import {
  Board as PrismaBoard,
  BoardColumn as PrismaBoardColumn,
  Task as PrismaTask,
  TaskAssignee as PrismaTaskAssignee,
  TaskComment as PrismaTaskComment,
  User as PrismaUser
} from '@prisma/client';

export const mapBoardToDTO = (board: PrismaBoard): BoardDTO => ({
  id: board.id,
  workspaceId: board.workspaceId,
  name: board.name,
  description: board.description,
  createdAt: board.createdAt,
  updatedAt: board.updatedAt,
});

export const mapColumnToDTO = (column: PrismaBoardColumn): BoardColumnDTO => ({
  id: column.id,
  boardId: column.boardId,
  name: column.name,
  order: column.order,
  createdAt: column.createdAt,
  updatedAt: column.updatedAt,
});

export const mapAssigneeToDTO = (assignee: PrismaTaskAssignee & { user: PrismaUser }): TaskAssigneeDTO => ({
  userId: assignee.userId,
  user: {
    id: assignee.user.id,
    email: assignee.user.email,
    display_name: assignee.user.display_name,
    avatar_url: assignee.user.avatar_url,
    status: assignee.user.status as UserStatus,
    created_at: assignee.user.created_at,
    updated_at: assignee.user.updated_at,
  },
  assignedAt: assignee.assignedAt,
});

export const mapTaskToDTO = (task: PrismaTask & { assignees: (PrismaTaskAssignee & { user: PrismaUser })[] }): TaskDTO => ({
  id: task.id,
  columnId: task.columnId,
  boardId: task.boardId,
  creatorId: task.creatorId,
  title: task.title,
  description: task.description,
  priority: task.priority as TaskPriority,
  order: task.order,
  dueDate: task.dueDate,
  assignees: task.assignees.map(mapAssigneeToDTO),
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

export const mapCommentToDTO = (comment: PrismaTaskComment & { author: PrismaUser }): TaskCommentDTO => ({
  id: comment.id,
  taskId: comment.taskId,
  authorId: comment.authorId,
  author: {
    id: comment.author.id,
    email: comment.author.email,
    display_name: comment.author.display_name,
    avatar_url: comment.author.avatar_url,
    status: comment.author.status as UserStatus,
    created_at: comment.author.created_at,
    updated_at: comment.author.updated_at,
  },
  content: comment.content,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export const mapBoardDetailToDTO = (
  board: PrismaBoard & { 
    columns: (PrismaBoardColumn & { 
      tasks: (PrismaTask & { 
        assignees: (PrismaTaskAssignee & { user: PrismaUser })[] 
      })[] 
    })[] 
  }
): BoardDetailDTO => ({
  ...mapBoardToDTO(board),
  columns: board.columns.map(col => ({
    ...mapColumnToDTO(col),
    tasks: col.tasks.map(mapTaskToDTO)
  }))
});
