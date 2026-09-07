import { createDAVClient } from 'tsdav'

export default defineEventHandler(async (event) => {
  try {
    const client = await createDAVClient({
      serverUrl: 'https://cis.technikum-wien.at/webdav/lvplan.php/principals/el26b041',
      credentials: {
        username: 'el26b041',
        password: process.env.PASSWORD,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    })

    const calendars = await client.fetchCalendars()

    if (!calendars.length) {
      return { events: [] }
    }

    const calendar = calendars[0]!

    console.log('CALENDAR:', calendar.url)

    const events = await client.fetchCalendarObjects({
      calendar: calendars[0]!,
    })

    console.log('EVENTS:', events)

    return {
      calendars,
      events,
    }
  } catch (error: any) {
    console.error(error)

    throw createError({
      statusCode: 500,
      statusMessage: `CalDAV Fehler: ${error.message}`,
    })
  }
})
