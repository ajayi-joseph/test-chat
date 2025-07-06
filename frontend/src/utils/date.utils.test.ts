import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimestamp } from './date.utils';


describe('dateUtils', () => {
  describe('formatTimestamp', () => {
    beforeEach(() => {
      // Mock the current date to ensure consistent tests
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('formats today\'s date with "Today" prefix', () => {
      const now = new Date('2024-01-15T14:30:00');
      vi.setSystemTime(now);

      const todayMorning = new Date('2024-01-15T09:15:00');
      const todayEvening = new Date('2024-01-15T20:45:00');

      expect(formatTimestamp(todayMorning)).toMatch(/^Today/);
      expect(formatTimestamp(todayMorning)).toMatch(/9:15/);
      expect(formatTimestamp(todayMorning)).toMatch(/AM/);

      expect(formatTimestamp(todayEvening)).toMatch(/^Today/);
      expect(formatTimestamp(todayEvening)).toMatch(/8:45/);
      expect(formatTimestamp(todayEvening)).toMatch(/PM/);
    });

    it('formats yesterday\'s date with "Yesterday" prefix', () => {
      const now = new Date('2024-01-15T14:30:00');
      vi.setSystemTime(now);

      const yesterdayMorning = new Date('2024-01-14T09:15:00');
      const yesterdayEvening = new Date('2024-01-14T20:45:00');

      expect(formatTimestamp(yesterdayMorning)).toMatch(/^Yesterday/);
      expect(formatTimestamp(yesterdayMorning)).toMatch(/9:15/);
      expect(formatTimestamp(yesterdayMorning)).toMatch(/AM/);

      expect(formatTimestamp(yesterdayEvening)).toMatch(/^Yesterday/);
      expect(formatTimestamp(yesterdayEvening)).toMatch(/8:45/);
      expect(formatTimestamp(yesterdayEvening)).toMatch(/PM/);
    });

    it('formats older dates with full date and time', () => {
      const now = new Date('2024-01-15T14:30:00');
      vi.setSystemTime(now);

      const lastWeek = new Date('2024-01-08T15:30:00');
      const lastMonth = new Date('2023-12-25T10:00:00');

      // The exact format might vary by locale, but should include these elements
      expect(formatTimestamp(lastWeek)).toMatch(/JANUARY 8 2024/);
      expect(formatTimestamp(lastWeek)).toMatch(/3:30 PM/);
      
      expect(formatTimestamp(lastMonth)).toMatch(/DECEMBER 25 2023/);
      expect(formatTimestamp(lastMonth)).toMatch(/10:00 AM/);
    });

    it('handles midnight correctly', () => {
      const now = new Date('2024-01-15T00:30:00'); // 30 minutes after midnight
      vi.setSystemTime(now);

      const justBeforeMidnight = new Date('2024-01-14T23:59:00');
      const justAfterMidnight = new Date('2024-01-15T00:01:00');

      expect(formatTimestamp(justBeforeMidnight)).toMatch(/^Yesterday/);
      expect(formatTimestamp(justBeforeMidnight)).toMatch(/11:59/);
      expect(formatTimestamp(justBeforeMidnight)).toMatch(/PM/);

      expect(formatTimestamp(justAfterMidnight)).toMatch(/^Today/);
      expect(formatTimestamp(justAfterMidnight)).toMatch(/12:01/);
      expect(formatTimestamp(justAfterMidnight)).toMatch(/AM/);
    });

    it('handles noon correctly', () => {
      const now = new Date('2024-01-15T14:30:00');
      vi.setSystemTime(now);

      const noon = new Date('2024-01-15T12:00:00');
      const justAfterNoon = new Date('2024-01-15T12:01:00');

      expect(formatTimestamp(noon)).toMatch(/^Today/);
      expect(formatTimestamp(noon)).toMatch(/12:00/);
      expect(formatTimestamp(noon)).toMatch(/PM/);

      expect(formatTimestamp(justAfterNoon)).toMatch(/^Today/);
      expect(formatTimestamp(justAfterNoon)).toMatch(/12:01/);
      expect(formatTimestamp(justAfterNoon)).toMatch(/PM/);
    });

    it('formats single-digit minutes with leading zero', () => {
      const now = new Date('2024-01-15T14:30:00');
      vi.setSystemTime(now);

      const earlyMorning = new Date('2024-01-15T09:05:00');
      
      expect(formatTimestamp(earlyMorning)).toMatch(/^Today/);
      expect(formatTimestamp(earlyMorning)).toMatch(/9:05/);
      expect(formatTimestamp(earlyMorning)).toMatch(/AM/);
    });

    it('handles year boundaries correctly', () => {
      const now = new Date('2024-01-02T10:00:00');
      vi.setSystemTime(now);

      const yesterday = new Date('2024-01-01T15:00:00');
      const lastYearDec31 = new Date('2023-12-31T15:00:00');

      expect(formatTimestamp(yesterday)).toMatch(/^Yesterday/);
      expect(formatTimestamp(yesterday)).toMatch(/3:00/);
      expect(formatTimestamp(yesterday)).toMatch(/PM/);

      expect(formatTimestamp(lastYearDec31)).toMatch(/DECEMBER 31 2023/);
    });

    it('handles leap year edge case', () => {
      const now = new Date('2024-03-01T10:00:00'); // 2024 is a leap year
      vi.setSystemTime(now);

      const feb29 = new Date('2024-02-29T14:00:00');
      
      expect(formatTimestamp(feb29)).toMatch(/^Yesterday/);
      expect(formatTimestamp(feb29)).toMatch(/2:00/);
      expect(formatTimestamp(feb29)).toMatch(/PM/);
    });

    it('removes comma from date format', () => {
      const now = new Date('2024-01-15T14:30:00');
      vi.setSystemTime(now);

      const oldDate = new Date('2024-01-01T10:00:00');
      const formatted = formatTimestamp(oldDate);

      // Should not contain comma
      expect(formatted).not.toContain(',');
    });

    it('returns mixed case format for today/yesterday', () => {
      const now = new Date('2024-01-15T14:30:00');
      vi.setSystemTime(now);

      const today = new Date('2024-01-15T09:30:00');
      const yesterday = new Date('2024-01-14T09:30:00');
      const older = new Date('2024-01-10T09:30:00');

      // Today and Yesterday use mixed case, older dates are uppercase
      const todayResult = formatTimestamp(today);
      const yesterdayResult = formatTimestamp(yesterday);
      const olderResult = formatTimestamp(older);

      expect(todayResult).toMatch(/^Today/);
      expect(todayResult).toMatch(/AM$/);
      
      expect(yesterdayResult).toMatch(/^Yesterday/);
      expect(yesterdayResult).toMatch(/PM|AM$/);
      
      // Older dates should be fully uppercase
      expect(olderResult).toBe(olderResult.toUpperCase());
    });

    it('handles different times of day correctly', () => {
      const now = new Date('2024-01-15T10:00:00');
      vi.setSystemTime(now);

      // Test various times on the same day
      const morning = new Date('2024-01-15T08:30:00');
      const afternoon = new Date('2024-01-15T14:30:00');
      const evening = new Date('2024-01-15T18:45:00');

      // Check that it starts with Today and contains the time
      expect(formatTimestamp(morning)).toMatch(/^Today/);
      expect(formatTimestamp(morning)).toMatch(/8:30/);
      expect(formatTimestamp(morning)).toMatch(/AM/);

      expect(formatTimestamp(afternoon)).toMatch(/^Today/);
      expect(formatTimestamp(afternoon)).toMatch(/2:30/);
      expect(formatTimestamp(afternoon)).toMatch(/PM/);

      expect(formatTimestamp(evening)).toMatch(/^Today/);
      expect(formatTimestamp(evening)).toMatch(/6:45/);
      expect(formatTimestamp(evening)).toMatch(/PM/);
    });
  });
});