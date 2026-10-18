import { Controller, Get, UseGuards } from '@nestjs/common';
import type { DashboardDto } from '@copilot/shared';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, type AuthUser } from '../common/request-context.js';
import { LlmService } from '../llm/llm.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { QueueService } from '../queue/queue.service.js';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly queue: QueueService,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthUser): Promise<DashboardDto> {
    const userId = user.id;
    const [profile, sources, jobs, scored, strongOrGood, applications, callsToday] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId }, select: { version: true } }),
      this.prisma.jobSource.count({ where: { userId } }),
      this.prisma.job.count({ where: { userId, filteredOut: null } }),
      this.prisma.match.count({ where: { userId } }),
      this.prisma.match.count({ where: { userId, verdict: { in: ['STRONG', 'GOOD'] } } }),
      this.prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true }),
      this.llm.callsToday(userId),
    ]);
    // The UI polls this while work is pending, which resumes anything left in the queue.
    this.queue.kick();
    return {
      hasProfile: !!profile,
      sources,
      jobs,
      scored,
      strongOrGood,
      pendingScoring: Math.max(0, jobs - scored),
      applications: Object.fromEntries(applications.map((a) => [a.status, a._count])),
      usage: { llmCallsToday: callsToday, dailyLimit: this.llm.dailyLimit() },
    };
  }
}
