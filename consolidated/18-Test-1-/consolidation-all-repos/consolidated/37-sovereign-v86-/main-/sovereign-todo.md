// todo.service.ts
import { v4 as uuidv4 } from 'crypto';
import { logger } from './logger';
import { z } from 'zod';
import { validateTodo } from './validation.util';

class TodoService {
  private readonly todoSchema;

  constructor() {
    this.todoSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().min(1, 'Description is required'),
    });
  }

  async createTodo(title: string, description: string): Promise<{ todoId: string; title: string; description: string }> {
    try {
      const isValid = await validateTodo({ title, description });
      if (!isValid) {
        throw new Error('Invalid todo input');
      }

      const todoId = uuidv4();
      const createTodoResult = await this.createTodoInDatabase(todoId, title, description);
      await logger.logRequest('Create Todo', createTodoResult);
      return createTodoResult;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  private async createTodoInDatabase(todoId: string, title: string, description: string): Promise<{ todoId: string; title: string; description: string }> {
    // Update with actual database logic
    return { todoId, title, description };
  }
}

const todoService = new TodoService();

export { todoService };
```

```javascript
// logger.ts
import { createLogger } from 'pino';

const logger = createLogger({
  level: 'info',
  format: (info) => ({
    ...info,
    timestamp: new Date(info.time).toISOString(),
  }),
  transports: [
    {
      type: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: true,
      },
    },
  ],
});

export { logger };
```

```typescript
// error-handler.util.ts
import { HttpException } from '@nestjs/common';
import { Response } from 'express';

export async function handleError(error: Error, res: Response) {
  const errorLog = {
    message: error.message,
    status: error.status,
    stack: error.stack,
  };
  logger.error(errorLog);
  if (res) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
  throw error;
}
```

```typescript
// validation.ts
import { z } from 'zod';

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export async function validateTodo(data: any) {
  try {
    await createTodoSchema.parseAsync(data);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return false;
    }
    throw error;
  }
}
```

```typescript
// validation.util.ts
export async function isValidTodoInput(title: string, description: string) {
  return validateTodo({ title, description });
}
```

**