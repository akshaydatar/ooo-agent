import { google, calendar_v3 } from 'googleapis';
import { GoogleApiClient } from './client';

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
            type: e.eventType // 'default', 'outOfOffice', 'focusTime'
        }));
    }
}
