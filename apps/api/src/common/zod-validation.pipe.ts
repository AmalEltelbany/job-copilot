import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, type ZodType } from 'zod';

/** Validates a request body against a schema from @copilot/shared, so the web app and API use the same rules. */
export class ZodValidationPipe<T extends ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({ message: 'Validation failed', issues: z.flattenError(result.error) });
    }
    return result.data;
  }
}
