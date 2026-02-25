import { google, calendar_v3 } from 'googleapis';
import { GoogleApiClient } from './client';
import { ContextItem } from '@/modules/context/types';

export class CalendarClient extends GoogleApiClient {
    private calendar: calendar_v3.Calendar;

    constructor(userId: string) {
        super(userId);
        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    }

    /**
     * Determine if user is currently OOO by checking their primary calendar out-of-office events.
     */
    async isUserOOO(): Promise<boolean> {
        await this.authenticate();

        const timeMin = new Date().toISOString();
        // Look ahead 24 hours
        const timeMaxObj = new Date();
        timeMaxObj.setHours(timeMaxObj.getHours() + 24);
        const timeMax = timeMaxObj.toISOString();

        const response = await this.calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            eventTypes: ['outOfOffice'] // Specifically look for standard OOO event types
        });

        const events = response.data.items || [];
        return events.length > 0;
    }

    /**
     * Retrieve a detailed schedule for the upcoming days.
     */
    async retrieveUpcomingSchedule(daysLimit: number = 7): Promise<any[]> {
        await this.authenticate();

        const timeMin = new Date().toISOString();
        const timeMaxObj = new Date();
        timeMaxObj.setDate(timeMaxObj.getDate() + daysLimit);
        const timeMax = timeMaxObj.toISOString();

        const response = await this.calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime'
        });

        const events = response.data.items || [];
        // Map to simpler structure
        return events.map(e => ({
            id: e.id,
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date,
        }));
    }

    /**
     * Fetch recent calendar events for context indexing.
     */
    async fetchRecentEvents(maxResults: number = 50): Promise<ContextItem[]> {
        await this.authenticate();

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const response = await this.calendar.events.list({
            calendarId: 'primary',
            timeMin: sixMonthsAgo.toISOString(),
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];
        const contextItems: ContextItem[] = [];

        for (const event of events) {
            if (!event.id) continue;

            const attendees = new Set<string>();
            event.attendees?.forEach(a => {
                if (a.email) attendees.add(a.email);
            });

            const summary = event.summary || 'No Title';
            const description = event.description || '';
            const location = event.location || 'No Location';

            contextItems.push({
                id: event.id,
                type: 'calendar_event',
                content: `Meeting: ${summary}\nLocation: ${location}\nDescription: ${description}`,
                metadata: {
                    summary,
                    organizer: event.organizer?.email || 'Unknown',
                    attendees: Array.from(attendees),
                    startTime: event.start?.dateTime || event.start?.date,
                    endTime: event.end?.dateTime || event.end?.date,
                },
                createdAt: new Date()
            });
        }

        return contextItems;
    }
}
